const transporter = require('../config/mailer');
const { User } = require('../models');

exports.newOrderToStaff = async (order) => {
  const staffList = await User.find({ role: 'STAFF', isActive: true });
  for (const staff of staffList) {
    await transporter.sendMail({
      to: staff.email,
      from: process.env.SMTP_FROM || 'no-reply@goodwill.com',
      subject: `New Order #${order.id.slice(0,8)} — Pending Assignment`,
      text: `A new transport order has been placed and needs assignment.\n\nPickup: ${order.pickupAddress}\nDrop-off: ${order.dropoffAddress}\nGoods: ${order.goodsType} (${order.weightKg} kg)\n\nLog in to the admin panel to assign.`
    });
  }
};

exports.orderAssigned = async (order) => {
  const driverName = order.driver?.user?.name || 'our driver';
  await transporter.sendMail({
    to: order.customer?.email,
    from: process.env.SMTP_FROM || 'no-reply@goodwill.com',
    subject: `Your Order #${order.id.slice(0,8)} has been assigned`,
    text: `Your transport order has been assigned to ${driverName}.\n\nPickup: ${order.pickupAddress}\nDrop-off: ${order.dropoffAddress}\n\nYou can track the status in My Orders.`
  });
};

exports.statusUpdate = async (order, newStatus) => {
  const messages = {
    PICKED_UP:  'Your goods have been picked up and are on their way.',
    IN_TRANSIT: 'Your delivery is in transit.',
  };
  const customer = await User.findById(order.customerId || order.customer);
  if (!customer) return;
  await transporter.sendMail({
    to: customer.email,
    from: process.env.SMTP_FROM || 'no-reply@goodwill.com',
    subject: `Order #${order.id.slice(0,8)} Update`,
    text: messages[newStatus] || `Your order status has been updated to ${newStatus}.`
  });
};

exports.orderDelivered = async (order) => {
  const customer = await User.findById(order.customerId || order.customer);
  if (!customer) return;
  await transporter.sendMail({
    to: customer.email,
    from: process.env.SMTP_FROM || 'no-reply@goodwill.com',
    subject: `Order #${order.id.slice(0,8)} — Delivered`,
    text: `Your order has been delivered successfully. You can view the Proof of Delivery in My Orders on the portal.`
  });
};
