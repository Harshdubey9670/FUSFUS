const express = require('express');
const router = express.Router();
const creatorController = require('../controllers/creatorController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/overview', creatorController.getOverviewStats);
router.get('/insights', creatorController.getInsights);
router.get('/audience', creatorController.getAudienceAnalytics);
router.get('/content', creatorController.getContentPerformance);
router.get('/content-manager', creatorController.getDraftsAndScheduled);
router.post('/bulk-action', creatorController.bulkContentAction);
router.get('/export', creatorController.exportAnalytics);

module.exports = router;
