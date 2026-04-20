const express = require('express');
const router = express.Router();

const { verifyJWT, requireRole } = require('../middleware/auth');
const Order = require('../models/Order');
const OrderStatusLog = require('../models/OrderStatusLog');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const { estimatePrice } = require('../utils/priceEstimator');
const notificationService = require('../services/notificationService');

/**
 * POST /api/orders
 * Create a new transport order.
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */
router.post('/', verifyJWT, requireRole('customer'), async (req, res, next) => {
  try {
    const {
      pickup_address,
      dropoff_address,
      goods_type,
      weight_kg,
      preferred_date,
      preferred_time,
      special_instructions,
    } = req.body;

    // Validate required fields
    if (!pickup_address || !dropoff_address || !goods_type || weight_kg == null || !preferred_date) {
      return res.status(400).json({ error: 'Missing required fields: pickup_address, dropoff_address, goods_type, weight_kg, preferred_date' });
    }

    // Check active order limit (max 5)
    const activeStatuses = ['pending', 'assigned', 'picked_up', 'in_transit'];
    const activeCount = await Order.countDocuments({
      customer_id: req.user.userId,
      status: { $in: activeStatuses },
    });

    if (activeCount >= 5) {
      return res.status(400).json({ error: 'Active order limit reached' });
    }

    // Calculate estimated price
    const estimated_price = estimatePrice(pickup_address, dropoff_address, weight_kg);

    // Create the order
    const order = await Order.create({
      customer_id: req.user.userId,
      pickup_address,
      dropoff_address,
      goods_type,
      weight_kg,
      preferred_date,
      preferred_time,
      special_instructions,
      estimated_price,
      status: 'pending',
      payment_status: 'pending',
    });

    // Record initial status log entry
    await OrderStatusLog.create({
      order_id: order._id,
      from_status: null,
      to_status: 'pending',
      changed_by: req.user.userId,
    });

    // Fire-and-forget notifications
    (async () => {
      try {
        const activeStaff = await User.find({ role: 'staff', is_active: true }).select('_id');
        await notificationService.sendOrderCreated(order, req.user.userId, activeStaff);
      } catch (err) {
        console.error('Notification error (sendOrderCreated):', err);
      }
    })();

    return res.status(201).json({ order });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/orders
 * Returns all orders belonging to the authenticated customer.
 * Supports optional query params: status, from, to (date range on createdAt).
 * Validates: Requirements 3.1, 3.2, 3.3
 */
router.get('/', verifyJWT, requireRole('customer'), async (req, res, next) => {
  try {
    const filter = { customer_id: req.user.userId };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
      if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ orders });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/orders/all
 * Returns all orders to authenticated staff, grouped by status.
 * Supports optional query params: status, from, to, driver_id.
 * MUST be defined before GET /:id to avoid Express treating "all" as an id param.
 * Validates: Requirements 4.1, 4.2
 */
router.get('/all', verifyJWT, requireRole('staff'), async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
      if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
    }

    if (req.query.driver_id) {
      filter.assigned_driver_id = req.query.driver_id;
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 });

    // Group by status
    const grouped = {};
    for (const order of orders) {
      const s = order.status;
      if (!grouped[s]) grouped[s] = [];
      grouped[s].push(order);
    }

    return res.status(200).json({ grouped, orders });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/orders/:id
 * Returns a single order by ID with populated driver, vehicle, and status log.
 * - Customer: only their own orders.
 * - Driver: only orders assigned to them.
 * - Staff: any order.
 * Validates: Requirements 3.4, 3.5, 7.2
 */
router.get('/:id', verifyJWT, requireRole('customer', 'staff', 'driver'), async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate({ path: 'assigned_driver_id', populate: { path: 'user_id', select: 'name' } })
      .populate('assigned_vehicle_id', 'registration_number');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Role-based ownership checks
    if (req.user.role === 'customer') {
      if (order.customer_id.toString() !== req.user.userId) {
        return res.status(404).json({ error: 'Order not found' });
      }
    }

    if (req.user.role === 'driver') {
      const driverRecord = await Driver.findOne({ user_id: req.user.userId });
      if (!driverRecord || !order.assigned_driver_id ||
          order.assigned_driver_id._id.toString() !== driverRecord._id.toString()) {
        return res.status(404).json({ error: 'Order not found' });
      }
    }

    // Fetch status log sorted ascending
    const statusLog = await OrderStatusLog.find({ order_id: order._id }).sort({ changed_at: 1 });

    const result = order.toObject();
    result.status_log = statusLog;

    // Include driver name + vehicle reg for assigned or later statuses
    const assignedOrLater = ['assigned', 'picked_up', 'in_transit', 'delivered'];
    if (assignedOrLater.includes(order.status) && order.assigned_driver_id) {
      result.driver_name = order.assigned_driver_id.user_id?.name || null;
      result.vehicle_registration = order.assigned_vehicle_id?.registration_number || null;
    }

    // Include POD URL only when delivered
    if (order.status !== 'delivered') {
      delete result.pod_photo_url;
    }

    return res.status(200).json({ order: result });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/orders/:id/assign
 * Assign a driver and vehicle to a pending order.
 * Validates: Requirements 4.4, 4.5, 4.6, 4.7, 9.6
 */
router.patch('/:id/assign', verifyJWT, requireRole('staff'), async (req, res, next) => {
  try {
    const { driver_id, vehicle_id } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Order is not in pending status' });
    }

    // Req 9.6: block assignment when payment is pending
    if (order.payment_status === 'pending') {
      return res.status(400).json({ error: 'Cannot assign driver: payment is pending' });
    }

    // Validate driver exists and is active
    const driver = await Driver.findById(driver_id).populate('user_id', 'is_active');
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    if (!driver.user_id?.is_active || driver.status === 'inactive') {
      return res.status(400).json({ error: 'Driver is deactivated' });
    }

    // Req 4.5: check driver has no active trip
    const activeTrips = await Order.countDocuments({
      assigned_driver_id: driver._id,
      status: { $in: ['assigned', 'picked_up', 'in_transit'] },
    });
    if (activeTrips > 0) {
      return res.status(400).json({ error: 'Driver already has an active trip' });
    }

    // Validate vehicle exists
    const vehicle = await Vehicle.findById(vehicle_id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Update order
    order.status = 'assigned';
    order.assigned_driver_id = driver._id;
    order.assigned_vehicle_id = vehicle._id;
    await order.save();

    // Req 4.6: update vehicle status to in_use
    vehicle.status = 'in_use';
    await vehicle.save();

    // Req 13.3: record status log
    await OrderStatusLog.create({
      order_id: order._id,
      from_status: 'pending',
      to_status: 'assigned',
      changed_by: req.user.userId,
    });

    // Fire-and-forget notification (Req 4.7)
    notificationService.sendOrderAssigned(order, driver).catch((err) =>
      console.error('Notification error (sendOrderAssigned):', err)
    );

    return res.status(200).json({ order });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/orders/:id/status
 * Driver updates trip status: assigned → picked_up, picked_up → in_transit.
 * Validates: Requirements 7.3, 7.4, 7.5, 7.6
 */
router.patch('/:id/status', verifyJWT, requireRole('driver'), async (req, res, next) => {
  try {
    const { status: newStatus } = req.body;

    const VALID_TRANSITIONS = {
      assigned: 'picked_up',
      picked_up: 'in_transit',
    };

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Verify this order belongs to the authenticated driver
    const driver = await Driver.findOne({ user_id: req.user.userId });
    if (!driver || !order.assigned_driver_id ||
        order.assigned_driver_id.toString() !== driver._id.toString()) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Validate transition
    const expectedNext = VALID_TRANSITIONS[order.status];
    if (!expectedNext || newStatus !== expectedNext) {
      return res.status(400).json({
        error: `Invalid transition: ${order.status} → ${newStatus}`,
      });
    }

    const fromStatus = order.status;
    order.status = newStatus;
    await order.save();

    // Req 13.3: record status log
    await OrderStatusLog.create({
      order_id: order._id,
      from_status: fromStatus,
      to_status: newStatus,
      changed_by: req.user.userId,
    });

    // Fire-and-forget notification (Req 7.6)
    notificationService.sendStatusUpdate(order, newStatus).catch((err) =>
      console.error('Notification error (sendStatusUpdate):', err)
    );

    return res.status(200).json({ order });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/orders/:id/cancel
 * Staff cancels an order (only from 'pending' or 'assigned').
 * Validates: Requirement 4.4
 */
router.patch('/:id/cancel', verifyJWT, requireRole('staff'), async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const cancellableStatuses = ['pending', 'assigned'];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({ error: 'Cannot cancel order in current status' });
    }

    const fromStatus = order.status;
    order.status = 'cancelled';
    await order.save();

    // Req 13.3: record status log
    await OrderStatusLog.create({
      order_id: order._id,
      from_status: fromStatus,
      to_status: 'cancelled',
      changed_by: req.user.userId,
    });

    return res.status(200).json({ order });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/orders/:id/price
 * Staff sets or overrides the final price for a pending or assigned order.
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4
 */
router.patch('/:id/price', verifyJWT, requireRole('staff'), async (req, res, next) => {
  try {
    const { final_price, price_override_reason } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Req 5.3: reject if payment already completed
    if (order.payment_status === 'paid' || order.payment_status === 'cod_paid') {
      return res.status(400).json({ error: 'Cannot adjust price: payment already completed' });
    }

    // Req 5.4: only allow for pending or assigned orders
    if (!['pending', 'assigned'].includes(order.status)) {
      return res.status(400).json({ error: 'Price can only be adjusted for pending or assigned orders' });
    }

    // Req 5.2: require a non-empty reason
    if (!price_override_reason || typeof price_override_reason !== 'string' || price_override_reason.trim() === '') {
      return res.status(400).json({ error: 'price_override_reason is required' });
    }

    // Req 5.1: require a positive final_price
    if (typeof final_price !== 'number' || final_price <= 0) {
      return res.status(400).json({ error: 'final_price must be a positive number' });
    }

    order.final_price = final_price;
    order.price_override_reason = price_override_reason.trim();
    await order.save();

    return res.status(200).json({ order });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/orders/:id/pod
 * Driver uploads proof of delivery photo, transitions order to 'delivered'.
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */
const upload = require('../middleware/upload');

router.post(
  '/:id/pod',
  verifyJWT,
  requireRole('driver'),
  (req, res, next) => upload.single('photo')(req, res, (err) => {
    if (err) return next(err);
    next();
  }),
  async (req, res, next) => {
    try {
      // Req 8.6: reject non-JPEG/PNG (multer fileFilter rejected the file)
      if (!req.file) {
        return res.status(400).json({ error: 'Only JPEG and PNG files are allowed' });
      }

      const order = await Order.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Req 8.5: order must be in_transit
      if (order.status !== 'in_transit') {
        return res.status(400).json({ error: 'Order must be in_transit to upload POD' });
      }

      // Verify the authenticated driver owns this order
      const driver = await Driver.findOne({ user_id: req.user.userId });
      if (!driver || !order.assigned_driver_id ||
          order.assigned_driver_id.toString() !== driver._id.toString()) {
        return res.status(400).json({ error: 'Not authorized for this order' });
      }

      const pod_photo_url = `/uploads/${req.file.filename}`;

      // Req 8.2: transition to delivered
      order.status = 'delivered';
      order.pod_photo_url = pod_photo_url;
      await order.save();

      // Req 8.3: set vehicle back to available
      if (order.assigned_vehicle_id) {
        await Vehicle.findByIdAndUpdate(order.assigned_vehicle_id, { status: 'available' });
      }

      // Req 13.3: record status log
      await OrderStatusLog.create({
        order_id: order._id,
        from_status: 'in_transit',
        to_status: 'delivered',
        changed_by: req.user.userId,
      });

      // Req 8.4: fire-and-forget delivery notification
      notificationService.sendDelivered(order).catch((err) =>
        console.error('Notification error (sendDelivered):', err)
      );

      return res.status(200).json({ pod_url: pod_photo_url, status: 'delivered' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;

