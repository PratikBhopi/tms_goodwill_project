const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driver.controller');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

router.get('/', authenticate, requireRole('STAFF', 'OWNER'), driverController.getAllDrivers);
router.get('/available', authenticate, requireRole('STAFF', 'OWNER'), driverController.getAvailableDrivers);

module.exports = router;
