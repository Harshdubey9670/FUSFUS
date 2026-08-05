const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Secure all admin routes with protect & adminOnly
router.use(protect, adminOnly);

router.get('/metrics', adminController.getDashboardMetrics);

router.get('/users', adminController.getUsersList);
router.put('/users/:id', adminController.updateUserStatus);

router.get('/reports', adminController.getModerationQueue);
router.put('/reports/:id', adminController.resolveReport);

router.get('/audit-logs', adminController.getAuditLogs);
router.post('/broadcast-notification', adminController.broadcastNotification);

router.get('/system-config', adminController.getSystemConfig);
router.put('/system-config', adminController.updateSystemConfig);

module.exports = router;
