const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'farmconnect_mobile_secret_key_2024';

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

router.get('/test', (req, res) => {
  res.send('AUTH ROUTE WORKING');
});

// LOGIN - Accept phone and password
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    console.log('📱 Login attempt:', { phone, password: '***' });

    // Validate input
    if (!phone || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Phone and password are required' 
      });
    }

    // Find user by phone
    const user = await User.findOne({ phone });
    console.log('👤 User found:', user ? `${user.name} (${user.role})` : 'NOT FOUND');

    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Check password using the model's comparePassword method
    const isPasswordValid = await user.comparePassword(password);
    console.log('🔐 Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Check account status
    if (user.accountStatus !== 'active') {
      return res.status(403).json({ 
        success: false,
        message: `Account is ${user.accountStatus}` 
      });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Prepare user response (exclude sensitive data)
    const userResponse = {
      _id: user._id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      accountStatus: user.accountStatus,
    };

    console.log('✅ Login successful for:', user.phone);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userResponse,
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

module.exports = router;