const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');

// Import Models
const User = require('./models/User');
const Crop = require('./models/Crop');
const Proposal = require('./models/Proposal');
const Order = require('./models/Order');
const Vehicle = require('./models/Vehicle');
const Transaction = require('./models/Transaction');
const Agreement = require('./models/Agreement');

const app = express();
const httpServer = http.createServer(app);
const port = Number(process.env.PORT || 5050);
const mongoUri = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'farmconnect_mobile_secret_key_2024';

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  },
});

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

const normalizeLocationPayload = (location = {}) => {
  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    latitude,
    longitude,
    accuracy: Number.isFinite(Number(location.accuracy)) ? Number(location.accuracy) : undefined,
    heading: Number.isFinite(Number(location.heading)) ? Number(location.heading) : undefined,
    speed: Number.isFinite(Number(location.speed)) ? Number(location.speed) : undefined,
    timestamp: location.timestamp ? new Date(location.timestamp) : new Date(),
  };
};

const toIdString = (value) => {
  if (!value) return '';
  if (value._id) return value._id.toString();
  return value.toString();
};

const idsEqual = (left, right) => toIdString(left) && toIdString(left) === toIdString(right);

const roundAmount = (value) => Math.round(Number(value || 0) * 100) / 100;

const buildAgreementDocumentBody = ({ order, cropName, farmerName, traderName }) => {
  const deliveryParts = [
    order.deliveryDetails?.address,
    order.deliveryDetails?.city,
    order.deliveryDetails?.state,
    order.deliveryDetails?.pincode,
  ].filter(Boolean);

  return [
    'FarmConnect Produce Trade Agreement',
    '',
    `Document Number: ${order.orderNumber}`,
    `Order Number: ${order.orderNumber}`,
    `Generated On: ${new Date().toISOString()}`,
    '',
    `Farmer: ${farmerName}`,
    `Trader: ${traderName}`,
    '',
    'Trade Terms:',
    `- Crop: ${cropName}`,
    `- Quantity: ${order.quantity} ${order.unit}`,
    `- Price Per Unit: ${order.pricePerUnit}`,
    `- Total Amount: ${order.totalAmount}`,
    `- Payment Method: ${order.paymentDetails?.method || 'upi'}`,
    `- Payment Reference: ${order.paymentDetails?.transactionId || 'N/A'}`,
    `- Delivery Address: ${deliveryParts.join(', ') || 'Not specified'}`,
    '',
    'Disclaimer:',
    'FarmConnect facilitates this trade. Quality and fulfillment are governed by the signed terms between farmer and trader.',
  ].join('\n');
};

const ensureAgreementForOrder = async (orderId, sourceTransaction = null) => {
  const existingAgreement = await Agreement.findOne({ orderId });

  if (existingAgreement) {
    if (!existingAgreement.generatedAfterTransaction && sourceTransaction?._id) {
      existingAgreement.generatedAfterTransaction = sourceTransaction._id;
      await existingAgreement.save();
    }

    await Order.findByIdAndUpdate(orderId, {
      agreementId: existingAgreement._id,
      agreementStatus: existingAgreement.status,
      agreementGeneratedAt: existingAgreement.createdAt,
    });

    return existingAgreement;
  }

  const order = await Order.findById(orderId)
    .populate('cropId', 'cropName')
    .populate('farmerId', 'name')
    .populate('traderId', 'name');

  if (!order) {
    return null;
  }

  const agreement = await Agreement.create({
    orderId: order._id,
    farmerId: order.farmerId?._id || order.farmerId,
    traderId: order.traderId?._id || order.traderId,
    generatedAfterTransaction: sourceTransaction?._id,
    documentBody: buildAgreementDocumentBody({
      order,
      cropName: order.cropId?.cropName || 'Produce',
      farmerName: order.farmerId?.name || 'Farmer',
      traderName: order.traderId?.name || 'Trader',
    }),
    terms: {
      cropName: order.cropId?.cropName || 'Produce',
      quantity: order.quantity,
      unit: order.unit,
      pricePerUnit: order.pricePerUnit,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentDetails?.method || 'upi',
      paymentReference: order.paymentDetails?.transactionId || '',
      deliveryAddress: order.deliveryDetails?.address || '',
      deliveryCity: order.deliveryDetails?.city || '',
      deliveryState: order.deliveryDetails?.state || '',
      deliveryPincode: order.deliveryDetails?.pincode || '',
      agreedOn: new Date(),
    },
    status: 'pending_farmer',
  });

  await Order.findByIdAndUpdate(orderId, {
    agreementId: agreement._id,
    agreementStatus: 'pending_farmer',
    agreementGeneratedAt: new Date(),
  });

  return agreement;
};

const emitOrderStatusUpdate = async (orderId, triggeredBy = '') => {
  try {
    const order = await Order.findById(orderId)
      .populate('farmerId', 'name phone')
      .populate('traderId', 'name phone')
      .populate('cropId', 'cropName');

    if (!order) return;

    const payload = {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      cropName: order.cropId?.cropName || '',
      updatedAt: order.updatedAt,
      triggeredBy,
    };

    io.to(`order:${order._id.toString()}`).emit('order:status', payload);
    io.to(`delivery:${order._id.toString()}`).emit('order:status', payload);

    if (order.farmerId?._id) {
      io.to(`user:${order.farmerId._id.toString()}`).emit('order:status', payload);
    }
    if (order.traderId?._id) {
      io.to(`user:${order.traderId._id.toString()}`).emit('order:status', payload);
    }
  } catch (error) {
    console.warn('Order status socket emit failed:', error.message);
  }
};

