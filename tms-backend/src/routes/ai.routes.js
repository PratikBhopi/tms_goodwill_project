const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

router.get('/route-suggestion', authenticate, requireRole('STAFF', 'OWNER'), aiController.getRouteSuggestion);
router.get('/price-estimate', authenticate, aiController.getPriceEstimate);

module.exports = router;
