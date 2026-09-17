const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const userController = require('../controllers/userController');

router.get('/me', requireAuth, userController.getMe);
router.put('/me', requireAuth, userController.updateMe);
router.get('/me/transactions', requireAuth, userController.getMyTransactions);
router.get('/:id', userController.getUser);

module.exports = router;
