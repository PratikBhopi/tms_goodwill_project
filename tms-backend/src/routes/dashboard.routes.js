const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

router.get('/summary', authenticate, requireRole('STAFF', 'OWNER'), dashboardController.getSummary);

module.exports = router;
