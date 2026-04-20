const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  payment_mode: {
    type: String,
    enum: ['online', 'cod'],
    required: true,
  },
  payment_status: {
    type: String,
    enum: ['paid', 'cod_paid'],
    required: true,
  },
  amount: { type: Number, required: true },
  gateway_transaction_id: { type: String },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Transaction', transactionSchema);
