const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const sessionController = require('../controllers/sessionController');

router.post('/', requireAuth, sessionController.schedule);
router.get('/mine', requireAuth, sessionController.mine);
router.post('/:id/complete', requireAuth, sessionController.complete);
router.post('/:id/no-show', requireAuth, sessionController.markNoShow);

module.exports = router;
