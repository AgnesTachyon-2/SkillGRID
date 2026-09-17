const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

router.post('/checkout', requireAuth, paymentController.checkout);

module.exports = router;
