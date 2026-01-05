import Chat from '../models/Chat.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// @desc    Get group chat messages only
// @route   GET /api/chat
// @access  Private
export const getChats = async (req, res, next) => {
  try {
    // Force group chat only – ignore any one-to-one filters
    const query = {
      isGroupChat: true,
      deletedAt: null
    };

    const chats = await Chat.find(query)
      .populate('sender', 'name email avatar')
      .populate('receiver', 'name email')
      .populate('replyTo', 'message sender')
      // Oldest first; UI scrolls to bottom so most recent is visible when opened
      .sort({ createdAt: 1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: chats.length,
      data: chats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message
// @route   POST /api/chat
// @access  Private
export const sendMessage = async (req, res, next) => {
  try {
    const { message, replyToId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Check if user is approved
    if (req.user.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Only approved users can send messages'
      });
    }

    // Always create group chat messages
    const chatData = {
      sender: req.user.id,
      message: message.trim(),
      isGroupChat: true,
      receiver: null
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
    await chat.populate('sender', 'name email');
    await chat.populate('receiver', 'name email');
    if (chat.replyTo) {
      await chat.populate('replyTo', 'message sender');
    }

    res.status(201).json({
      success: true,
      data: chat
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a message
// @route   DELETE /api/chat/:id
// @access  Private
export const deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;

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

    // Only sender can delete their own message
    if (chat.sender.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages'
      });
    }

    chat.deletedAt = new Date();
    await chat.save();

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users for chat
// @route   GET /api/chat/users
// @access  Private
export const getChatUsers = async (req, res, next) => {
  try {
    const users = await User.find({ status: 'approved' })
      .select('name email')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};


