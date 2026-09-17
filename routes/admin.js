const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

router.post('/reports', requireAuth, adminController.createReport);
router.get('/reports', requireAdmin, adminController.listReports);
router.post('/reports/:id/resolve', requireAdmin, adminController.resolveReport);
router.get('/config', requireAdmin, adminController.getConfig);
router.put('/config', requireAdmin, adminController.updateConfig);
router.get('/analytics', requireAdmin, adminController.analytics);

module.exports = router;
