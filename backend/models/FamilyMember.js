import mongoose from 'mongoose';

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
  birthDate: {
    type: String,
    required: [true, 'Birth date is required'],
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Birth date must be in YYYY-MM-DD format']
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
  }
}, {
  timestamps: true
});

// Index for efficient queries
familyMemberSchema.index({ parentId: 1 });
familyMemberSchema.index({ spouseId: 1 });
familyMemberSchema.index({ generation: 1 });

export default mongoose.model('FamilyMember', familyMemberSchema);

