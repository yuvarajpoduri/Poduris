import FamilyMember from '../models/FamilyMember.js';

export const protect = async (req, res, next) => {
  // 1. Try to use real session if available
  if (req.session && req.session.familyMemberId && req.session.familyMemberId !== 'admin') {
    try {
      const member = await FamilyMember.findById(req.session.familyMemberId).select('-password');
      if (member) {
        req.familyMember = member;
        req.user = member; // For backward compatibility
        req.session.userId = member._id.toString(); // Ensure userId is set for userController
        return next();
      }
    } catch (error) {
      console.error("SessionAuth failed, falling back to mock:", error);
    }
  }

  // 2. DEVELOPMENT BYPASS: Fallback to Admin if no valid login found
  if (!req.session) {
    req.session = {};
  }
  
  // Set session variables expected by controllers
  // Set session variables expected by controllers
  req.session.role = 'admin';
  // Use a valid, constant ObjectId for the mock admin
  req.session.userId = '507f1f77bcf86cd799439011'; 
  
  // Set request variables expected by controllers
  req.user = { 
    _id: '507f1f77bcf86cd799439011',  // Valid ObjectId
    role: 'admin',
    name: 'Admin',
    email: process.env.ADMIN_EMAIL || 'admin@poduris.com',
    status: 'approved'
  };

  return next();
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    // DEVELOPMENT BYPASS: Always authorize
    next();
  };
};

export const admin = authorize('admin');

