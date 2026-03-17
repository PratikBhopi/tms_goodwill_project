const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

router.get('/', authenticate, requireRole('STAFF', 'OWNER'), paymentController.getTransactions);

module.exports = router;
