const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'farmconnect_mobile_secret_key_2024';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to req.user
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Access token required' 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    if (user.accountStatus === 'banned') {
      return res.status(403).json({
        success: false,
        message: user.accountStatusReason || 'Your account has been banned by admin',
      });
    }

    if (user.accountStatus === 'suspended') {
      return res.status(403).json({
        success: false,
        message: user.accountStatusReason || 'Your account is temporarily suspended by admin',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ 
      success: false,
      message: 'Invalid token' 
    });
  }
};

module.exports = { authenticateToken };
