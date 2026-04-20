const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  registration_number: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  capacity_tons: { type: Number, required: true },
  owner_name: { type: String },
  status: {
    type: String,
    enum: ['available', 'in_use', 'under_maintenance'],
    default: 'available',
  },
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
