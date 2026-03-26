const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');

// Import Models
const User = require('./models/User');
const Crop = require('./models/Crop');
const Proposal = require('./models/Proposal');
const Order = require('./models/Order');

const app = express();
const port = Number(process.env.PORT || 5050);
const mongoUri = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'farmconnect_mobile_secret_key_2024';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
};

// ============ HEALTH CHECK ============
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// ============ AUTHENTICATION ROUTES ============

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, phone, password, role } = req.body;

    // Validation
    if (!name || !phone || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Mobile app - no +91 requirement, just 10 digits
    if (!/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number' });
    }

    if (!['farmer', 'trader', 'transport'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this phone number already exists' });
    }

    // Create new user
    const user = new User({
      name,
      phone,
      password,
      role,
    });

    // Generate OTP for verification
    const otp = user.generateOTP();
    await user.save();

    console.log(`OTP for ${phone}: ${otp}`); // For testing, in production use SMS service

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your phone number.',
      userId: user._id,
      // In real app, don't send OTP in response
      otp: otp, // Only for testing
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

// Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ message: 'User ID and OTP are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.verifyOTP(otp)) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Mark user as verified
    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Phone number verified successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'OTP verification failed', error: error.message });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: 'Phone and password are required' });
    }

    // Find user by phone
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(401).json({ message: 'Invalid phone number or password' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid phone number or password' });
    }

    // Check if user is verified
    if (!user.isVerified) {
      // Generate new OTP for unverified users
      const otp = user.generateOTP();
      await user.save();

      console.log(`OTP for ${phone}: ${otp}`); // For testing

      return res.status(403).json({
        message: 'Phone number not verified. Please verify your account.',
        needsVerification: true,
        userId: user._id,
        otp: otp, // Only for testing
      });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      phone: req.user.phone,
      role: req.user.role,
      isVerified: req.user.isVerified,
      kycStatus: req.user.kycStatus,
    },
  });
});

// ============ CROP ROUTES ============

// Get all available crops (for traders)
app.get('/api/crops/available', async (req, res) => {
  try {
    const { category, minPrice, maxPrice, qualityGrade } = req.query;

    // Build filter
    const filter = { status: 'available' };

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (qualityGrade && qualityGrade !== 'all') {
      filter.qualityGrade = qualityGrade;
    }

    const crops = await Crop.find(filter)
      .populate('farmerId', 'name phone location')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      data: crops,
      total: crops.length,
    });
  } catch (error) {
    console.error('Get crops error:', error);
    res.status(500).json({ message: 'Failed to fetch crops', error: error.message });
  }
});

// Get farmer's crops
app.get('/api/crops/my-crops', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'farmer') {
      return res.status(403).json({ message: 'Only farmers can access this endpoint' });
    }

    const crops = await Crop.find({ farmerId: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: crops,
    });
  } catch (error) {
    console.error('Get farmer crops error:', error);
    res.status(500).json({ message: 'Failed to fetch crops', error: error.message });
  }
});

// Add new crop (farmers only)
app.post('/api/crops/add', authenticateToken, upload.array('images', 5), async (req, res) => {
  try {
    if (req.user.role !== 'farmer') {
      return res.status(403).json({ message: 'Only farmers can add crops' });
    }

    const {
      cropName,
      category,
      quantity,
      unit,
      price,
      qualityGrade,
      description,
      harvestDate,
      pesticidesUsed,
      organic,
      minOrderQuantity,
      address,
      city,
      state,
      pincode,
    } = req.body;

    // Validation
    if (!cropName || !category || !quantity || !unit || !price || !qualityGrade || !harvestDate) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    // Process uploaded images
    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    // Create crop
    const crop = new Crop({
      cropName,
      category,
      quantity: Number(quantity),
      unit,
      price: Number(price),
      qualityGrade,
      description: description || '',
      farmerId: req.user._id,
      farmerName: req.user.name,
      farmerPhone: req.user.phone,
      images,
      location: {
        address,
        city,
        state,
        pincode,
      },
      harvestDate: new Date(harvestDate),
      pesticidesUsed: pesticidesUsed === 'true',
      organic: organic === 'true',
      minOrderQuantity: Number(minOrderQuantity) || 1,
    });

    await crop.save();

    res.status(201).json({
      success: true,
      message: 'Crop added successfully',
      data: crop,
    });
  } catch (error) {
    console.error('Add crop error:', error);
    res.status(500).json({ message: 'Failed to add crop', error: error.message });
  }
});

// Get crop by ID
app.get('/api/crops/:id', async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id)
      .populate('farmerId', 'name phone location kycStatus');

    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    res.json({
      success: true,
      data: crop,
    });
  } catch (error) {
    console.error('Get crop error:', error);
    res.status(500).json({ message: 'Failed to fetch crop', error: error.message });
  }
});

