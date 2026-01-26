import '../config/cloudinary.js';
import multer from 'multer';
import { uploadImageToCloudinary } from '../utils/uploadImage.js';


// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// @desc    Upload image to Cloudinary
// @route   POST /api/upload
// @access  Private/Admin
// @desc    Upload image to Cloudinary
// @route   POST /api/upload
// @access  Private/Admin
export const uploadImage = async (req, res, next) => {
  console.log('Upload Endpoint Hit:', {
    hasFile: !!req.file,
    contentType: req.headers['content-type'],
    bodyKeys: Object.keys(req.body || {}),
    fileDetails: req.file ? {
      fieldname: req.file.fieldname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : 'No File'
  });

  try {
    // Check Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('Cloudinary config missing');
      return res.status(500).json({
        success: false,
        message: 'Cloudinary is not configured. Please contact the administrator.'
      });
    }

    if (!req.file) {
      console.error('No file in request');
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please ensure you selected a valid image.'
      });
    }

    const result = await uploadImageToCloudinary(req.file.buffer, 'poduris');

    res.status(200).json({
      success: true,
      data: {
        imageUrl: result.imageUrl,
        cloudinaryId: result.cloudinaryId
      }
    });
  } catch (error) {
    console.error('Upload error in controller:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload image. Please try again.'
    });
  }
};

// Export multer middleware with error handling wrapper
export const uploadMiddleware = (req, res, next) => {
  console.log('Multer Middleware starting...');
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Multer Middleware Error:', err);
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ success: false, message: 'File too large. Max size is 10MB.' });
        }
        return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    console.log('Multer parsing finished. File found:', !!req.file);
    next();
  });
};