const emitDeliveryLocationUpdate = async (orderId, location) => {
  try {
    const order = await Order.findById(orderId)
      .populate('farmerId', 'name phone')
      .populate('traderId', 'name phone')
      .populate('transportDetails.driverId', 'name phone');

    if (!order) return;

    const payload = {
      deliveryId: order._id.toString(),
      orderNumber: order.orderNumber,
      status: order.status,
      location,
      transporter: {
        id: order.transportDetails?.driverId?._id?.toString() || '',
        name: order.transportDetails?.driverId?.name || '',
        phone: order.transportDetails?.driverId?.phone || '',
      },
      updatedAt: new Date(),
    };

    io.to(`delivery:${order._id.toString()}`).emit('delivery:location', payload);

    if (order.farmerId?._id) {
      io.to(`user:${order.farmerId._id.toString()}`).emit('delivery:location', payload);
    }
    if (order.traderId?._id) {
      io.to(`user:${order.traderId._id.toString()}`).emit('delivery:location', payload);
    }
  } catch (error) {
    console.warn('Delivery location socket emit failed:', error.message);
  }
};

io.use(async (socket, next) => {
  try {
    const authToken = socket.handshake?.auth?.token;
    const bearerHeader = socket.handshake?.headers?.authorization || '';
    const bearerToken = bearerHeader.startsWith('Bearer ') ? bearerHeader.split(' ')[1] : null;
    const token = authToken || bearerToken;

    if (!token) {
      return next(new Error('Socket authentication token missing'));
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return next(new Error('User not found for socket token'));
    }

    socket.user = user;
    return next();
  } catch (error) {
    return next(new Error('Socket authentication failed'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.user?._id?.toString();
  const userRole = socket.user?.role;

  if (userId) {
    socket.join(`user:${userId}`);
  }

  if (userRole) {
    socket.join(`role:${userRole}`);
  }

  socket.on('join-room', ({ room } = {}, ack) => {
    if (!room) {
      if (typeof ack === 'function') ack({ success: false, message: 'room is required' });
      return;
    }

    socket.join(room);
    if (typeof ack === 'function') ack({ success: true, room });
  });

  socket.on('leave-room', ({ room } = {}, ack) => {
    if (!room) {
      if (typeof ack === 'function') ack({ success: false, message: 'room is required' });
      return;
    }

    socket.leave(room);
    if (typeof ack === 'function') ack({ success: true, room });
  });

  socket.on('tracking:subscribe', ({ deliveryId } = {}, ack) => {
    if (!deliveryId) {
      if (typeof ack === 'function') ack({ success: false, message: 'deliveryId is required' });
      return;
    }

    socket.join(`delivery:${deliveryId}`);
    socket.join(`order:${deliveryId}`);
    if (typeof ack === 'function') ack({ success: true, deliveryId });
  });

  socket.on('tracking:unsubscribe', ({ deliveryId } = {}, ack) => {
    if (!deliveryId) {
      if (typeof ack === 'function') ack({ success: false, message: 'deliveryId is required' });
      return;
    }

    socket.leave(`delivery:${deliveryId}`);
    socket.leave(`order:${deliveryId}`);
    if (typeof ack === 'function') ack({ success: true, deliveryId });
  });

  socket.on('delivery:location:update', async ({ deliveryId, location } = {}, ack) => {
    try {
      if (!deliveryId || !location) {
        if (typeof ack === 'function') ack({ success: false, message: 'deliveryId and location are required' });
        return;
      }

      if (socket.user?.role !== 'transport') {
        if (typeof ack === 'function') ack({ success: false, message: 'Only transport users can update location' });
        return;
      }

      const normalizedLocation = normalizeLocationPayload(location);
      if (!normalizedLocation) {
        if (typeof ack === 'function') ack({ success: false, message: 'Invalid location coordinates' });
        return;
      }

      const order = await Order.findOne({
        _id: deliveryId,
        'transportDetails.driverId': socket.user._id,
      });

      if (!order) {
        if (typeof ack === 'function') ack({ success: false, message: 'Delivery not found or not assigned' });
        return;
      }

      order.transportDetails = {
        ...(order.transportDetails || {}),
        currentLocation: normalizedLocation,
      };

      const locationHistory = [
        ...(order.transportDetails.locationHistory || []),
        normalizedLocation,
      ];

      // Keep only recent points to prevent unbounded growth.
      order.transportDetails.locationHistory = locationHistory.slice(-200);
      await order.save();

      await emitDeliveryLocationUpdate(order._id, normalizedLocation);

      if (typeof ack === 'function') {
        ack({ success: true, deliveryId: order._id.toString(), location: normalizedLocation });
      }
    } catch (error) {
      if (typeof ack === 'function') {
        ack({ success: false, message: error.message || 'Failed to update location' });
      }
    }
  });
});

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

    console.log('📝 Add Crop Request:', {
      userId: req.user._id,
      userName: req.user.name,
      cropName,
      category,
      quantity,
      unit,
      price,
      qualityGrade,
      hasImages: !!req.files && req.files.length > 0,
      imageCount: req.files ? req.files.length : 0,
    });

    // Validation
    if (!cropName || !category || !quantity || !unit || !price || !qualityGrade || !harvestDate) {
      console.warn('⚠️ Missing required fields:', {
        cropName: !!cropName,
        category: !!category,
        quantity: !!quantity,
        unit: !!unit,
        price: !!price,
        qualityGrade: !!qualityGrade,
        harvestDate: !!harvestDate,
      });
      return res.status(400).json({
        message: 'Required fields missing',
        missing: {
          cropName: !cropName,
          category: !category,
          quantity: !quantity,
          unit: !unit,
          price: !price,
          qualityGrade: !qualityGrade,
          harvestDate: !harvestDate,
        }
      });
    }

    // Process uploaded images
    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    console.log('🖼️ Images mapped:', images);

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

    const savedCrop = await crop.save();
    console.log('✅ Crop saved successfully:', savedCrop._id);

    res.status(201).json({
      success: true,
      message: 'Crop added successfully',
      data: savedCrop,
    });
  } catch (error) {
    console.error('❌ Add crop error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name,
    });
    res.status(500).json({
      message: 'Failed to add crop',
      error: error.message,
      details: error.message.includes('Cast') ? 'Invalid data format' : undefined
    });
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
    const isAuthorized =
      req.user.role === 'admin' ||
      order.farmerId._id.equals(req.user._id) ||
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

    await emitOrderStatusUpdate(order._id, 'farmer_ready_for_pickup');

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

    await emitOrderStatusUpdate(order._id, 'order_cancelled');

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

// ============ TRANSACTION ROUTES (DUMMY PAYMENTS) ============

app.post('/api/transactions', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'trader' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only traders can create payment transactions' });
    }

    const {
      orderId,
      amount,
      paymentMethod = 'upi',
      type = 'full_payment',
      notes = '',
      metadata,
      status = 'completed',
    } = req.body || {};

    if (!orderId) {
      return res.status(400).json({ message: 'orderId is required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const canPay = req.user.role === 'admin' || idsEqual(order.traderId, req.user._id);
    if (!canPay) {
      return res.status(403).json({ message: 'Not authorized to pay for this order' });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot create payment for a cancelled order' });
    }

    const paidAmountBefore = Number(order.paymentDetails?.paidAmount || 0);
    const orderTotal = Number(order.totalAmount || 0);
    const remainingAmount = roundAmount(Math.max(orderTotal - paidAmountBefore, 0));

    if (remainingAmount <= 0) {
      return res.status(400).json({ message: 'Order is already fully paid' });
    }

    const requestedAmount = amount !== undefined ? Number(amount) : remainingAmount;
    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    const paymentAmount = roundAmount(Math.min(requestedAmount, remainingAmount));
    const allowedMethods = ['upi', 'bank_transfer', 'cash', 'cheque'];
    const requestedMethod = String(paymentMethod || 'upi').toLowerCase();
    const normalizedMethod = allowedMethods.includes(requestedMethod) ? requestedMethod : 'upi';

    const allowedStatuses = ['pending', 'completed', 'failed'];
    const requestedStatus = String(status || 'completed').toLowerCase();
    const normalizedStatus = allowedStatuses.includes(requestedStatus) ? requestedStatus : 'completed';

    const transaction = await Transaction.create({
      orderId: order._id,
      payerId: req.user._id,
      payeeId: order.farmerId,
      type,
      amount: paymentAmount,
      status: normalizedStatus,
      paymentMethod: normalizedMethod,
      gateway: 'dummy',
      notes,
      metadata,
    });

    let generatedAgreement = null;

    if (normalizedStatus === 'completed') {
      const paidAmountAfter = roundAmount(Math.min(paidAmountBefore + paymentAmount, orderTotal));
      const nextPaymentStatus = paidAmountAfter >= orderTotal ? 'paid' : 'partial';

      order.paymentStatus = nextPaymentStatus;
      order.paymentDetails = {
        ...(order.paymentDetails || {}),
        method: normalizedMethod,
        transactionId: transaction.referenceNumber,
        paidAmount: paidAmountAfter,
        paidAt: new Date(),
      };

      if (order.status === 'confirmed') {
        order.status = nextPaymentStatus === 'paid' ? 'payment_received' : 'payment_pending';
      }

      if (order.status === 'payment_pending' && nextPaymentStatus === 'paid') {
        order.status = 'payment_received';
      }

      if (nextPaymentStatus === 'paid') {
        generatedAgreement = await ensureAgreementForOrder(order._id, transaction);
        if (generatedAgreement) {
          order.agreementId = generatedAgreement._id;
          order.agreementStatus = generatedAgreement.status;
          order.agreementGeneratedAt = generatedAgreement.createdAt;
        }
      }

      await order.save();
      await emitOrderStatusUpdate(order._id, 'transaction_completed');
    }

    const updatedOrder = await Order.findById(order._id)
      .populate('cropId', 'cropName category images')
      .populate('farmerId', 'name phone')
      .populate('traderId', 'name phone');

    let agreementPayload = null;
    if (generatedAgreement) {
      agreementPayload = await Agreement.findById(generatedAgreement._id)
        .populate('generatedAfterTransaction', 'referenceNumber amount status paymentMethod completedAt')
        .populate('farmerId', 'name phone')
        .populate('traderId', 'name phone');
    }

    res.status(201).json({
      success: true,
      message: normalizedStatus === 'completed'
        ? 'Dummy payment recorded successfully'
        : 'Transaction created in simulation mode',
      data: {
        transaction,
        order: updatedOrder,
        agreement: agreementPayload,
      },
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ message: 'Failed to create transaction', error: error.message });
  }
});

app.get('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const { status, type, orderId, page = 1, limit = 20 } = req.query;

    let scopeQuery = null;
    if (req.user.role === 'trader') {
      scopeQuery = { payerId: req.user._id };
    } else if (req.user.role === 'farmer') {
      scopeQuery = { payeeId: req.user._id };
    } else if (req.user.role === 'admin') {
      scopeQuery = {};
    }

    if (!scopeQuery) {
      return res.status(403).json({ message: 'This role cannot access transactions' });
    }

    const query = {
      ...scopeQuery,
    };

    if (status) query.status = status;
    if (type) query.type = type;
    if (orderId) query.orderId = orderId;

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNumber - 1) * pageSize;

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate('orderId', 'orderNumber totalAmount paymentStatus status agreementStatus')
        .populate('payerId', 'name phone role')
        .populate('payeeId', 'name phone role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      Transaction.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page: pageNumber,
        pages: Math.ceil(total / pageSize),
        limit: pageSize,
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Failed to fetch transactions', error: error.message });
  }
});