// ============ PROPOSAL ROUTES ============

// Create proposal (traders only)
app.post('/api/proposals', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'trader') {
      return res.status(403).json({ message: 'Only traders can create proposals' });
    }

    const {
      cropId,
      quantity,
      priceOffered,
      message,
      proposedDeliveryDate,
      paymentTerms,
      advanceAmount,
      deliveryAddress,
      deliveryCity,
      deliveryState,
      deliveryPincode,
    } = req.body;

    // Validation
    if (!cropId || !quantity || !priceOffered || !proposedDeliveryDate) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    // Get crop details
    const crop = await Crop.findById(cropId);
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    if (crop.status !== 'available') {
      return res.status(400).json({ message: 'Crop is not available' });
    }

    if (quantity > crop.quantity) {
      return res.status(400).json({ message: 'Requested quantity exceeds available quantity' });
    }

    // Calculate total amount
    const totalAmount = Number(quantity) * Number(priceOffered);

    // Create proposal
    const proposal = new Proposal({
      cropId,
      farmerId: crop.farmerId,
      traderId: req.user._id,
      quantity: Number(quantity),
      priceOffered: Number(priceOffered),
      totalAmount,
      message: message || '',
      proposedDeliveryDate: new Date(proposedDeliveryDate),
      paymentTerms: paymentTerms || 'on_delivery',
      advanceAmount: Number(advanceAmount) || 0,
      deliveryLocation: {
        address: deliveryAddress,
        city: deliveryCity,
        state: deliveryState,
        pincode: deliveryPincode,
      },
    });

    await proposal.save();

    res.status(201).json({
      success: true,
      message: 'Proposal created successfully',
      data: proposal,
    });
  } catch (error) {
    console.error('Create proposal error:', error);
    res.status(500).json({ message: 'Failed to create proposal', error: error.message });
  }
});

// Get farmer's received proposals
app.get('/api/proposals/farmer', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'farmer') {
      return res.status(403).json({ message: 'Only farmers can access this endpoint' });
    }

    const proposals = await Proposal.find({ farmerId: req.user._id })
      .populate('cropId', 'cropName category images')
      .populate('traderId', 'name phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: proposals,
    });
  } catch (error) {
    console.error('Get farmer proposals error:', error);
    res.status(500).json({ message: 'Failed to fetch proposals', error: error.message });
  }
});

// Get trader's sent proposals
app.get('/api/proposals/trader', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'trader') {
      return res.status(403).json({ message: 'Only traders can access this endpoint' });
    }

    const proposals = await Proposal.find({ traderId: req.user._id })
      .populate('cropId', 'cropName category images')
      .populate('farmerId', 'name phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: proposals,
    });
  } catch (error) {
    console.error('Get trader proposals error:', error);
    res.status(500).json({ message: 'Failed to fetch proposals', error: error.message });
  }
});

// Accept proposal (farmers only)
app.patch('/api/proposals/:id/accept', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'farmer') {
      return res.status(403).json({ message: 'Only farmers can accept proposals' });
    }

    const proposal = await Proposal.findById(req.params.id)
      .populate('cropId')
      .populate('traderId');

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    if (!proposal.farmerId.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to accept this proposal' });
    }

    if (proposal.status !== 'pending') {
      return res.status(400).json({ message: 'Proposal is not pending' });
    }

    // Update proposal status
    proposal.status = 'accepted';
    proposal.acceptedAt = new Date();
    await proposal.save();

    // Update crop status to reserved
    await Crop.findByIdAndUpdate(proposal.cropId._id, { status: 'reserved' });

    // Create order
    const order = new Order({
      proposalId: proposal._id,
      farmerId: proposal.farmerId,
      traderId: proposal.traderId,
      cropId: proposal.cropId._id,
      quantity: proposal.quantity,
      unit: proposal.cropId.unit,
      pricePerUnit: proposal.priceOffered,
      totalAmount: proposal.totalAmount,
      paymentStatus: proposal.advanceAmount > 0 ? 'partial' : 'pending',
      deliveryDetails: {
        address: proposal.deliveryLocation.address,
        city: proposal.deliveryLocation.city,
        state: proposal.deliveryLocation.state,
        pincode: proposal.deliveryLocation.pincode,
        scheduledDate: proposal.proposedDeliveryDate,
        contactPerson: proposal.traderId.name,
        contactPhone: proposal.traderId.phone,
      },
      farmingDetails: {
        harvestDate: proposal.cropId.harvestDate,
        qualityGrade: proposal.cropId.qualityGrade,
        pesticidesUsed: proposal.cropId.pesticidesUsed,
        organic: proposal.cropId.organic,
      },
    });

    await order.save();

    res.json({
      success: true,
      message: 'Proposal accepted and order created successfully',
      data: {
        proposal,
        order,
      },
    });
  } catch (error) {
    console.error('Accept proposal error:', error);
    res.status(500).json({ message: 'Failed to accept proposal', error: error.message });
  }
});

