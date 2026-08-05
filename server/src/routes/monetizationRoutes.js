const express = require('express');
const router = express.Router();
const monetizationController = require('../controllers/monetizationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/earnings', monetizationController.getEarningsOverview);
router.post('/subscribe', monetizationController.subscribeToCreator);
router.post('/tip', monetizationController.sendTip);
router.post('/badge', monetizationController.purchaseBadge);

router.get('/affiliates', monetizationController.getAffiliateLinks);
router.post('/affiliates', monetizationController.addAffiliateLink);

router.get('/payouts', monetizationController.getPayoutHistory);
router.post('/payouts/request', monetizationController.requestPayout);

router.get('/tax-info', monetizationController.getTaxInfo);
router.post('/tax-info', monetizationController.updateTaxInfo);

module.exports = router;
