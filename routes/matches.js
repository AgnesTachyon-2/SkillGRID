const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const matchController = require('../controllers/matchController');

router.post('/direct', requireAuth, matchController.proposeDirect);
router.get('/mine', requireAuth, matchController.mine);
router.post('/:id/accept', requireAuth, matchController.accept);
router.post('/:id/decline', requireAuth, matchController.decline);
router.post('/chain-search', requireAuth, matchController.runChainSearch);

module.exports = router;
