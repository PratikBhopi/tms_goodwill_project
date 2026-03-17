const { Order, OrderStatusLog, ProofOfDelivery, Vehicle, Driver } = require('../models');
const pricing  = require('../services/pricing.service');
const notify   = require('../services/notification.service');
const { sendSuccess, sendError } = require('../utils/apiResponse');

exports.placeOrder = async (req, res, next) => {
  try {
    const { pickupAddress, dropoffAddress, goodsType, weightKg, preferredDate, specialNotes } = req.body;
    const estimatedPrice = await pricing.estimate({ pickupAddress, dropoffAddress, weightKg });

    const order = await Order.create({
      customerId: req.user.id,
      pickupAddress, dropoffAddress, goodsType,
      weightKg: parseFloat(weightKg),
      preferredDate: new Date(preferredDate),
      specialNotes,
      estimatedPrice,
      status: 'PENDING',
    });

    await OrderStatusLog.create({ orderId: order._id, status: 'PENDING' });

    await notify.newOrderToStaff(order);
    sendSuccess(res, { orderId: order._id.toString(), estimatedPrice }, 201);
  } catch (err) { next(err); }
};

exports.assignOrder = async (req, res, next) => {
  try {
    const { driverId, vehicleId, finalPrice, priceNote } = req.body;
    const { id } = req.params;

    const activeTrip = await Order.findOne({ driverId, status: { $in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'] } });
    if (activeTrip) return sendError(res, 409, 'Driver already has an active trip');

    const order = await Order.findByIdAndUpdate(id, {
      driverId, vehicleId,
      finalPrice: finalPrice ? parseFloat(finalPrice) : undefined,
      priceNote,
      status: 'ASSIGNED'
    }, { new: true }).populate('customer').populate({ path: 'driver', populate: { path: 'user' } });

    await Vehicle.findByIdAndUpdate(vehicleId, { status: 'IN_USE' });
    await OrderStatusLog.create({ orderId: id, status: 'ASSIGNED' });

    await notify.orderAssigned(order);
    sendSuccess(res, { message: 'Order assigned successfully' });
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const { id } = req.params;

    const order = await Order.findById(id);
    const validNext = { ASSIGNED: 'PICKED_UP', PICKED_UP: 'IN_TRANSIT' };
    
    if (validNext[order.status] !== status) {
      return sendError(res, 400, `Cannot move from ${order.status} to ${status}`);
    }

    order.status = status;
    await order.save();
    
    await OrderStatusLog.create({ orderId: id, status, note });

    await notify.statusUpdate(order, status);
    sendSuccess(res, { message: `Order status updated to ${status}` });
  } catch (err) { next(err); }
};

exports.uploadPOD = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!req.file) return sendError(res, 400, 'POD photo is required');

    const photoUrl = `/uploads/${req.file.filename}`;

    await ProofOfDelivery.create({ orderId: id, photoUrl });
    const order = await Order.findByIdAndUpdate(id, { status: 'DELIVERED' }, { new: true });

    if (order.vehicleId) {
      await Vehicle.findByIdAndUpdate(order.vehicleId, { status: 'AVAILABLE' });
    }

    await OrderStatusLog.create({ orderId: id, status: 'DELIVERED' });
    await notify.orderDelivered(order);

    sendSuccess(res, { message: 'Delivery confirmed', photoUrl });
  } catch (err) { next(err); }
};

exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ customerId: req.user.id }).sort({ createdAt: -1 });
    sendSuccess(res, orders.map(o => ({ ...o.toObject(), id: o._id.toString() })));
  } catch (err) { next(err); }
};

exports.getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate('customer')
      .populate({ path: 'driver', populate: { path: 'user' } })
      .populate('vehicle')
      .sort({ createdAt: -1 });
    sendSuccess(res, orders.map(o => ({ ...o.toObject(), id: o._id.toString() })));
  } catch (err) { next(err); }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer')
      .populate({ path: 'driver', populate: { path: 'user' } })
      .populate('vehicle')
      .populate('statusLogs')
      .populate('pod');
    if (!order) return sendError(res, 404, 'Order not found');
    sendSuccess(res, { ...order.toObject(), id: order._id.toString() });
  } catch (err) { next(err); }
};

exports.getMyTrips = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ userId: req.user.id });
    if (!driver) return sendError(res, 404, 'Driver profile not found');
    const orders = await Order.find({ driverId: driver._id }).populate('customer').sort({ createdAt: -1 });
    sendSuccess(res, orders.map(o => ({ ...o.toObject(), id: o._id.toString() })));
  } catch (err) { next(err); }
};
