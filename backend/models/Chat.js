import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  senderFamilyMemberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyMember',
    required: true,
    index: true
  },
  receiverFamilyMemberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyMember',
    default: null, // null for group chat
    index: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    default: null
  },
  isGroupChat: {
    type: Boolean,
    default: true // Default to group chat
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  }
}, {
  timestamps: true
});

// TTL index to auto-delete messages after 7 days
chatSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for efficient queries
chatSchema.index({ isGroupChat: 1, createdAt: -1 });
chatSchema.index({ senderFamilyMemberId: 1, createdAt: -1 });

export default mongoose.model('Chat', chatSchema);

