import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const familyMemberSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: [true, 'Family ID is required'],
    unique: true,
    index: true
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
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    select: false,
    minlength: [6, 'Password must be at least 6 characters']
  },
  birthDate: {
    type: String,
    required: [true, 'Birth date is required'],
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Birth date must be in YYYY-MM-DD format']
  },
  anniversaryDate: {
    type: String,
    default: null,
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Anniversary date must be in YYYY-MM-DD format']
  },
  deathDate: {
    type: String,
    default: null,
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Death date must be in YYYY-MM-DD format'],
    validate: {
      validator: function(value) {
        if (!value) return true;
        return new Date(value) >= new Date(this.birthDate);
      },
      message: 'Death date must be after birth date'
    }
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: ['male', 'female', 'other']
  },
  parentId: {
    type: Number,
    default: null,
    index: true
  },
  spouseId: {
    type: Number,
    default: null,
    index: true
  },
  generation: {
    type: Number,
    required: [true, 'Generation is required'],
    min: [0, 'Generation must be non-negative']
  },
  avatar: {
    type: String,
    default: ''
  },
  occupation: {
    type: String,
    default: '',
    trim: true
  },
  location: {
    type: String,
    default: '',
    trim: true
  },
  bio: {
    type: String,
    default: '',
    trim: true
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
  }
}, {
  timestamps: true
});

// Hash password before saving
familyMemberSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  if (!this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
familyMemberSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Index for efficient queries
familyMemberSchema.index({ generation: 1 });

export default mongoose.model('FamilyMember', familyMemberSchema);

