const express = require('express');
const { getMessages, sendMessage, openSnap, reportScreenshot } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:conversationId', protect, getMessages);
router.post('/:conversationId', protect, sendMessage);
router.post('/snap/:messageId/open', protect, openSnap);
router.post('/snap/:messageId/screenshot', protect, reportScreenshot);

module.exports = router;