app.get('/api/transactions/stats', authenticateToken, async (req, res) => {
  try {
    let scopeMatch = null;
    if (req.user.role === 'trader') {
      scopeMatch = { payerId: req.user._id };
    } else if (req.user.role === 'farmer') {
      scopeMatch = { payeeId: req.user._id };
    } else if (req.user.role === 'admin') {
      scopeMatch = {};
    }

    if (!scopeMatch) {
      return res.status(403).json({ message: 'This role cannot access transaction stats' });
    }

    const [overall, byStatus, byType] = await Promise.all([
      Transaction.aggregate([
        { $match: scopeMatch },
        {
          $group: {
            _id: null,
            totalTransactions: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            completedAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0],
              },
            },
          },
        },
      ]),
      Transaction.aggregate([
        { $match: scopeMatch },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            amount: { $sum: '$amount' },
          },
        },
      ]),
      Transaction.aggregate([
        { $match: scopeMatch },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            amount: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        overall: overall[0] || {
          totalTransactions: 0,
          totalAmount: 0,
          completedAmount: 0,
        },
        byStatus,
        byType,
      },
    });
  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({ message: 'Failed to fetch transaction stats', error: error.message });
  }
});

app.get('/api/transactions/reference/:referenceNumber', authenticateToken, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      referenceNumber: req.params.referenceNumber,
    })
      .populate('orderId', 'orderNumber totalAmount paymentStatus status agreementStatus')
      .populate('payerId', 'name phone role')
      .populate('payeeId', 'name phone role');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const canAccess =
      req.user.role === 'admin' ||
      idsEqual(transaction.payerId, req.user._id) ||
      idsEqual(transaction.payeeId, req.user._id);

    if (!canAccess) {
      return res.status(403).json({ message: 'Not authorized to view this transaction' });
    }

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error('Get transaction by reference error:', error);
    res.status(500).json({ message: 'Failed to fetch transaction', error: error.message });
  }
});

