const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Reads an HTML template and replaces {{key}} placeholders.
 */
function renderTemplate(templateName, variables) {
  const templatePath = path.join(__dirname, '../../templates', `${templateName}.html`);
  let html = fs.readFileSync(templatePath, 'utf8');
  for (const [key, value] of Object.entries(variables)) {
    html = html.split(`{{${key}}}`).join(value ?? '');
  }
  return html;
}

/**
 * Fire-and-forget email send with error logging.
 */
function sendEmail(to, subject, html) {
  transporter
    .sendMail({ from: process.env.SMTP_FROM, to, subject, html })
    .catch((err) => console.error('[NotificationService] sendMail error:', err));
}

async function sendPasswordReset(email, token) {
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/customer/reset-password?token=${token}`;
  const user = await User.findOne({ email });
  const html = renderTemplate('password-reset', {
    name: user ? user.name : email,
    reset_link: resetLink,
  });
  sendEmail(email, 'Reset your password', html);
}

async function sendOrderCreated(order, customerId, staffList) {
  const customer = await User.findById(customerId);
  const variables = {
    name: customer ? customer.name : 'Customer',
    order_id: order._id.toString(),
    pickup_address: order.pickup_address,
    dropoff_address: order.dropoff_address,
    estimated_price: order.estimated_price != null ? `\u20B9${order.estimated_price}` : 'TBD',
  };

  if (customer) {
    sendEmail(customer.email, 'Order Confirmed', renderTemplate('order-created', variables));
  }

  for (const staff of staffList) {
    const staffUser = typeof staff === 'object' && staff.email
      ? staff
      : await User.findById(staff._id || staff);
    if (staffUser && staffUser.email) {
      sendEmail(
        staffUser.email,
        'New Order Received',
        renderTemplate('order-created', { ...variables, name: staffUser.name || staffUser.email })
      );
    }
  }
}

async function sendOrderAssigned(order, driver) {
  const customer = await User.findById(order.customer_id);
  const driverUser = await User.findById(driver.user_id);

  const driverName = driverUser ? driverUser.name : 'Your driver';
  const vehicleReg = order.assigned_vehicle_id
    ? (order.assigned_vehicle_id.registration_number || order.assigned_vehicle_id.toString())
    : 'N/A';

  const variables = {
    order_id: order._id.toString(),
    driver_name: driverName,
    vehicle_reg: vehicleReg,
  };

  if (customer) {
    sendEmail(customer.email, 'Driver Assigned', renderTemplate('order-assigned', { ...variables, name: customer.name }));
  }
  if (driverUser) {
    sendEmail(driverUser.email, 'New Trip Assigned', renderTemplate('order-assigned', { ...variables, name: driverUser.name }));
  }
}

async function sendStatusUpdate(order, newStatus) {
  const customer = await User.findById(order.customer_id);
  if (!customer) return;
  const html = renderTemplate('status-update', {
    name: customer.name,
    order_id: order._id.toString(),
    status: newStatus,
  });
  sendEmail(customer.email, 'Order Status Update', html);
}

async function sendDelivered(order) {
  const customer = await User.findById(order.customer_id);
  if (!customer) return;
  const html = renderTemplate('order-delivered', {
    name: customer.name,
    order_id: order._id.toString(),
  });
  sendEmail(customer.email, 'Order Delivered', html);
}

async function sendPaymentReceipt(order) {
  const customer = await User.findById(order.customer_id);
  if (!customer) return;
  const amount = order.final_price ?? order.estimated_price;
  const html = renderTemplate('payment-receipt', {
    name: customer.name,
    order_id: order._id.toString(),
    amount: amount != null ? `\u20B9${amount}` : 'N/A',
  });
  sendEmail(customer.email, 'Payment Receipt', html);
}

async function sendDriverCredentials(email, name, tempPassword) {
  const html = renderTemplate('driver-credentials', { name, email, temp_password: tempPassword });
  sendEmail(email, 'Your Driver Account Credentials', html);
}

module.exports = {
  renderTemplate,
  sendEmail,
  sendPasswordReset,
  sendOrderCreated,
  sendOrderAssigned,
  sendStatusUpdate,
  sendDelivered,
  sendPaymentReceipt,
  sendDriverCredentials,
};
