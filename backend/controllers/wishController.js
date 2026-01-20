import Wish from '../models/Wish.js';
import FamilyMember from '../models/FamilyMember.js';
import Notification from '../models/Notification.js';

// @desc    Send a birthday wish
// @route   POST /api/wishes
// @access  Private
export const sendWish = async (req, res, next) => {
  try {
    const { recipientFamilyMemberId, message } = req.body;
    const sender = req.user;

    if (!recipientFamilyMemberId) {
      return res.status(400).json({
        success: false,
        message: 'Recipient ID is required'
      });
    }

    // 1. Find Recipient FamilyMember
    const recipientMember = await FamilyMember.findOne({ id: recipientFamilyMemberId });
    
    if (!recipientMember) {
        return res.status(404).json({
            success: false,
            message: 'Family member not found.'
        });
    }

    // Check if they have an email (account) to actually receive the notification usefuly
    // But we still allow wishing them even if they don't have an account, just to store the memory.
    // However, the schema requires recipient ObjectId. 
    // Since we are using FamilyMember as the auth entity now, we ALWAYS have an ObjectId for them.

    // 2. Prevent Self-Wish
    if (recipientMember._id.toString() === sender._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot send a birthday wish to yourself.'
      });
    }

    // 3. Create Wish
    const currentYear = new Date().getFullYear();
    
    const wish = await Wish.create({
      sender: sender._id,
      recipient: recipientMember._id,
      recipientFamilyMemberId,
      message: message || "Happy Birthday! 🎉",
      year: currentYear
    });

    // 4. Create Notification
    await Notification.create({
      recipient: recipientMember._id,
      sender: sender._id,
      senderName: sender.name,
      type: 'birthday_wish',
      message: `${sender.name} sent you a birthday wish! 🎂`
    });

    res.status(201).json({
      success: true,
      data: wish
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already sent a wish to this person this year.'
      });
    }
    next(error);
  }
};

// @desc    Get wishes received by current user
// @route   GET /api/wishes/received
// @access  Private
export const getReceivedWishes = async (req, res, next) => {
  try {
    const currentYear = new Date().getFullYear();
    
    const wishes = await Wish.find({ 
      recipient: req.user._id,
      year: currentYear
    })
    .populate('sender', 'name avatar')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: wishes.length,
      data: wishes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get list of family members wished by current user this year
// @route   GET /api/wishes/sent-ids
// @access  Private
export const getSentWishFamilyIds = async (req, res, next) => {
  try {
    const currentYear = new Date().getFullYear();
    
    const wishes = await Wish.find({ 
      sender: req.user._id,
      year: currentYear
    }).select('recipientFamilyMemberId');

    const ids = wishes.map(w => w.recipientFamilyMemberId);

    res.status(200).json({
      success: true,
      data: ids
    });
  } catch (error) {
    next(error);
  }
};
