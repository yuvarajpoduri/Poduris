import Chat from '../models/Chat.js';
import FamilyMember from '../models/FamilyMember.js';
import mongoose from 'mongoose';

// @desc    Get group chat messages only
// @route   GET /api/chat
// @access  Private (Family members and admin)
export const getChats = async (req, res, next) => {
  try {
    // Only group chat messages
    const query = {
      isGroupChat: true
    };

    const chats = await Chat.find(query)
      .populate('senderFamilyMemberId', 'name nickname email avatar')
      .populate('receiverFamilyMemberId', 'name nickname email avatar')
      .populate({
        path: 'replyTo',
        select: 'message senderFamilyMemberId',
        populate: {
          path: 'senderFamilyMemberId',
          select: 'name nickname avatar'
        }
      })
      // Oldest first; UI scrolls to bottom so most recent is visible when opened
      .sort({ createdAt: 1 })
      .limit(100);

    // Transform to match frontend expectations
    const transformedChats = chats.map(chat => {
      const chatObj = chat.toObject();
      return {
        ...chatObj,
        sender: chatObj.senderFamilyMemberId,
        receiver: chatObj.receiverFamilyMemberId,
        replyTo: chatObj.replyTo ? {
          ...chatObj.replyTo,
          sender: chatObj.replyTo.senderFamilyMemberId
        } : null
      };
    });

    res.status(200).json({
      success: true,
      count: transformedChats.length,
      data: transformedChats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message
// @route   POST /api/chat
// @access  Private (Family members and admin)
export const sendMessage = async (req, res, next) => {
  try {
    const { message, replyToId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Get family member ID from session
    const familyMemberId = req.session.familyMemberId;
    const isAdmin = req.session.role === 'admin';
    
    if (!familyMemberId && !isAdmin) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // For admin, we allow sending even if not strictly a "family member" in DB, 
    // or assume the frontend handles the identity.
    
    // Verify family member exists (optional for admin if using mock ID)
    const familyMember = await FamilyMember.findById(familyMemberId);
    if (!familyMember && !isAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Family member not found'
      });
    }

    // Always create group chat messages
    const chatData = {
      senderFamilyMemberId: familyMemberId,
      message: message.trim(),
      isGroupChat: true,
      receiverFamilyMemberId: null
    };

    if (replyToId) {
      const replyTo = await Chat.findById(replyToId);
      if (!replyTo) {
        return res.status(404).json({
          success: false,
          message: 'Reply message not found'
        });
      }
      chatData.replyTo = replyToId;
    }

    const chat = await Chat.create(chatData);
    await chat.populate('senderFamilyMemberId', 'name nickname email avatar');
    if (chat.replyTo) {
      await chat.populate({
        path: 'replyTo',
        select: 'message senderFamilyMemberId',
        populate: {
          path: 'senderFamilyMemberId',
          select: 'name nickname avatar'
        }
      });
    }

    // Transform to match frontend expectations
    const chatObj = chat.toObject();
    const transformedChat = {
      ...chatObj,
      sender: chatObj.senderFamilyMemberId,
      receiver: chatObj.receiverFamilyMemberId,
      replyTo: chatObj.replyTo ? {
        ...chatObj.replyTo,
        sender: chatObj.replyTo.senderFamilyMemberId
      } : null
    };

    res.status(201).json({
      success: true,
      data: transformedChat
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a message
// @route   DELETE /api/chat/:id
// @access  Private (Family members can delete own, admin can delete any)
export const deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isAdmin = req.session?.role === 'admin';
    const familyMemberId = req.session?.familyMemberId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chat ID'
      });
    }

    const chat = await Chat.findById(id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Admin can delete any message, members can only delete their own
    if (!isAdmin) {
      if (!familyMemberId) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized'
        });
      }

      if (chat.senderFamilyMemberId.toString() !== familyMemberId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own messages'
        });
      }
    }

    // Permanently delete the message
    await Chat.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// This endpoint is removed - we only have group chat now


