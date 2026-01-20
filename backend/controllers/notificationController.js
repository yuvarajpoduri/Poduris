import Notification from '../models/Notification.js';
import FamilyMember from '../models/FamilyMember.js';

// Helper to send global notification
export const sendGlobalNotification = async (message, type, senderId = null, senderName = 'System', extraData = {}) => {
  try {
    const users = await FamilyMember.find({ email: { $exists: true, $ne: null } }); // Only users with email (potential login)
    const notifications = users.map(user => {
        // Don't send notification to self if senderId is provided
        if (senderId && user._id.toString() === senderId.toString()) return null;
        
        return {
            recipient: user._id,
            sender: senderId,
            senderName,
            message,
            type: type || 'system',
            isRead: false,
            metadata: extraData 
        };
    }).filter(n => n !== null);
    
    if (notifications.length > 0) {
        await Notification.insertMany(notifications);
    }
  } catch (error) {
    console.error('Error sending global notification:', error);
  }
};

// Get notifications for the logged-in user
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50); // Limit to last 50 notifications
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a notification (Internal use or via specific endpoints)
export const createNotification = async (req, res) => {
  try {
    let { recipient, recipientFamilyId, message, type } = req.body;
    
    // Resolve recipient from family ID if provided
    if (recipientFamilyId && !recipient) {
        const member = await FamilyMember.findOne({ id: recipientFamilyId });
        if (member) {
            recipient = member._id;
        } else {
             // If no member found
             return res.status(200).json({ success: true, message: 'No family member found with this ID.' });
        }
    }

    if (!recipient) {
        return res.status(400).json({ message: 'Recipient is required' });
    }

    // Check if sender is available from auth middleware
    const sender = req.user ? req.user._id : null;
    const senderName = req.user ? req.user.name : 'System';

    // CRITICAL: Prevent users from sending wishes to themselves
    if (sender && recipient.toString() === sender.toString()) {
        return res.status(400).json({ 
            success: false, 
            message: 'You cannot send a wish to yourself' 
        });
    }

    const notification = new Notification({
      recipient,
      sender,
      senderName,
      message,
      type: type || 'system'
    });

    const savedNotification = await notification.save();
    res.status(201).json(savedNotification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Ensure the user owns the notification
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    notification.isRead = true;
    await notification.save();
    
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark ALL as read
export const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, isRead: false },
            { $set: { isRead: true } }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a notification
export const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        // Ensure the user owns the notification
        if (notification.recipient.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await notification.deleteOne();

        res.json({ message: 'Notification removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
