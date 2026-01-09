import FamilyMember from '../models/FamilyMember.js';

export const protect = async (req, res, next) => {
  try {
    // Check if user is in session
    if (!req.session || !req.session.familyMemberId || !req.session.role) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    // Handle admin
    if (req.session.role === 'admin') {
      req.familyMember = {
        _id: 'admin',
        id: 'admin',
        role: 'admin',
        email: process.env.ADMIN_EMAIL || 'admin@poduris.com',
        name: 'Admin'
      };
      req.user = req.familyMember; // For backward compatibility
      return next();
    }

    // Get family member from database
    const familyMember = await FamilyMember.findById(req.session.familyMemberId).select('-password');

    if (!familyMember) {
      // Clear invalid session
      req.session.destroy((err) => {
        if (err) console.error('Error destroying session:', err);
      });
      return res.status(401).json({
        success: false,
        message: 'Family member not found'
      });
    }

    req.familyMember = familyMember;
    req.user = familyMember; // For backward compatibility
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.familyMember && !req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const userRole = req.session?.role || (req.familyMember?.role || req.user?.role);
    
    // Map 'member' to 'family_member' for backward compatibility
    const mappedRole = userRole === 'member' ? 'family_member' : userRole;
    const mappedRoles = roles.map(r => r === 'family_member' ? 'member' : r);

    if (!mappedRoles.includes(userRole) && !roles.includes(mappedRole)) {
      return res.status(403).json({
        success: false,
        message: `User role '${userRole}' is not authorized to access this route`
      });
    }

    next();
  };
};