app.get('/api/transactions/:transactionId', authenticateToken, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.transactionId)
      .populate('orderId', 'orderNumber totalAmount paymentStatus status agreementStatus')
      .populate('payerId', 'name phone role')
      .populate('payeeId', 'name phone role');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const canAccess =
      req.user.role === 'admin' ||
      idsEqual(transaction.payerId, req.user._id) ||
      idsEqual(transaction.payeeId, req.user._id);

    if (!canAccess) {
      return res.status(403).json({ message: 'Not authorized to view this transaction' });
    }

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error('Get transaction details error:', error);
    res.status(500).json({ message: 'Failed to fetch transaction details', error: error.message });
  }
});

// ============ AGREEMENT ROUTES (LEGAL DOCUMENTS) ============

app.get('/api/agreements', authenticateToken, async (req, res) => {
  try {
    const { status, orderId, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (orderId) query.orderId = orderId;

    if (req.user.role === 'farmer') {
      query.farmerId = req.user._id;
    } else if (req.user.role === 'trader') {
      query.traderId = req.user._id;
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'This role cannot access agreements list' });
    }

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNumber - 1) * pageSize;

    const [agreements, total] = await Promise.all([
      Agreement.find(query)
        .populate('orderId', 'orderNumber totalAmount paymentStatus status')
        .populate('farmerId', 'name phone role')
        .populate('traderId', 'name phone role')
        .populate('generatedAfterTransaction', 'referenceNumber amount status paymentMethod completedAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      Agreement.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: agreements,
      pagination: {
        total,
        page: pageNumber,
        pages: Math.ceil(total / pageSize),
        limit: pageSize,
      },
    });
  } catch (error) {
    console.error('Get agreements list error:', error);
    res.status(500).json({ message: 'Failed to fetch agreements', error: error.message });
  }
});

app.get('/api/agreements/stats', authenticateToken, async (req, res) => {
  try {
    const scopeMatch = {};

    if (req.user.role === 'farmer') {
      scopeMatch.farmerId = req.user._id;
    } else if (req.user.role === 'trader') {
      scopeMatch.traderId = req.user._id;
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'This role cannot access agreement stats' });
    }

    const [overall, byStatus] = await Promise.all([
      Agreement.aggregate([
        { $match: scopeMatch },
        {
          $group: {
            _id: null,
            totalAgreements: { $sum: 1 },
            completedAgreements: {
              $sum: {
                $cond: [{ $eq: ['$status', 'completed'] }, 1, 0],
              },
            },
            pendingAgreements: {
              $sum: {
                $cond: [{ $in: ['$status', ['pending_farmer', 'pending_trader']] }, 1, 0],
              },
            },
            cancelledAgreements: {
              $sum: {
                $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0],
              },
            },
          },
        },
      ]),
      Agreement.aggregate([
        { $match: scopeMatch },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        overall: overall[0] || {
          totalAgreements: 0,
          completedAgreements: 0,
          pendingAgreements: 0,
          cancelledAgreements: 0,
        },
        byStatus,
      },
    });
  } catch (error) {
    console.error('Get agreement stats error:', error);
    res.status(500).json({ message: 'Failed to fetch agreement stats', error: error.message });
  }
});

app.get('/api/agreements/:orderId/export', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const canAccess =
      req.user.role === 'admin' ||
      idsEqual(order.farmerId, req.user._id) ||
      idsEqual(order.traderId, req.user._id);

    if (!canAccess) {
      return res.status(403).json({ message: 'Not authorized to export this agreement' });
    }

    const agreement = await Agreement.findOne({ orderId: order._id })
      .populate('orderId', 'orderNumber totalAmount paymentStatus status')
      .populate('farmerId', 'name phone')
      .populate('traderId', 'name phone')
      .populate('generatedAfterTransaction', 'referenceNumber amount status paymentMethod completedAt');

    if (!agreement) {
      return res.status(404).json({ message: 'Agreement not found' });
    }

    const lines = [
      agreement.title || 'FarmConnect Produce Trade Agreement',
      '',
      `Document Number: ${agreement.documentNumber || 'N/A'}`,
      `Order Number: ${agreement.orderId?.orderNumber || 'N/A'}`,
      `Agreement Status: ${agreement.status || 'N/A'}`,
      '',
      `Farmer: ${agreement.farmerId?.name || 'N/A'} (${agreement.farmerId?.phone || '-'})`,
      `Trader: ${agreement.traderId?.name || 'N/A'} (${agreement.traderId?.phone || '-'})`,
      '',
      `Crop: ${agreement.terms?.cropName || '-'}`,
      `Quantity: ${agreement.terms?.quantity || 0} ${agreement.terms?.unit || ''}`,
      `Price Per Unit: ${agreement.terms?.pricePerUnit || 0}`,
      `Total Amount: ${agreement.terms?.totalAmount || agreement.orderId?.totalAmount || 0}`,
      `Payment Method: ${agreement.terms?.paymentMethod || '-'}`,
      `Payment Reference: ${agreement.terms?.paymentReference || agreement.generatedAfterTransaction?.referenceNumber || '-'}`,
      '',
      `Farmer Signature: ${agreement.farmerSignature?.signed ? `Signed by ${agreement.farmerSignature?.digitalSignature || 'Farmer'}` : 'Pending'}`,
      `Trader Signature: ${agreement.traderSignature?.signed ? `Signed by ${agreement.traderSignature?.digitalSignature || 'Trader'}` : 'Pending'}`,
      '',
      'Document Body:',
      agreement.documentBody || '',
    ];

    const content = lines.join('\n');

    res.json({
      success: true,
      data: {
        fileName: `${agreement.documentNumber || agreement.orderId?.orderNumber || 'agreement'}.txt`,
        content,
      },
    });
  } catch (error) {
    console.error('Export agreement error:', error);
    res.status(500).json({ message: 'Failed to export agreement', error: error.message });
  }
});

