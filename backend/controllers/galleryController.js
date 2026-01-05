import Gallery from '../models/Gallery.js';
import mongoose from 'mongoose';

// @desc    Get all gallery images
// @route   GET /api/gallery
// @access  Private
export const getGalleryImages = async (req, res, next) => {
  try {
    const images = await Gallery.find()
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
// @access  Private/Admin
export const uploadGalleryImage = async (req, res, next) => {
  try {
    const { title, description, imageUrl, cloudinaryId, familyMemberId } = req.body;

    if (!title || !imageUrl || !cloudinaryId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, imageUrl, and cloudinaryId'
      });
    }

    const image = await Gallery.create({
      title,
      description: description || '',
      imageUrl,
      cloudinaryId,
      uploadedBy: req.user.id,
      familyMemberId: familyMemberId || null
    });

    await image.populate('uploadedBy', 'name email');

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

    await Gallery.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Gallery image deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

