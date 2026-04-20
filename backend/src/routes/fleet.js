const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const router = express.Router();
const { verifyJWT, requireRole } = require('../middleware/auth');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const notificationService = require('../services/notificationService');

// ─── Task 9.1: POST /drivers ──────────────────────────────────────────────────
// Validates: Requirements 6.1, 6.2
router.post('/drivers', verifyJWT, requireRole('staff'), async (req, res, next) => {
  try {
    const { name, email, phone, license_number, license_expiry } = req.body;

    if (!name || !email || !phone || !license_number || !license_expiry) {
      return res.status(400).json({ error: 'name, email, phone, license_number, and license_expiry are required' });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const existingLicense = await Driver.findOne({ license_number });
    if (existingLicense) {
      return res.status(400).json({ error: 'License number already in use' });
    }

    const tempPassword = crypto.randomBytes(8).toString('hex');
    const password_hash = await bcrypt.hash(tempPassword, 12);

    const user = await User.create({ name, email, phone, password_hash, role: 'driver', is_active: true });
    const driver = await Driver.create({ user_id: user._id, license_number, license_expiry, status: 'available' });

    // Fire-and-forget
    notificationService.sendDriverCredentials(email, name, tempPassword).catch(() => {});

    return res.status(201).json({
      driver,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
});

// ─── Task 9.2: GET /drivers ───────────────────────────────────────────────────
// Validates: Requirements 6.3
router.get('/drivers', verifyJWT, requireRole('staff'), async (_req, res, next) => {
  try {
    const drivers = await Driver.find().populate('user_id', 'name email phone is_active');
    return res.json({ drivers });
  } catch (err) {
    next(err);
  }
});

// ─── Task 9.2: PATCH /drivers/:id/deactivate ─────────────────────────────────
// Must be before PATCH /drivers/:id to avoid Express matching "deactivate" as id
// Validates: Requirements 6.3, 6.6
router.patch('/drivers/:id/deactivate', verifyJWT, requireRole('staff'), async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    await User.findByIdAndUpdate(driver.user_id, { is_active: false });
    driver.status = 'inactive';
    await driver.save();

    return res.json({ message: 'Driver deactivated' });
  } catch (err) {
    next(err);
  }
});

// ─── Task 9.2: PATCH /drivers/:id ────────────────────────────────────────────
// Validates: Requirements 6.3
router.patch('/drivers/:id', verifyJWT, requireRole('staff'), async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const { name, phone, license_number, license_expiry } = req.body;

    if (name !== undefined || phone !== undefined) {
      const updates = {};
      if (name !== undefined) updates.name = name;
      if (phone !== undefined) updates.phone = phone;
      await User.findByIdAndUpdate(driver.user_id, updates);
    }

    if (license_number !== undefined) driver.license_number = license_number;
    if (license_expiry !== undefined) driver.license_expiry = license_expiry;
    await driver.save();

    const updatedDriver = await Driver.findById(driver._id).populate('user_id', 'name email phone is_active');
    return res.json({ driver: updatedDriver });
  } catch (err) {
    next(err);
  }
});

// ─── Task 9.3: POST /vehicles ─────────────────────────────────────────────────
// Validates: Requirements 6.4
router.post('/vehicles', verifyJWT, requireRole('staff'), async (req, res, next) => {
  try {
    const { registration_number, type, capacity_tons, owner_name } = req.body;

    if (!registration_number || !type || capacity_tons === undefined) {
      return res.status(400).json({ error: 'registration_number, type, and capacity_tons are required' });
    }

    const existing = await Vehicle.findOne({ registration_number });
    if (existing) {
      return res.status(400).json({ error: 'Registration number already in use' });
    }

    const vehicle = await Vehicle.create({ registration_number, type, capacity_tons, owner_name });
    return res.status(201).json({ vehicle });
  } catch (err) {
    next(err);
  }
});

// ─── Task 9.3: GET /vehicles ──────────────────────────────────────────────────
// Validates: Requirements 6.4, 6.5
router.get('/vehicles', verifyJWT, requireRole('staff'), async (_req, res, next) => {
  try {
    const vehicles = await Vehicle.find();
    return res.json({ vehicles });
  } catch (err) {
    next(err);
  }
});

// ─── Task 9.3: PATCH /vehicles/:id ───────────────────────────────────────────
// Validates: Requirements 6.5
router.patch('/vehicles/:id', verifyJWT, requireRole('staff'), async (req, res, next) => {
  try {
    const { type, capacity_tons, owner_name, status } = req.body;

    const validStatuses = ['available', 'in_use', 'under_maintenance'];
    if (status !== undefined && !validStatuses.includes(status)) {
      return res.status(400).json({ error: "status must be one of 'available', 'in_use', 'under_maintenance'" });
    }

    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    if (type !== undefined) vehicle.type = type;
    if (capacity_tons !== undefined) vehicle.capacity_tons = capacity_tons;
    if (owner_name !== undefined) vehicle.owner_name = owner_name;
    if (status !== undefined) vehicle.status = status;
    await vehicle.save();

    return res.json({ vehicle });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