app.get('/api/agreements/:orderId', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const canAccess =
      req.user.role === 'admin' ||
      idsEqual(order.farmerId, req.user._id) ||
      idsEqual(order.traderId, req.user._id);

    if (!canAccess) {
      return res.status(403).json({ message: 'Not authorized to view this agreement' });
    }

    const agreement = await Agreement.findOne({ orderId: order._id })
      .populate('orderId', 'orderNumber totalAmount paymentStatus status')
      .populate('farmerId', 'name phone')
      .populate('traderId', 'name phone')
      .populate('generatedAfterTransaction', 'referenceNumber amount status paymentMethod completedAt');

    if (!agreement) {
      return res.status(404).json({
        message: 'Agreement has not been generated yet. Complete payment first.',
      });
    }

    res.json({
      success: true,
      data: agreement,
    });
  } catch (error) {
    console.error('Get agreement error:', error);
    res.status(500).json({ message: 'Failed to fetch agreement', error: error.message });
  }
});

app.post('/api/agreements/farmer-sign/:orderId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'farmer') {
      return res.status(403).json({ message: 'Only farmers can sign this agreement' });
    }

    const { digitalSignature, acceptedTerms = true } = req.body || {};
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!idsEqual(order.farmerId, req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to sign this agreement' });
    }

    let agreement = await Agreement.findOne({ orderId: order._id });
    if (!agreement && order.paymentStatus === 'paid') {
      agreement = await ensureAgreementForOrder(order._id);
    }

    if (!agreement) {
      return res.status(400).json({ message: 'Agreement not generated yet. Complete payment first.' });
    }

    if (agreement.status === 'completed') {
      return res.status(400).json({ message: 'Agreement is already completed' });
    }

    if (agreement.status === 'cancelled') {
      return res.status(400).json({ message: 'Agreement is cancelled and cannot be signed' });
    }

    if (agreement.farmerSignature?.signed) {
      return res.status(400).json({ message: 'Farmer has already signed this agreement' });
    }

    agreement.farmerSignature = {
      signed: true,
      signedAt: new Date(),
      digitalSignature: digitalSignature || req.user.name,
      acceptedTerms: acceptedTerms !== false,
    };
    agreement.status = 'pending_trader';
    await agreement.save();

    order.agreementId = agreement._id;
    order.agreementStatus = 'pending_trader';
    if (!order.agreementGeneratedAt) {
      order.agreementGeneratedAt = agreement.createdAt;
    }
    await order.save();

    await emitOrderStatusUpdate(order._id, 'agreement_farmer_signed');

    const populatedAgreement = await Agreement.findById(agreement._id)
      .populate('orderId', 'orderNumber totalAmount paymentStatus status')
      .populate('farmerId', 'name phone')
      .populate('traderId', 'name phone')
      .populate('generatedAfterTransaction', 'referenceNumber amount status paymentMethod completedAt');

    res.json({
      success: true,
      message: 'Agreement signed successfully. Waiting for trader signature.',
      data: populatedAgreement,
    });
  } catch (error) {
    console.error('Farmer sign agreement error:', error);
    res.status(500).json({ message: 'Failed to sign agreement', error: error.message });
  }
});

app.post('/api/agreements/trader-sign/:orderId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'trader') {
      return res.status(403).json({ message: 'Only traders can sign this agreement' });
    }

    const { digitalSignature, acceptedTerms = true } = req.body || {};
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!idsEqual(order.traderId, req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to sign this agreement' });
    }

    const agreement = await Agreement.findOne({ orderId: order._id });
    if (!agreement) {
      return res.status(404).json({ message: 'Agreement not found' });
    }

    if (!agreement.farmerSignature?.signed) {
      return res.status(400).json({ message: 'Farmer must sign the agreement first' });
    }

    if (agreement.status === 'completed' || agreement.traderSignature?.signed) {
      return res.status(400).json({ message: 'Agreement is already completed' });
    }

    if (agreement.status === 'cancelled') {
      return res.status(400).json({ message: 'Agreement is cancelled and cannot be signed' });
    }

    agreement.traderSignature = {
      signed: true,
      signedAt: new Date(),
      digitalSignature: digitalSignature || req.user.name,
      acceptedTerms: acceptedTerms !== false,
    };
    agreement.status = 'completed';
    agreement.completedAt = new Date();
    await agreement.save();

    order.agreementId = agreement._id;
    order.agreementStatus = 'completed';
    if (!order.agreementGeneratedAt) {
      order.agreementGeneratedAt = agreement.createdAt;
    }

    if (order.status === 'delivered' && order.paymentStatus === 'paid') {
      order.status = 'completed';
    }

    await order.save();

    await emitOrderStatusUpdate(order._id, 'agreement_trader_signed');

    const populatedAgreement = await Agreement.findById(agreement._id)
      .populate('orderId', 'orderNumber totalAmount paymentStatus status')
      .populate('farmerId', 'name phone')
      .populate('traderId', 'name phone')
      .populate('generatedAfterTransaction', 'referenceNumber amount status paymentMethod completedAt');

    res.json({
      success: true,
      message: 'Agreement completed successfully',
      data: populatedAgreement,
    });
  } catch (error) {
    console.error('Trader sign agreement error:', error);
    res.status(500).json({ message: 'Failed to sign agreement', error: error.message });
  }
});

