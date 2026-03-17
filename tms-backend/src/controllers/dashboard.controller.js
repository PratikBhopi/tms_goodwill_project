const { Order, Vehicle, Payment } = require('../models');
const { sendSuccess, sendError } = require('../utils/apiResponse');

exports.getSummary = async (req, res, next) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0,0,0,0));

    const totalOrdersToday = await Order.countDocuments({ createdAt: { $gte: startOfDay } });
    const ordersInTransit = await Order.countDocuments({ status: 'IN_TRANSIT' });

    const vehicleStats = await Vehicle.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const fleet = { AVAILABLE: 0, IN_USE: 0, UNDER_MAINTENANCE: 0 };
    vehicleStats.forEach(v => { fleet[v._id] = v.count; });

    const revenueResult = await Payment.aggregate([
      { $match: { status: { $in: ['PAID', 'COD_PAID'] }, paidAt: { $gte: startOfDay } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const revenueToday = revenueResult.length > 0 ? revenueResult[0].total : 0;

    sendSuccess(res, {
      totalOrdersToday,
      ordersInTransit,
      fleet,
      revenueToday,
    });
  } catch (err) { next(err); }
};
