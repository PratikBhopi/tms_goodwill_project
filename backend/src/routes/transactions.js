const express = require('express');
const router = express.Router();
const { verifyJWT, requireRole } = require('../middleware/auth');
const Transaction = require('../models/Transaction');

const protect = [verifyJWT, requireRole('staff')];

function buildFilter({ from, to, payment_status }) {
  const filter = {};
  if (from || to) {
    filter.created_at = {};
    if (from) filter.created_at.$gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      filter.created_at.$lte = toDate;
    }
  }
  if (payment_status) filter.payment_status = payment_status;
  return filter;
}

/**
 * GET /api/transactions
 * Returns transaction log with optional filters.
 * Validates: Requirements 14.1, 14.2
 */
router.get('/', protect, async (req, res, next) => {
  try {
    const filter = buildFilter(req.query);
    const raw = await Transaction.find(filter)
      .populate('customer_id', 'name')
      .sort({ created_at: -1 })
      .lean();

    const transactions = raw.map((t) => ({
      order_id: t.order_id,
      customer_name: t.customer_id ? t.customer_id.name : null,
      payment_mode: t.payment_mode,
      payment_status: t.payment_status,
      amount: t.amount,
      created_at: t.created_at,
    }));

    res.json({ transactions });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/transactions/export
 * Returns transaction log as a CSV file.
 * Validates: Requirements 14.3
 */
router.get('/export', protect, async (req, res, next) => {
  try {
    const filter = buildFilter(req.query);
    const raw = await Transaction.find(filter)
      .populate('customer_id', 'name')
      .sort({ created_at: -1 })
      .lean();

    const escape = (val) => {
      const str = val == null ? '' : String(val);
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    };

    const header = 'order_id,customer_name,payment_mode,payment_status,amount,created_at';
    const rows = raw.map((t) => [
      escape(t.order_id),
      escape(t.customer_id ? t.customer_id.name : ''),
      escape(t.payment_mode),
      escape(t.payment_status),
      escape(t.amount),
      escape(t.created_at ? t.created_at.toISOString() : ''),
    ].join(','));

    const csv = [header, ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
