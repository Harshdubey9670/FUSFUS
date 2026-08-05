const express = require('express');
const { uploadImage, deleteImage } = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Apply auth middleware to all upload routes
router.use(protect);

router.post('/', upload.single('image'), uploadImage);

// Use a standard parameter and encodeURIComponent on the frontend for slashes
router.delete('/:public_id', deleteImage);

module.exports = router;
