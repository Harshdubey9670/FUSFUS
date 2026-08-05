const express = require('express');
const { getSettings, updateSettings, downloadData } = require('../controllers/settingsController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

router.route('/')
  .get(getSettings)
  .put(updateSettings);

router.get('/download-data', downloadData);

module.exports = router;
