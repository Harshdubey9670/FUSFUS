const cloudinary = require('../config/cloudinary');

// @desc    Upload image to Cloudinary
// @route   POST /api/upload
// @access  Private
const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }

    // Wrap Cloudinary upload stream in a Promise
    const streamUpload = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'snapgram-ai', resource_type: 'auto' }, // Keep organized, auto-detect image/video
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );
        stream.end(fileBuffer);
      });
    };

    const result = await streamUpload(req.file.buffer);

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        resource_type: result.resource_type, // 'image' or 'video'
        width: result.width,
        height: result.height,
      }
    });
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload file' });
  }
};

// @desc    Delete image from Cloudinary
// @route   DELETE /api/upload/:public_id
// @access  Private
const deleteImage = async (req, res, next) => {
  try {
    const { public_id } = req.params;

    if (!public_id) {
      return res.status(400).json({ success: false, message: 'No public_id provided' });
    }

    const result = await cloudinary.uploader.destroy(public_id);

    if (result.result === 'ok') {
      res.status(200).json({ success: true, message: 'Image deleted successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Failed to delete image (might not exist)' });
    }
  } catch (error) {
    console.error('Cloudinary Delete Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete image' });
  }
};

module.exports = {
  uploadImage,
  deleteImage,
};
