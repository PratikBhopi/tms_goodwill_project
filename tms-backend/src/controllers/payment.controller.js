const { Payment } = require('../models');
const { sendSuccess, sendError } = require('../utils/apiResponse');

exports.getTransactions = async (req, res, next) => {
  try {
    const payments = await Payment.find()
      .populate({ path: 'order', populate: { path: 'customer' } })
      .sort({ createdAt: -1 });
    sendSuccess(res, payments.map(p => ({ ...p.toObject(), id: p._id.toString() })));
  } catch (err) { next(err); }
};
