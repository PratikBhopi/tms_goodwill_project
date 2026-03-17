const { Driver } = require('../models');
const { sendSuccess, sendError } = require('../utils/apiResponse');

exports.getAllDrivers = async (req, res, next) => {
  try {
    const drivers = await Driver.find().populate('user');
    sendSuccess(res, drivers.map(d => ({ ...d.toObject(), id: d._id.toString() })));
  } catch (err) { next(err); }
};

exports.getAvailableDrivers = async (req, res, next) => {
  try {
    const drivers = await Driver.find({ isAvailable: true }).populate('user');
    sendSuccess(res, drivers.map(d => ({ ...d.toObject(), id: d._id.toString() })));
  } catch (err) { next(err); }
};
