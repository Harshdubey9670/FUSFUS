const express = require('express');
const { 
  globalSearch, 
  getSearchSuggestions, 
  searchUsers, 
  advancedSearch,
  getSearchHistory,
  addSearchHistory,
  toggleSearchPin,
  deleteSearchHistory,
  clearSearchHistory
} = require('../controllers/searchController');
const { protect } = require('../middleware/authMiddleware');
const rateLimit = require('express-rate-limit');

const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 60, // start blocking after 60 requests
  message: 'Too many search requests from this IP, please try again after a minute',
  standardHeaders: true,
  legacyHeaders: false,
});

const router = express.Router();

// Apply auth middleware and rate limiter
router.use(protect);
router.use(searchLimiter);

router.get('/history', getSearchHistory);
router.post('/history', addSearchHistory);
router.put('/history/:id/pin', toggleSearchPin);
router.delete('/history/:id', deleteSearchHistory);
router.delete('/history', clearSearchHistory);

router.get('/', globalSearch);
router.get('/advanced', advancedSearch);
router.get('/suggestions', getSearchSuggestions);
router.get('/users', searchUsers);

module.exports = router;
