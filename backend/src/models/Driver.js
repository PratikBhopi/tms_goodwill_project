const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  license_number: { type: String, required: true, unique: true },
  license_expiry: { type: Date, required: true },
  status: {
    type: String,
    enum: ['available', 'on_trip', 'inactive'],
    default: 'available',
  },
});

module.exports = mongoose.model('Driver', driverSchema);
