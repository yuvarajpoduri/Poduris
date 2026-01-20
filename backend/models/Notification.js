import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyMember',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyMember',
    // Optional because it could be a system notification
  },
  senderName: {
    type: String
    // To store sender name statically in case of deletion or if it's a system message
  },
  type: {
    type: String,
    enum: ['birthday_wish', 'admin_broadcast', 'system', 'event'],
    default: 'system'
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
