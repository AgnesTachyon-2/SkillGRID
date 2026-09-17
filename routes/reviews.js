const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const reviewController = require('../controllers/reviewController');

router.post('/', requireAuth, reviewController.create);
router.get('/user/:userId', reviewController.forUser);

module.exports = router;
