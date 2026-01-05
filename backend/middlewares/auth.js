import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    // Check if user is in session
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    // Get user from database
    const user = await User.findById(req.session.userId).select('-password');

    if (!user) {
      // Clear invalid session
      req.session.destroy((err) => {
        if (err) console.error('Error destroying session:', err);
      });
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = user;
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
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }

    next();
  };
};

