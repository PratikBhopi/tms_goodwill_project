const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicle.controller');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

router.get('/', authenticate, requireRole('STAFF', 'OWNER'), vehicleController.getAllVehicles);
router.get('/available', authenticate, requireRole('STAFF', 'OWNER'), vehicleController.getAvailableVehicles);
router.post('/', authenticate, requireRole('STAFF'), vehicleController.addVehicle);

module.exports = router;
