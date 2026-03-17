const { Vehicle } = require('../models');
const { sendSuccess, sendError } = require('../utils/apiResponse');

exports.getAllVehicles = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find();
    sendSuccess(res, vehicles.map(v => ({ ...v.toObject(), id: v._id.toString() })));
  } catch (err) { next(err); }
};

exports.getAvailableVehicles = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find({ status: 'AVAILABLE' });
    sendSuccess(res, vehicles.map(v => ({ ...v.toObject(), id: v._id.toString() })));
  } catch (err) { next(err); }
};

exports.addVehicle = async (req, res, next) => {
  try {
    const { registrationNo, type, capacityTons, ownerName } = req.body;
    const vehicle = await Vehicle.create({ registrationNo, type, capacityTons: parseFloat(capacityTons), ownerName });
    const vObj = vehicle.toObject();
    sendSuccess(res, { ...vObj, id: vObj._id.toString() }, 201);
  } catch (err) { next(err); }
};
