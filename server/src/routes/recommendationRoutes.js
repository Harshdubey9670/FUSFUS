const express = require('express');
const { getPersonalizedRecommendations } = require('../controllers/recommendationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All recommendation routes require authentication
router.use(protect);

router.get('/', getPersonalizedRecommendations);

module.exports = router;
