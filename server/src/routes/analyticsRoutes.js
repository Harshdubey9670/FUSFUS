const express = require('express');
const { trackEvent } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply auth middleware if we want to ensure only logged in users can track
// Alternatively, make it optional if we want anonymous tracking later
router.use(protect);

router.post('/track', trackEvent);

module.exports = router;
