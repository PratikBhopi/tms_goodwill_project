const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assigned_driver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },
    assigned_vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', default: null },
    pickup_address: { type: String, required: true },
    dropoff_address: { type: String, required: true },
    goods_type: { type: String, required: true },
    weight_kg: { type: Number, required: true },
    preferred_date: { type: Date, required: true },
    preferred_time: { type: String },
    special_instructions: { type: String },
    estimated_price: { type: Number, required: true },
    final_price: { type: Number },
    price_override_reason: { type: String },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'],
      default: 'pending',
    },
    payment_mode: {
      type: String,
      enum: ['online', 'cod'],
    },
    payment_status: {
      type: String,
      enum: ['pending', 'paid', 'cod_pending', 'cod_paid'],
      default: 'pending',
    },
    payment_gateway_order_id: { type: String },
    pod_photo_url: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
