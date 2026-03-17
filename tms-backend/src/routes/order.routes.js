const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const upload = require('../middleware/upload');

// Customer
router.post('/', authenticate, requireRole('CUSTOMER'), orderController.placeOrder);
router.get('/my', authenticate, requireRole('CUSTOMER'), orderController.getMyOrders);

// Staff
router.get('/', authenticate, requireRole('STAFF', 'OWNER'), orderController.getAllOrders);
router.get('/:id', authenticate, orderController.getOrderById);
router.put('/:id/assign', authenticate, requireRole('STAFF'), orderController.assignOrder);

// Driver
router.get('/driver/trips', authenticate, requireRole('DRIVER'), orderController.getMyTrips);
router.put('/:id/status', authenticate, requireRole('DRIVER'), orderController.updateStatus);
router.post('/:id/pod', authenticate, requireRole('DRIVER'), upload.single('pod'), orderController.uploadPOD);

module.exports = router;
