import Gallery from '../models/Gallery.js';
import FamilyMember from '../models/FamilyMember.js';
import mongoose from 'mongoose';
import cloudinary from '../config/cloudinary.js';
import { sendGlobalNotification } from './notificationController.js';

// @desc    Get all gallery images
// @route   GET /api/gallery
// @access  Private
export const getGalleryImages = async (req, res, next) => {
  try {
    const { search, sort, month, year } = req.query;
    
    // If admin, return all images with status
    // If regular user, return only approved images
    const isAdmin = req.user?.role === 'admin';
    let query = isAdmin ? {} : { status: 'approved' };

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    // Month and Year filtering
    if (month && year) {
      const m = parseInt(month);
      const y = parseInt(year);
      const startDate = new Date(y, m - 1, 1);
      const endDate = new Date(y, m, 0, 23, 59, 59);
      
      const dateFilter = { $gte: startDate, $lte: endDate };
      
      // Check both 'date' and 'createdAt' for backwards compatibility
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { date: dateFilter },
          { createdAt: dateFilter }
        ]
      });
    }

    // Sorting functionality
    let sortOptions = { createdAt: -1 }; // Default: Newest first
    if (sort === 'oldest') {
      sortOptions = { date: 1 };
    } else if (sort === 'newest') {
      sortOptions = { date: -1 };
    }
    
    // Get images with initial population
    const images = await Gallery.find(query)
      .populate('uploadedBy', 'name email avatar')
      .sort(sortOptions)
      .lean();

    // Fallback population using familyMemberId for reliability
    const memberIds = [...new Set(images.map(img => img.familyMemberId).filter(id => id !== null))];
    const members = await FamilyMember.find({ id: { $in: memberIds } }).select('id name avatar email');
    const memberMap = new Map(members.map(m => [m.id, m]));

    const processedImages = images.map(image => {
      // If populate didn't find the user (e.g. they point to User model instead of FamilyMember)
      // or if we want to prioritize the FamilyMember data based on familyMemberId
      if (image.familyMemberId) {
        const member = memberMap.get(image.familyMemberId);
        if (member) {
          image.uploadedBy = {
            _id: member._id,
            name: member.name,
            avatar: member.avatar,
            email: member.email,
            id: member.id
          };
        }
      } else if (!image.uploadedBy) {
        // Handle admin or missing data
        image.uploadedBy = { name: 'Admin', avatar: '', role: 'admin' };
      }
      return image;
    });

    res.status(200).json({
      success: true,
      count: processedImages.length,
      data: processedImages
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
      .populate('uploadedBy', 'name email avatar')
      .lean();

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Gallery image not found'
      });
    }

    // Fallback population
    if (image.familyMemberId && (!image.uploadedBy || !image.uploadedBy.name)) {
      const member = await FamilyMember.findOne({ id: image.familyMemberId }).select('id name avatar email');
      if (member) {
        image.uploadedBy = {
          _id: member._id,
          name: member.name,
          avatar: member.avatar,
          email: member.email,
          id: member.id
        };
      }
    } else if (!image.uploadedBy) {
      image.uploadedBy = { name: 'Admin', avatar: '', role: 'admin' };
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
    const { images: imageList, title, description, location, date, familyMemberId } = req.body;

    // Support both single image (legacy) and multi-image (new)
    let imagesToProcess = [];
    if (imageList && Array.isArray(imageList)) {
      imagesToProcess = imageList;
    } else {
      const { imageUrl, cloudinaryId } = req.body;
      if (imageUrl && cloudinaryId) {
        imagesToProcess.push({ imageUrl, cloudinaryId, title, description, location, date });
      }
    }

    if (imagesToProcess.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one image with title and cloudinary details'
      });
    }

    if (imagesToProcess.length > 10) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 10 images allowed at one time'
      });
    }

    // --- MONTHLY LIMIT CHECK ---
    if (req.user?.role !== 'admin') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const uploadsThisMonth = await Gallery.countDocuments({
        uploadedBy: req.user._id,
        createdAt: { $gte: startOfMonth }
      });

      if (uploadsThisMonth + imagesToProcess.length > 30) { // Increased limit slightly for multi-upload
        return res.status(403).json({
          success: false,
          message: `Monthly upload limit would be exceeded. You have already uploaded ${uploadsThisMonth} photos this month. Limit is 30.`
        });
      }
    }

    const createdImages = [];
    const batchId = imagesToProcess.length > 1 ? new mongoose.Types.ObjectId().toString() : null;

    for (const imgData of imagesToProcess) {
      const image = await Gallery.create({
        title: imgData.title || title || 'Untitled',
        description: imgData.description || description || '',
        location: imgData.location || location || '',
        date: imgData.date || date || Date.now(),
        imageUrl: imgData.imageUrl,
        cloudinaryId: imgData.cloudinaryId,
        uploadedBy: req.user._id,
        familyMemberId: familyMemberId || req.user.familyMemberId || null,
        status: 'approved',
        batchId
      });
      createdImages.push(image);
    }

    // Send global notification for the batch
    const notificationMessage = createdImages.length === 1 
      ? `📸 ${req.user.name} shared a new memory: "${createdImages[0].title}"`
      : `📸 ${req.user.name} added ${createdImages.length} new memories to the gallery!`;

    await sendGlobalNotification(
        notificationMessage, 
        'system', 
        req.user._id, 
        req.user.name,
        { redirectTo: '/gallery' }
    );

    res.status(201).json({
      success: true,
      count: createdImages.length,
      data: createdImages.length === 1 ? createdImages[0] : createdImages
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

    // Only admin or the uploader can delete
    if (req.user.role !== 'admin' && image.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this image'
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

