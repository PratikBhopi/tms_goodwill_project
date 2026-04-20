const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');

const { verifyJWT, requireRole } = require('../middleware/auth');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const notificationService = require('../services/notificationService');

const router = express.Router();

/**
 * POST /api/payments/create-order
 * Creates a Razorpay order for an existing TMS order.
 * Protected: customer only.
 * Validates: Requirements 9.1, 9.2, 9.7
 */
router.post('/create-order', verifyJWT, requireRole('customer'), async (req, res, next) => {
  try {
    const { orderId, amount } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.customer_id.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const rzpOrder = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: orderId.toString(),
    });

    order.payment_gateway_order_id = rzpOrder.id;
    await order.save();

    // Never expose key_secret — only return key_id (Req 9.7)
    return res.status(200).json({
      razorpay_order_id: rzpOrder.id,
      key_id: process.env.RAZORPAY_KEY_ID,
      amount,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/payments/webhook
 * Handles Razorpay webhook events. Public — no auth.
 * Validates: Requirements 9.3, 9.7, 10.6
 */
router.post('/webhook', async (req, res, next) => {
  try {
    const body = req.body;
    const signature = req.headers['x-razorpay-signature'];

    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(JSON.stringify(body))
      .digest('hex');

    if (signature !== expectedSig) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    if (body.event === 'payment.captured') {
      const paymentEntity = body.payload.payment.entity;
      const rzpOrderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;
      const amount = paymentEntity.amount;

      const order = await Order.findOne({ payment_gateway_order_id: rzpOrderId });
      if (order) {
        order.payment_status = 'paid';
        await order.save();

        await Transaction.create({
          order_id: order._id,
          customer_id: order.customer_id,
          payment_mode: 'online',
          payment_status: 'paid',
          amount,
          gateway_transaction_id: paymentId,
        });

        // Fire-and-forget payment receipt notification (Req 10.6)
        notificationService.sendPaymentReceipt(order).catch(() => {});
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/payments/cod-collected/:orderId
 * Marks a COD order as collected by staff.
 * Protected: staff only.
 * Validates: Requirement 9.5
 */
router.patch('/cod-collected/:orderId', verifyJWT, requireRole('staff'), async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.payment_status = 'cod_paid';
    await order.save();

    await Transaction.create({
      order_id: order._id,
      customer_id: order.customer_id,
      payment_mode: 'cod',
      payment_status: 'cod_paid',
      amount: order.final_price || order.estimated_price,
    });

    return res.status(200).json({ order });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
