const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PasswordResetToken = require('../models/PasswordResetToken');
const notificationService = require('../services/notificationService');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'name, email, phone, and password are required' });
    }

    // Check for duplicate email
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Hash password with bcrypt cost factor 12 (Requirement 13.1)
    const password_hash = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password_hash,
      role: 'customer',
      is_active: true,
    });

    return res.status(201).json({ message: 'Registration successful', userId: user._id });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Look up user by email
    const user = await User.findOne({ email });

    // User not found — return generic 401 (Requirement 1.5)
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password against stored hash
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Reject deactivated accounts (Requirement 1.6)
    if (!user.is_active) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Sign JWT with userId and role, 7-day expiry (Requirement 1.4)
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({ token });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/forgot-password (Requirement 1.7)
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    const genericResponse = { message: 'If that email exists, a reset link has been sent' };

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal whether the email exists
      return res.status(200).json(genericResponse);
    }

    // Generate a random token and store its sha256 hash
    const token = crypto.randomBytes(32).toString('hex');
    const token_hash = crypto.createHash('sha256').update(token).digest('hex');

    await PasswordResetToken.create({
      user_id: user._id,
      token_hash,
      expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      used: false,
    });

    // Fire-and-forget — don't let email failure block the response
    try {
      await notificationService.sendPasswordReset(user.email, token);
    } catch (_) {
      // Notification failure is non-fatal
    }

    return res.status(200).json(genericResponse);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/reset-password (Requirement 1.7)
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'token and password are required' });
    }

    const token_hash = crypto.createHash('sha256').update(token).digest('hex');

    const resetToken = await PasswordResetToken.findOne({
      token_hash,
      used: false,
      expires_at: { $gt: new Date() },
    });

    if (!resetToken) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    await User.findByIdAndUpdate(resetToken.user_id, { password_hash });
    await PasswordResetToken.findByIdAndUpdate(resetToken._id, { used: true });

    return res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
