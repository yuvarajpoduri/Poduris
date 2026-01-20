import mongoose from 'mongoose';

const wishSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyMember',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId, // FamilyMember ID of the recipient
    ref: 'FamilyMember',
    required: true
  },
  /* 
     We also want to link to FamilyMember because sometimes we wish a FamilyMember 
     who doesn't have a user account yet? 
     The requirements say: "Birthday user sees... Other users..." implies User-to-User or User-to-Member.
     However, "Birthday user" usually implies a logged-in User. 
     Let's stick to User-to-User for now, but if the system relies on FamilyMember IDs for birthdays,
     we should store FamilyMember ID too.
     The dashboard shows birthdays of *FamilyMembers*.
     So we should probably link to FamilyMember ID.
  */
  recipientFamilyMemberId: {
    type: Number, // The numeric ID from FamilyMember model
    required: true
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [500, 'Message cannot be more than 500 characters']
  },
  year: {
    type: Number,
    required: true,
    default: () => new Date().getFullYear()
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index to ensure one wish per sender per recipient per year
wishSchema.index({ sender: 1, recipientFamilyMemberId: 1, year: 1 }, { unique: true });

export default mongoose.model('Wish', wishSchema);
