import mongoose from 'mongoose';

const gallerySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  imageUrl: {
    type: String,
    required: [true, 'Image URL is required']
  },
  cloudinaryId: {
    type: String,
    required: [true, 'Cloudinary ID is required']
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  familyMemberId: {
    type: Number,
    default: null
  }
}, {
  timestamps: true
});

export default mongoose.model('Gallery', gallerySchema);

