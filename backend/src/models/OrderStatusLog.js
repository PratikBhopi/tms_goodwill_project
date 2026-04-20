const mongoose = require('mongoose');

const orderStatusLogSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  from_status: { type: String },
  to_status: { type: String, required: true },
  changed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  note: { type: String },
  changed_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('OrderStatusLog', orderStatusLogSchema);
