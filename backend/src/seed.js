require('dotenv').config();
const bcrypt = require('bcrypt');
const connectDB = require('./db');
const User = require('./models/User');
const Driver = require('./models/Driver');
const Vehicle = require('./models/Vehicle');

async function seed() {
  await connectDB();

  // Clear existing seed data
  await User.deleteMany({});
  await Driver.deleteMany({});
  await Vehicle.deleteMany({});

  const password_hash = await bcrypt.hash('password123', 12);

  // Create users
  const [owner, staff, customer, driverUser1, driverUser2] = await User.insertMany([
    { name: 'Owner User', email: 'owner@goodwill.com', phone: '9000000001', password_hash, role: 'owner' },
    { name: 'Staff User', email: 'staff@goodwill.com', phone: '9000000002', password_hash, role: 'staff' },
    { name: 'Customer User', email: 'customer@goodwill.com', phone: '9000000003', password_hash, role: 'customer' },
    { name: 'Driver One', email: 'driver1@goodwill.com', phone: '9000000004', password_hash, role: 'driver' },
    { name: 'Driver Two', email: 'driver2@goodwill.com', phone: '9000000005', password_hash, role: 'driver' },
  ]);

  // Create drivers linked to driver users
  await Driver.insertMany([
    {
      user_id: driverUser1._id,
      license_number: 'DL-001-2024',
      license_expiry: new Date('2027-12-31'),
      status: 'available',
    },
    {
      user_id: driverUser2._id,
      license_number: 'DL-002-2024',
      license_expiry: new Date('2026-06-30'),
      status: 'available',
    },
  ]);

  // Create vehicles
  await Vehicle.insertMany([
    {
      registration_number: 'MH-01-AB-1234',
      type: 'Truck',
      capacity_tons: 5,
      owner_name: 'GoodWill Logistics',
      status: 'available',
    },
    {
      registration_number: 'MH-01-CD-5678',
      type: 'Van',
      capacity_tons: 1.5,
      owner_name: 'GoodWill Logistics',
      status: 'available',
    },
  ]);

  console.log('Seed complete');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