app.post('/api/agreements/cancel/:orderId', authenticateToken, async (req, res) => {
  try {
    const { reason = '' } = req.body || {};

    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const canCancel =
      req.user.role === 'admin' ||
      idsEqual(order.farmerId, req.user._id) ||
      idsEqual(order.traderId, req.user._id);

    if (!canCancel) {
      return res.status(403).json({ message: 'Not authorized to cancel this agreement' });
    }

    const agreement = await Agreement.findOne({ orderId: order._id });
    if (!agreement) {
      return res.status(404).json({ message: 'Agreement not found' });
    }

    if (agreement.status === 'completed') {
      return res.status(400).json({ message: 'Completed agreement cannot be cancelled' });
    }

    if (agreement.status === 'cancelled') {
      return res.status(400).json({ message: 'Agreement is already cancelled' });
    }

    agreement.status = 'cancelled';
    agreement.cancelledBy = req.user._id;
    agreement.cancellationReason = reason || 'Agreement cancelled by participant';
    agreement.cancelledAt = new Date();
    await agreement.save();

    order.agreementStatus = 'cancelled';
    order.agreementId = agreement._id;
    await order.save();

    await emitOrderStatusUpdate(order._id, 'agreement_cancelled');

    res.json({
      success: true,
      message: 'Agreement cancelled successfully',
      data: agreement,
    });
  } catch (error) {
    console.error('Cancel agreement error:', error);
    res.status(500).json({ message: 'Failed to cancel agreement', error: error.message });
  }
});

// ============ TRANSPORT ROUTES ============

const ensureTransportRole = (req, res) => {
  if (req.user.role !== 'transport') {
    res.status(403).json({ message: 'Only transport users can access this endpoint' });
    return false;
  }
  return true;
};

const toKg = (value, unit = 'kg') => {
  const numericValue = Number(value || 0);

  if (unit === 'ton') return numericValue * 1000;
  if (unit === 'quintal') return numericValue * 100;
  return numericValue;
};

// Get available orders for transport assignment
app.get('/api/transport/available', authenticateToken, async (req, res) => {
  try {
    if (!ensureTransportRole(req, res)) return;

    const { city, state } = req.query;
    const filter = {
      status: 'ready_for_pickup',
      $or: [
        { 'transportDetails.driverId': { $exists: false } },
        { 'transportDetails.driverId': null },
      ],
    };

    if (city) {
      filter['deliveryDetails.city'] = city;
    }

    if (state) {
      filter['deliveryDetails.state'] = state;
    }

    const orders = await Order.find(filter)
      .populate('cropId', 'cropName category images')
      .populate('farmerId', 'name phone location')
      .populate('traderId', 'name phone location')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: orders,
      total: orders.length,
    });
  } catch (error) {
    console.error('Get transport available orders error:', error);
    res.status(500).json({ message: 'Failed to fetch available transport orders', error: error.message });
  }
});

// Accept delivery assignment
app.put('/api/transport/accept/:orderId', authenticateToken, async (req, res) => {
  try {
    if (!ensureTransportRole(req, res)) return;

    const { vehicleNumber, note } = req.body || {};
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const alreadyAssignedToAnother =
      order.transportDetails?.driverId && !order.transportDetails.driverId.equals(req.user._id);

    if (alreadyAssignedToAnother) {
      return res.status(400).json({ message: 'This order is already assigned to another transporter' });
    }

    if (order.status !== 'ready_for_pickup' && order.status !== 'in_transit') {
      return res.status(400).json({ message: 'Only ready-for-pickup orders can be accepted' });
    }

    order.transportDetails = {
      ...(order.transportDetails || {}),
      driverId: req.user._id,
      vehicleNumber: vehicleNumber || order.transportDetails?.vehicleNumber || '',
      pickupTime: order.transportDetails?.pickupTime || new Date(),
    };

    order.notes = {
      ...(order.notes || {}),
      transport: note || `Accepted by ${req.user.name}`,
    };

    order.status = 'in_transit';
    await order.save();

    await emitOrderStatusUpdate(order._id, 'transport_accepted_delivery');

    const populatedOrder = await Order.findById(order._id)
      .populate('cropId', 'cropName category images')
      .populate('farmerId', 'name phone location')
      .populate('traderId', 'name phone location')
      .populate('transportDetails.driverId', 'name phone');

    res.json({
      success: true,
      message: 'Delivery accepted successfully',
      data: populatedOrder,
    });
  } catch (error) {
    console.error('Accept transport delivery error:', error);
    res.status(500).json({ message: 'Failed to accept delivery', error: error.message });
  }
});

// Get transporter's current deliveries
app.get('/api/transport/my-deliveries', authenticateToken, async (req, res) => {
  try {
    if (!ensureTransportRole(req, res)) return;

    const { status = 'active' } = req.query;
    const filter = {
      'transportDetails.driverId': req.user._id,
    };

    if (status === 'history') {
      filter.status = { $in: ['delivered', 'completed', 'cancelled'] };
    } else if (status === 'active') {
      filter.status = { $in: ['in_transit', 'ready_for_pickup'] };
    }

    const deliveries = await Order.find(filter)
      .populate('cropId', 'cropName category images')
      .populate('farmerId', 'name phone location')
      .populate('traderId', 'name phone location')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: deliveries,
      total: deliveries.length,
    });
  } catch (error) {
    console.error('Get transport deliveries error:', error);
    res.status(500).json({ message: 'Failed to fetch deliveries', error: error.message });
  }
});

