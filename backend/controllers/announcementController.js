import Announcement from '../models/Announcement.js';
import User from '../models/User.js';

export const getAnnouncements = async (req, res, next) => {
  try {
    const announcements = await Announcement.find()
      .populate('createdBy', 'name avatar')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: announcements,
      count: announcements.length,
    });
  } catch (error) {
    next(error);
  }
};

export const createAnnouncement = async (req, res, next) => {
  try {
    const { title, content, category } = req.body;
    
    const announcement = await Announcement.create({
      title,
      content,
      category,
      createdBy: req.user._id,
    });

    const populatedAnnouncement = await Announcement.findById(announcement._id).populate('createdBy', 'name avatar');

    res.status(201).json({
      success: true,
      data: populatedAnnouncement,
    });
  } catch (error) {
    next(error);
  }
};
