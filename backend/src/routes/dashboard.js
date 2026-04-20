const express = require('express');
const router = express.Router();
const { verifyJWT, requireRole } = require('../middleware/auth');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');

const protect = [verifyJWT, requireRole('owner')];

/**
 * GET /api/dashboard/summary
 * Returns today's key stats.
 * Validates: Requirements 11.1
 */
router.get('/summary', protect, async (req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [today_orders, in_transit_count, revenueResult, available_vehicles] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: startOfToday } }),
      Order.countDocuments({ status: 'in_transit' }),
      Transaction.aggregate([
        { $match: { created_at: { $gte: startOfToday } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Vehicle.countDocuments({ status: 'available' }),
    ]);

    const today_revenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
    res.json({ today_orders, in_transit_count, today_revenue, available_vehicles });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/dashboard/trends
 * Returns daily order counts for the last 7 days.
 * Validates: Requirements 11.2
 */
router.get('/trends', protect, async (req, res, next) => {
  try {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      days.push(d);
    }

    const trends = await Promise.all(
      days.map(async (dayStart) => {
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        const count = await Order.countDocuments({ createdAt: { $gte: dayStart, $lt: dayEnd } });
        return { date: dayStart.toISOString().slice(0, 10), count };
      })
    );

    res.json({ trends });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/dashboard/revenue?period=daily|weekly|monthly
 * Returns revenue broken down by period.
 * Validates: Requirements 11.3
 */
router.get('/revenue', protect, async (req, res, next) => {
  try {
    const period = req.query.period || 'daily';
    const revenue = [];

    if (period === 'daily') {
      for (let i = 6; i >= 0; i--) {
        const dayStart = new Date();
        dayStart.setHours(0, 0, 0, 0);
        dayStart.setDate(dayStart.getDate() - i);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        const result = await Transaction.aggregate([
          { $match: { created_at: { $gte: dayStart, $lt: dayEnd } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        revenue.push({ period: dayStart.toISOString().slice(0, 10), amount: result[0]?.total || 0 });
      }
    } else if (period === 'weekly') {
      for (let i = 3; i >= 0; i--) {
        const weekEnd = new Date();
        weekEnd.setHours(0, 0, 0, 0);
        weekEnd.setDate(weekEnd.getDate() - i * 7);
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 7);
        const result = await Transaction.aggregate([
          { $match: { created_at: { $gte: weekStart, $lt: weekEnd } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        revenue.push({ period: weekStart.toISOString().slice(0, 10), amount: result[0]?.total || 0 });
      }
    } else if (period === 'monthly') {
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        const monthStart = new Date(d.getFullYear(), d.getMonth() - i, 1);
        const monthEnd = new Date(d.getFullYear(), d.getMonth() - i + 1, 1);
        const result = await Transaction.aggregate([
          { $match: { created_at: { $gte: monthStart, $lt: monthEnd } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const label = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`;
        revenue.push({ period: label, amount: result[0]?.total || 0 });
      }
    }

    res.json({ revenue });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/dashboard/fleet-status
 * Returns vehicle counts grouped by status.
 * Validates: Requirements 11.4
 */
router.get('/fleet-status', protect, async (req, res, next) => {
  try {
    const [available, in_use, under_maintenance] = await Promise.all([
      Vehicle.countDocuments({ status: 'available' }),
      Vehicle.countDocuments({ status: 'in_use' }),
      Vehicle.countDocuments({ status: 'under_maintenance' }),
    ]);
    res.json({ available, in_use, under_maintenance });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/dashboard/drivers
 * Returns per-driver trip counts and status.
 * Validates: Requirements 11.5
 */
router.get('/drivers', protect, async (req, res, next) => {
  try {
    const drivers = await Driver.find().populate('user_id', 'name');
    const driverStats = await Promise.all(
      drivers.map(async (driver) => {
        const trip_count = await Order.countDocuments({
          assigned_driver_id: driver._id,
          status: 'delivered',
        });
        return {
          driver_id: driver._id,
          name: driver.user_id ? driver.user_id.name : null,
          status: driver.status,
          trip_count,
        };
      })
    );
    res.json({ drivers: driverStats });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
