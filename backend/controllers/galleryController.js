import Gallery from '../models/Gallery.js';
import mongoose from 'mongoose';
import cloudinary from '../config/cloudinary.js';
import { sendGlobalNotification } from './notificationController.js';

// @desc    Get all gallery images
// @route   GET /api/gallery
// @access  Private
export const getGalleryImages = async (req, res, next) => {
  try {
    // If admin, return all images with status
    // If regular user, return only approved images
    const isAdmin = req.user?.role === 'admin';
    const query = isAdmin ? {} : { status: 'approved' };
    
    const images = await Gallery.find(query)
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: images.length,
      data: images
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single gallery image
// @route   GET /api/gallery/:id
// @access  Private
export const getGalleryImage = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid gallery image ID'
      });
    }

    const image = await Gallery.findById(id)
      .populate('uploadedBy', 'name email');

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Gallery image not found'
      });
    }

    res.status(200).json({
      success: true,
      data: image
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload gallery image
// @route   POST /api/gallery
// @access  Private (All authenticated users)
export const uploadGalleryImage = async (req, res, next) => {
  try {
    const { title, description, imageUrl, cloudinaryId, familyMemberId } = req.body;

    if (!title || !imageUrl || !cloudinaryId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, imageUrl, and cloudinaryId'
      });
    }

    // --- MONTHLY LIMIT CHECK ---
    // If not admin, restrict to 10 uploads per month
    if (req.user?.role !== 'admin') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const uploadsThisMonth = await Gallery.countDocuments({
        uploadedBy: req.user._id,
        createdAt: { $gte: startOfMonth }
      });

      if (uploadsThisMonth >= 10) {
        return res.status(403).json({
          success: false,
          message: 'Monthly upload limit reached (10 photos). Please try again next month or contact admin.'
        });
      }
    }
    // ---------------------------

    // --- AUTO-APPROVE ALL UPLOADS ---
    // User requested that standard user uploads should be visible to everyone immediately
    const status = 'approved';

    const image = await Gallery.create({
      title,
      description: description || '',
      imageUrl,
      cloudinaryId,
      uploadedBy: req.user._id, // Use _id as set in auth middleware
      familyMemberId: familyMemberId || null,
      status
    });



    await image.populate('uploadedBy', 'name email');

    // Send global notification
    await sendGlobalNotification(
        `New photo "${title}" uploaded to gallery`, 
        'system', 
        req.user._id, 
        req.user.name
    );

    res.status(201).json({
      success: true,
      data: image
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update gallery image
// @route   PUT /api/gallery/:id
// @access  Private/Admin
export const updateGalleryImage = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid gallery image ID'
      });
    }

    const image = await Gallery.findById(id);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Gallery image not found'
      });
    }

    const updatedImage = await Gallery.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    ).populate('uploadedBy', 'name email');

    res.status(200).json({
      success: true,
      data: updatedImage
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete gallery image
// @route   DELETE /api/gallery/:id
// @access  Private/Admin
export const deleteGalleryImage = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid gallery image ID'
      });
    }

    const image = await Gallery.findById(id);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Gallery image not found'
      });
    }

    // Delete from Cloudinary
    try {
      if (image.cloudinaryId) {
        await cloudinary.uploader.destroy(image.cloudinaryId);
      }
    } catch (cloudinaryError) {
      console.error('Error deleting from Cloudinary:', cloudinaryError);
      // Continue with database deletion even if Cloudinary deletion fails
    }

    // Delete from database
    await Gallery.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Gallery image deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve gallery image
// @route   PUT /api/gallery/:id/approve
// @access  Private/Admin
export const approveGalleryImage = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid gallery image ID'
      });
    }

    const image = await Gallery.findByIdAndUpdate(
      id,
      { status: 'approved' },
      { new: true, runValidators: true }
    ).populate('uploadedBy', 'name email');

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Gallery image not found'
      });
    }

    res.status(200).json({
      success: true,
      data: image
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject gallery image
// @route   PUT /api/gallery/:id/reject
// @access  Private/Admin
export const rejectGalleryImage = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid gallery image ID'
      });
    }

    const image = await Gallery.findByIdAndUpdate(
      id,
      { status: 'rejected' },
      { new: true, runValidators: true }
    ).populate('uploadedBy', 'name email');

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Gallery image not found'
      });
    }

    res.status(200).json({
      success: true,
      data: image
    });
  } catch (error) {
    next(error);
  }
};

