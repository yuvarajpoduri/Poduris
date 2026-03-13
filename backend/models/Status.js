import mongoose from 'mongoose';

const statusSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyMember',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userAvatar: {
    type: String,
    default: ''
  },
  imageUrl: {
    type: String,
    required: true
  },
  cloudinaryId: {
    type: String,
    required: true
  },
  viewedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyMember'
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // TTL: auto-delete after 24 hours (86400 seconds)
  }
});

// Index for efficient querying
statusSchema.index({ createdAt: 1 });
statusSchema.index({ user: 1, createdAt: -1 });

const Status = mongoose.model('Status', statusSchema);

export default Status;
