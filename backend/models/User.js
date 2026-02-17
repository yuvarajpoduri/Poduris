import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['admin', 'family_member'],
    default: 'family_member'
  },
  avatar: {
    type: String,
    default: ''
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  nickname: {
    type: String,
    trim: true,
    default: ''
  },
  bio: {
    type: String,
    default: '',
    trim: true
  },
  location: {
    type: String,
    default: '',
    trim: true
  },
  occupation: {
    type: String,
    default: '',
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  linkedFamilyMemberId: {
    type: Number,
    default: null
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  currentPath: {
    type: String,
    default: '/'
  },
  sessionTimeToday: {
    type: Number,
    default: 0
  },
  sessionTimeMonthly: {
    type: Number,
    default: 0
  },
  sessionTimeYearly: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);