// Reject proposal (farmers only)
app.patch('/api/proposals/:id/reject', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'farmer') {
      return res.status(403).json({ message: 'Only farmers can reject proposals' });
    }

    const { reason } = req.body;

    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    if (!proposal.farmerId.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to reject this proposal' });
    }

    if (proposal.status !== 'pending') {
      return res.status(400).json({ message: 'Proposal is not pending' });
    }

    // Update proposal status
    proposal.status = 'rejected';
    proposal.rejectedAt = new Date();
    proposal.rejectionReason = reason || '';
    await proposal.save();

    res.json({
      success: true,
      message: 'Proposal rejected successfully',
      data: proposal,
    });
  } catch (error) {
    console.error('Reject proposal error:', error);
    res.status(500).json({ message: 'Failed to reject proposal', error: error.message });
  }
});

// ============ ORDER ROUTES ============

// Get farmer's orders
app.get('/api/orders/farmer/my-orders', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'farmer') {
      return res.status(403).json({ message: 'Only farmers can access this endpoint' });
    }

    const orders = await Order.find({ farmerId: req.user._id })
      .populate('cropId', 'cropName category images')
      .populate('traderId', 'name phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error('Get farmer orders error:', error);
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
});

// Get trader's orders
app.get('/api/orders/trader/my-orders', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'trader') {
      return res.status(403).json({ message: 'Only traders can access this endpoint' });
    }

    const orders = await Order.find({ traderId: req.user._id })
      .populate('cropId', 'cropName category images')
      .populate('farmerId', 'name phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error('Get trader orders error:', error);
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
});

// Get order by ID
app.get('/api/orders/:id', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('cropId')
      .populate('farmerId', 'name phone location')
      .populate('traderId', 'name phone location');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is authorized to view this order
    const isAuthorized = order.farmerId._id.equals(req.user._id) ||
      order.traderId._id.equals(req.user._id) ||
      (order.transportDetails.driverId && order.transportDetails.driverId.equals(req.user._id));

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Failed to fetch order', error: error.message });
  }
});

// Mark order as ready for pickup (farmers only)
app.put('/api/orders/ready/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'farmer') {
      return res.status(403).json({ message: 'Only farmers can mark orders as ready' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!order.farmerId.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot update cancelled order' });
    }

    // Update order status
    order.status = 'ready_for_pickup';
    await order.save();

    res.json({
      success: true,
      message: 'Order marked as ready for pickup',
      data: order,
    });
  } catch (error) {
    console.error('Mark ready error:', error);
    res.status(500).json({ message: 'Failed to update order', error: error.message });
  }
});

// Cancel order
app.put('/api/orders/cancel/:id', authenticateToken, async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check authorization
    const isAuthorized = order.farmerId.equals(req.user._id) || order.traderId.equals(req.user._id);
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }

    if (order.status === 'cancelled' || order.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel this order' });
    }

    // Update order
    order.status = 'cancelled';
    order.cancellationReason = reason || '';
    order.cancelledAt = new Date();
    order.cancelledBy = req.user._id;
    await order.save();

    // Make crop available again
    await Crop.findByIdAndUpdate(order.cropId, { status: 'available' });

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order,
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Failed to cancel order', error: error.message });
  }
});

// ============ FILE UPLOAD ROUTE ============
app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    res.json({
      success: true,
      message: 'File uploaded successfully',
      filename: req.file.filename,
      path: `/uploads/${req.file.filename}`
    });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

// ============ ERROR HANDLING ============
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ============ SERVER STARTUP ============
const start = async () => {
  try {
    if (!mongoUri) {
      console.warn('⚠️ MONGO_URI is not set. Backend will start without database connection.');
    } else {
      await mongoose.connect(mongoUri);
      console.log('✅ MongoDB connected successfully');

      // Create admin user if doesn't exist
      const adminExists = await User.findOne({ role: 'admin' });
      if (!adminExists) {
        const admin = new User({
          name: 'Admin User',
          phone: '9999999999',
          password: 'admin123',
          role: 'admin',
          isVerified: true,
        });
        await admin.save();
        console.log('👑 Admin user created - Phone: 9999999999, Password: admin123');
      }
    }

    app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 FarmConnect Mobile Backend running on http://localhost:${port}`);
      console.log(`📱 Health check: http://localhost:${port}/health`);
      console.log(`🌾 Ready for your mobile app!`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

start();