import Status from '../models/Status.js';
import cloudinary from '../config/cloudinary.js';

// @desc    Get all active statuses (grouped by user)
// @route   GET /api/status
// @access  Private
export const getAllStatuses = async (req, res) => {
  try {
    // Get all statuses from the last 24 hours, sorted newest first
    const statuses = await Status.find({})
      .sort({ createdAt: -1 })
      .lean();

    // Group by user
    const grouped = {};
    statuses.forEach(status => {
      const id = status.user.toString();
      if (!grouped[id]) {
        grouped[id] = {
          userId: id,
          userName: status.userName,
          userAvatar: status.userAvatar,
          statuses: [],
          latestAt: status.createdAt
        };
      }
      grouped[id].statuses.push({
        _id: status._id,
        imageUrl: status.imageUrl,
        createdAt: status.createdAt,
        viewedBy: status.viewedBy || []
      });
    });

    // Convert to array and sort by latest status
    const result = Object.values(grouped).sort(
      (a, b) => new Date(b.latestAt) - new Date(a.latestAt)
    );

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching statuses:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload a new status
// @route   POST /api/status  (called after image upload to Cloudinary)
// @access  Private
export const createStatus = async (req, res) => {
  try {
    const { imageUrl, cloudinaryId } = req.body;

    if (!imageUrl || !cloudinaryId) {
      return res.status(400).json({ 
        success: false, 
        message: 'imageUrl and cloudinaryId are required' 
      });
    }

    const userId = req.familyMember?._id || req.session?.familyMemberId;
    const userName = req.familyMember?.name || req.user?.name || 'Unknown';
    const userAvatar = req.familyMember?.avatar || req.user?.avatar || '';

    if (!userId || userId === 'admin') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only family members can upload status' 
      });
    }

    const status = await Status.create({
      user: userId,
      userName,
      userAvatar,
      imageUrl,
      cloudinaryId
    });

    res.status(201).json({ success: true, data: status });
  } catch (error) {
    console.error('Error creating status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete own status
// @route   DELETE /api/status/:id
// @access  Private
export const deleteStatus = async (req, res) => {
  try {
    const status = await Status.findById(req.params.id);
    
    if (!status) {
      return res.status(404).json({ success: false, message: 'Status not found' });
    }

    const userId = req.familyMember?._id?.toString() || req.session?.familyMemberId;
    const isAdmin = req.session?.role === 'admin';

    // Only owner or admin can delete
    if (status.user.toString() !== userId && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(status.cloudinaryId);
    } catch (cloudErr) {
      console.error('Failed to delete from Cloudinary:', cloudErr);
    }

    await Status.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Status deleted' });
  } catch (error) {
    console.error('Error deleting status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark status as viewed
// @route   PUT /api/status/:id/view
// @access  Private
export const viewStatus = async (req, res) => {
  try {
    const userId = req.familyMember?._id || req.session?.familyMemberId;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    await Status.findByIdAndUpdate(req.params.id, {
      $addToSet: { viewedBy: userId }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking status as viewed:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