// Get transport delivery history
app.get('/api/transport/history', authenticateToken, async (req, res) => {
  try {
    if (!ensureTransportRole(req, res)) return;

    const history = await Order.find({
      'transportDetails.driverId': req.user._id,
      status: { $in: ['delivered', 'completed', 'cancelled'] },
    })
      .populate('cropId', 'cropName category images')
      .populate('farmerId', 'name phone location')
      .populate('traderId', 'name phone location')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: history,
      total: history.length,
    });
  } catch (error) {
    console.error('Get transport history error:', error);
    res.status(500).json({ message: 'Failed to fetch transport history', error: error.message });
  }
});

// Update delivery status
app.put('/api/transport/status/:deliveryId', authenticateToken, async (req, res) => {
  try {
    if (!ensureTransportRole(req, res)) return;

    const { status, note } = req.body || {};
    const allowedStatuses = ['in_transit', 'delivered', 'completed'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const delivery = await Order.findOne({
      _id: req.params.deliveryId,
      'transportDetails.driverId': req.user._id,
    });

    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    if (delivery.status === 'cancelled' || delivery.status === 'completed') {
      return res.status(400).json({ message: 'Cannot update this delivery anymore' });
    }

    delivery.status = status;

    if (status === 'delivered') {
      delivery.deliveryDetails = {
        ...(delivery.deliveryDetails || {}),
        actualDate: new Date(),
      };
      delivery.transportDetails = {
        ...(delivery.transportDetails || {}),
        deliveryTime: new Date(),
      };
    }

    if (note) {
      delivery.notes = {
        ...(delivery.notes || {}),
        transport: note,
      };
    }

    await delivery.save();

    await emitOrderStatusUpdate(delivery._id, 'transport_status_update');

    res.json({
      success: true,
      message: 'Delivery status updated successfully',
      data: delivery,
    });
  } catch (error) {
    console.error('Update transport delivery status error:', error);
    res.status(500).json({ message: 'Failed to update delivery status', error: error.message });
  }
});

// Get delivery details for transporter
app.get('/api/transport/details/:deliveryId', authenticateToken, async (req, res) => {
  try {
    if (!ensureTransportRole(req, res)) return;

    const delivery = await Order.findOne({
      _id: req.params.deliveryId,
      'transportDetails.driverId': req.user._id,
    })
      .populate('cropId')
      .populate('farmerId', 'name phone location')
      .populate('traderId', 'name phone location')
      .populate('transportDetails.driverId', 'name phone');

    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    res.json({
      success: true,
      data: delivery,
    });
  } catch (error) {
    console.error('Get transport delivery details error:', error);
    res.status(500).json({ message: 'Failed to fetch delivery details', error: error.message });
  }
});

// Update live delivery location (transport only)
app.put('/api/transport/location/:deliveryId', authenticateToken, async (req, res) => {
  try {
    if (!ensureTransportRole(req, res)) return;

    const normalizedLocation = normalizeLocationPayload(req.body || {});
    if (!normalizedLocation) {
      return res.status(400).json({ message: 'Invalid latitude/longitude in request body' });
    }

    const delivery = await Order.findOne({
      _id: req.params.deliveryId,
      'transportDetails.driverId': req.user._id,
    });

    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    delivery.transportDetails = {
      ...(delivery.transportDetails || {}),
      currentLocation: normalizedLocation,
    };

    const history = [
      ...(delivery.transportDetails.locationHistory || []),
      normalizedLocation,
    ];
    delivery.transportDetails.locationHistory = history.slice(-200);
    await delivery.save();

    await emitDeliveryLocationUpdate(delivery._id, normalizedLocation);

    res.json({
      success: true,
      message: 'Delivery location updated',
      data: {
        deliveryId: delivery._id,
        location: normalizedLocation,
      },
    });
  } catch (error) {
    console.error('Update delivery location error:', error);
    res.status(500).json({ message: 'Failed to update delivery location', error: error.message });
  }
});

// Get latest location and recent path for a delivery
app.get('/api/transport/location/:deliveryId', authenticateToken, async (req, res) => {
  try {
    const delivery = await Order.findById(req.params.deliveryId)
      .select('orderNumber status farmerId traderId transportDetails')
      .populate('farmerId', 'name phone')
      .populate('traderId', 'name phone')
      .populate('transportDetails.driverId', 'name phone');

    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    const isTransportOwner =
      req.user.role === 'transport' &&
      delivery.transportDetails?.driverId?._id?.equals(req.user._id);
    const isFarmerOwner = req.user.role === 'farmer' && delivery.farmerId?._id?.equals(req.user._id);
    const isTraderOwner = req.user.role === 'trader' && delivery.traderId?._id?.equals(req.user._id);

    if (!isTransportOwner && !isFarmerOwner && !isTraderOwner) {
      return res.status(403).json({ message: 'Not authorized to view this delivery location' });
    }

    const recentPath = (delivery.transportDetails?.locationHistory || []).slice(-50);

    res.json({
      success: true,
      data: {
        deliveryId: delivery._id,
        orderNumber: delivery.orderNumber,
        status: delivery.status,
        currentLocation: delivery.transportDetails?.currentLocation || null,
        recentPath,
        transporter: delivery.transportDetails?.driverId || null,
      },
    });
  } catch (error) {
    console.error('Get delivery location error:', error);
    res.status(500).json({ message: 'Failed to fetch delivery location', error: error.message });
  }
});

// ============ VEHICLE ROUTES ============

// Get transporter's vehicles
app.get('/api/vehicles/my-vehicles', authenticateToken, async (req, res) => {
  try {
    if (!ensureTransportRole(req, res)) return;

    const vehicles = await Vehicle.find({
      transporterId: req.user._id,
      isActive: true,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: vehicles,
      total: vehicles.length,
    });
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({ message: 'Failed to fetch vehicles', error: error.message });
  }
});

// Add vehicle
app.post('/api/vehicles/add', authenticateToken, async (req, res) => {
  try {
    if (!ensureTransportRole(req, res)) return;

    const { vehicleType, vehicleNumber, capacity, capacityUnit, model, year } = req.body || {};

    if (!vehicleType || !vehicleNumber || !capacity) {
      return res.status(400).json({ message: 'vehicleType, vehicleNumber, and capacity are required' });
    }

    const normalizedVehicleNumber = vehicleNumber.trim().toUpperCase();
    const existingVehicle = await Vehicle.findOne({ vehicleNumber: normalizedVehicleNumber });
    if (existingVehicle) {
      return res.status(400).json({ message: 'Vehicle with this number already exists' });
    }

    const vehicle = await Vehicle.create({
      transporterId: req.user._id,
      vehicleType,
      vehicleNumber: normalizedVehicleNumber,
      capacity: Number(capacity),
      capacityUnit: capacityUnit || 'kg',
      model: model || '',
      year,
    });

    res.status(201).json({
      success: true,
      message: 'Vehicle added successfully',
      data: vehicle,
    });
  } catch (error) {
    console.error('Add vehicle error:', error);
    res.status(500).json({ message: 'Failed to add vehicle', error: error.message });
  }
});

// Update vehicle details
app.put('/api/vehicles/:vehicleId/update', authenticateToken, async (req, res) => {
  try {
    if (!ensureTransportRole(req, res)) return;

    const vehicle = await Vehicle.findOne({
      _id: req.params.vehicleId,
      transporterId: req.user._id,
      isActive: true,
    });

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const { vehicleType, vehicleNumber, capacity, capacityUnit, model, year, availabilityStatus } = req.body || {};

    if (vehicleNumber && vehicleNumber.trim().toUpperCase() !== vehicle.vehicleNumber) {
      const duplicate = await Vehicle.findOne({ vehicleNumber: vehicleNumber.trim().toUpperCase() });
      if (duplicate) {
        return res.status(400).json({ message: 'Vehicle number already in use' });
      }
      vehicle.vehicleNumber = vehicleNumber.trim().toUpperCase();
    }

    if (vehicleType) vehicle.vehicleType = vehicleType;
    if (capacity) vehicle.capacity = Number(capacity);
    if (capacityUnit) vehicle.capacityUnit = capacityUnit;
    if (model !== undefined) vehicle.model = model;
    if (year) vehicle.year = year;
    if (availabilityStatus) vehicle.availabilityStatus = availabilityStatus;

    await vehicle.save();

    res.json({
      success: true,
      message: 'Vehicle updated successfully',
      data: vehicle,
    });
  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({ message: 'Failed to update vehicle', error: error.message });
  }
});

// Soft-delete a vehicle
app.delete('/api/vehicles/:vehicleId/delete', authenticateToken, async (req, res) => {
  try {
    if (!ensureTransportRole(req, res)) return;

    const vehicle = await Vehicle.findOne({
      _id: req.params.vehicleId,
      transporterId: req.user._id,
      isActive: true,
    });

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    vehicle.isActive = false;
    vehicle.availabilityStatus = 'inactive';
    await vehicle.save();

    res.json({
      success: true,
      message: 'Vehicle removed successfully',
    });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({ message: 'Failed to remove vehicle', error: error.message });
  }
});

// Update vehicle availability
app.put('/api/vehicles/:vehicleId/availability', authenticateToken, async (req, res) => {
  try {
    if (!ensureTransportRole(req, res)) return;

    const { availabilityStatus } = req.body || {};
    const allowedStatuses = ['available', 'on_delivery', 'maintenance', 'inactive'];
    if (!allowedStatuses.includes(availabilityStatus)) {
      return res.status(400).json({ message: 'Invalid availability status' });
    }

    const vehicle = await Vehicle.findOne({
      _id: req.params.vehicleId,
      transporterId: req.user._id,
      isActive: true,
    });

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    vehicle.availabilityStatus = availabilityStatus;
    await vehicle.save();

    res.json({
      success: true,
      message: 'Vehicle availability updated successfully',
      data: vehicle,
    });
  } catch (error) {
    console.error('Update vehicle availability error:', error);
    res.status(500).json({ message: 'Failed to update vehicle availability', error: error.message });
  }
});

// Available orders from vehicle module context
app.get('/api/vehicles/orders/available', authenticateToken, async (req, res) => {
  try {
    if (!ensureTransportRole(req, res)) return;

    const orders = await Order.find({
      status: 'ready_for_pickup',
      $or: [
        { 'transportDetails.driverId': { $exists: false } },
        { 'transportDetails.driverId': null },
      ],
    })
      .populate('cropId', 'cropName category images')
      .populate('farmerId', 'name phone location')
      .populate('traderId', 'name phone location')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: orders,
      total: orders.length,
    });
  } catch (error) {
    console.error('Get vehicle available orders error:', error);
    res.status(500).json({ message: 'Failed to fetch available orders', error: error.message });
  }
});

