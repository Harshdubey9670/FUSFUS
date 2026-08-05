const express = require('express');
const router = express.Router();
const liveController = require('../controllers/liveController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/start', liveController.startLiveStream);
router.post('/:id/end', liveController.endLiveStream);
router.get('/active', liveController.getActiveStreams);
router.get('/:id', liveController.getStream);

module.exports = router;
