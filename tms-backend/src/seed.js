const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('./models');
require('dotenv').config();

const connectDB = async () => {
  await mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/tms_goodwill');
};

async function main() {
  await connectDB();
  const hash = await bcrypt.hash('Admin@123', 12);

  const existingStaff = await User.findOne({ email: 'staff@goodwill.com' });
  if (!existingStaff) {
    await User.create({ name: 'Sanjay Deshmukh', email: 'staff@goodwill.com', phone: '9876543210', passwordHash: hash, role: 'STAFF' });
  }

  const existingOwner = await User.findOne({ email: 'owner@goodwill.com' });
  if (!existingOwner) {
    await User.create({ name: 'Business Owner', email: 'owner@goodwill.com', phone: '9876543211', passwordHash: hash, role: 'OWNER' });
  }

  console.log('Seed complete. Default Staff and Owner ensured to exist.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
