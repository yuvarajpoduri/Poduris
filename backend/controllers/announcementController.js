import Announcement from '../models/Announcement.js';
import mongoose from 'mongoose';

// @desc    Get all announcements
// @route   GET /api/announcements
// @access  Private
export const getAnnouncements = async (req, res, next) => {
  try {
    const announcements = await Announcement.find({ isActive: true })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: announcements.length,
      data: announcements
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single announcement
// @route   GET /api/announcements/:id
// @access  Private
export const getAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid announcement ID'
      });
    }

    const announcement = await Announcement.findById(id)
      .populate('createdBy', 'name email');

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    res.status(200).json({
      success: true,
      data: announcement
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create announcement
// @route   POST /api/announcements
// @access  Private/Admin
export const createAnnouncement = async (req, res, next) => {
  try {
    const { title, content, category } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title and content'
      });
    }

    const announcement = await Announcement.create({
      title,
      content,
      category: category || 'other',
      createdBy: req.user.id
    });

    await announcement.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: announcement
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update announcement
// @route   PUT /api/announcements/:id
// @access  Private/Admin
export const updateAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid announcement ID'
      });
    }

    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      data: updatedAnnouncement
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Private/Admin
export const deleteAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid announcement ID'
      });
    }

    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    await Announcement.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

