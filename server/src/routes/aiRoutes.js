const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/assistant', aiController.chatAssistant);
router.post('/generate-image', aiController.generateImage);
router.post('/caption', aiController.generateCaption);
router.post('/hashtags', aiController.generateHashtags);
router.post('/bio', aiController.generateBio);
router.post('/usernames', aiController.suggestUsernames);
router.post('/post-ideas', aiController.generatePostIdeas);
router.post('/comments', aiController.suggestComments);
router.post('/translate', aiController.translateText);
router.post('/moderate', aiController.moderateContent);
router.post('/fake-account-check', aiController.detectFakeAccount);
router.post('/alt-text', aiController.generateAltText);

module.exports = router;
