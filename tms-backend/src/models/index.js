const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, default: null },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['CUSTOMER', 'STAFF', 'DRIVER', 'OWNER'], required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

UserSchema.virtual('orders', { ref: 'Order', localField: '_id', foreignField: 'customerId' });
UserSchema.virtual('driverProfile', { ref: 'Driver', localField: '_id', foreignField: 'userId', justOne: true });
UserSchema.set('toObject', { virtuals: true });
UserSchema.set('toJSON', { virtuals: true });

const DriverSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  licenseNumber: { type: String, required: true, unique: true },
  licenseExpiry: { type: Date, required: true },
  isAvailable: { type: Boolean, default: true },
}, { timestamps: true });

DriverSchema.virtual('user', { ref: 'User', localField: 'userId', foreignField: '_id', justOne: true });
DriverSchema.set('toObject', { virtuals: true });
DriverSchema.set('toJSON', { virtuals: true });

const VehicleSchema = new mongoose.Schema({
  registrationNo: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  capacityTons: { type: Number, required: true },
  ownerName: { type: String, default: null },
  status: { type: String, enum: ['AVAILABLE', 'IN_USE', 'UNDER_MAINTENANCE'], default: 'AVAILABLE' }
}, { timestamps: true });

const OrderSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pickupAddress: { type: String, required: true },
  dropoffAddress: { type: String, required: true },
  goodsType: { type: String, required: true },
  weightKg: { type: Number, required: true },
  preferredDate: { type: Date, required: true },
  preferredTime: { type: String, default: null },
  specialNotes: { type: String, default: null },
  status: { type: String, enum: ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'], default: 'PENDING' },
  estimatedPrice: { type: Number, default: null },
  finalPrice: { type: Number, default: null },
  priceNote: { type: String, default: null },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', default: null },
}, { timestamps: true });

OrderSchema.virtual('customer', { ref: 'User', localField: 'customerId', foreignField: '_id', justOne: true });
OrderSchema.virtual('driver', { ref: 'Driver', localField: 'driverId', foreignField: '_id', justOne: true });
OrderSchema.virtual('vehicle', { ref: 'Vehicle', localField: 'vehicleId', foreignField: '_id', justOne: true });
OrderSchema.virtual('statusLogs', { ref: 'OrderStatusLog', localField: '_id', foreignField: 'orderId' });
OrderSchema.virtual('pod', { ref: 'ProofOfDelivery', localField: '_id', foreignField: 'orderId', justOne: true });
OrderSchema.virtual('payment', { ref: 'Payment', localField: '_id', foreignField: 'orderId', justOne: true });
OrderSchema.set('toObject', { virtuals: true });
OrderSchema.set('toJSON', { virtuals: true });

const OrderStatusLogSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  status: { type: String, required: true },
  note: { type: String, default: null },
}, { timestamps: true });

const PaymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  mode: { type: String, enum: ['ONLINE', 'COD'], required: true },
  status: { type: String, enum: ['PENDING', 'PAID', 'COD_PENDING', 'COD_PAID', 'FAILED'], default: 'PENDING' },
  amount: { type: Number, required: true },
  transactionId: { type: String, default: null },
  paidAt: { type: Date, default: null },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

const ProofOfDeliverySchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  photoUrl: { type: String, required: true },
}, { timestamps: true });

module.exports = {
  User: mongoose.model('User', UserSchema),
  Driver: mongoose.model('Driver', DriverSchema),
  Vehicle: mongoose.model('Vehicle', VehicleSchema),
  Order: mongoose.model('Order', OrderSchema),
  OrderStatusLog: mongoose.model('OrderStatusLog', OrderStatusLogSchema),
  Payment: mongoose.model('Payment', PaymentSchema),
  ProofOfDelivery: mongoose.model('ProofOfDelivery', ProofOfDeliverySchema),
};