// Suggest suitable vehicles for an order
app.get('/api/vehicles/suggest/:orderId', authenticateToken, async (req, res) => {
  try {
    if (!ensureTransportRole(req, res)) return;

    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const requiredCapacityKg = toKg(order.quantity, order.unit);

    const vehicles = await Vehicle.find({
      transporterId: req.user._id,
      availabilityStatus: 'available',
      isActive: true,
    }).sort({ capacity: 1 });

    const suggestions = vehicles
      .map((vehicle) => {
        const vehicleCapacityKg = toKg(vehicle.capacity, vehicle.capacityUnit);
        return {
          ...vehicle.toObject(),
          canHandleOrder: vehicleCapacityKg >= requiredCapacityKg,
          capacityGapKg: vehicleCapacityKg - requiredCapacityKg,
        };
      })
      .sort((a, b) => b.canHandleOrder - a.canHandleOrder || a.capacityGapKg - b.capacityGapKg);

    res.json({
      success: true,
      data: suggestions,
      requiredCapacityKg,
    });
  } catch (error) {
    console.error('Suggest vehicle error:', error);
    res.status(500).json({ message: 'Failed to suggest vehicles', error: error.message });
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

    httpServer.listen(port, '0.0.0.0', () => {
      console.log(`🚀 FarmConnect Mobile Backend running on http://localhost:${port}`);
      console.log(`📱 Health check: http://localhost:${port}/health`);
      console.log(`📡 Socket.IO ready at ws://localhost:${port}`);
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