const multer = require('multer');

// Store file in memory instead of disk for direct Cloudinary streaming
const storage = multer.memoryStorage();

// Validate file type
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/jpeg' || 
    file.mimetype === 'image/png' || 
    file.mimetype === 'image/webp' ||
    file.mimetype === 'video/mp4' ||
    file.mimetype === 'video/webm' ||
    file.mimetype === 'video/quicktime'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file format. Only JPEG, PNG, WEBP, MP4, WEBM, and MOV are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

module.exports = upload;
