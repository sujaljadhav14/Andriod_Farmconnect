const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');

// Import Routes (AFTER express is created but BEFORE they're used)
const authRoutes = require('./routes/authRoutes');
const proposalRoutes = require('./routes/proposalRoutes');
const cropRoutes = require('./routes/cropRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Import Models
const User = require('./models/User');
const Crop = require('./models/Crop');
const Proposal = require('./models/Proposal');
const Order = require('./models/Order');
const Vehicle = require('./models/Vehicle');
const Transaction = require('./models/Transaction');
const Agreement = require('./models/Agreement');
const Dispute = require('./models/Dispute');
const CommunityPost = require('./models/CommunityPost');
const Task = require('./models/Task');

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

// ✅ MIDDLEWARE - MUST BE FIRST
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ✅ THEN MOUNT ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/admin', adminRoutes);

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

    if (user.accountStatus === 'banned') {
      return res.status(403).json({
        message: user.accountStatusReason || 'Your account has been banned by admin',
      });
    }

    if (user.accountStatus === 'suspended') {
      return res.status(403).json({
        message: user.accountStatusReason || 'Your account is temporarily suspended by admin',
      });
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

const normalizeKycStatus = (status = 'pending') => {
  const normalized = String(status || 'pending').toLowerCase();
  if (normalized === 'verified') return 'approved';
  return normalized;
};

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  phone: user.phone,
  role: user.role,
  isVerified: user.isVerified,
  accountStatus: user.accountStatus || 'active',
  accountStatusReason: user.accountStatusReason || '',
  kycStatus: normalizeKycStatus(user.kycStatus),
  bankDetails: user.bankDetails || {},
  location: user.location || {},
  kycDetails: user.kycDetails || {},
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const ensureAdmin = (req, res) => {
  if (req.user.role !== 'admin') {
    res.status(403).json({ message: 'Only admin can access this endpoint' });
    return false;
  }
  return true;
};

const adminRuntimeSettings = {
  maintenanceMode: false,
  allowNewRegistrations: true,
  supportEmail: 'support@farmconnect.local',
  maxUploadSizeMb: 5,
};

const getWeatherMetaFromCode = (weatherCode, isDay = true) => {
  const code = Number(weatherCode || 0);

  if (code === 0) {
    return { condition: 'Clear Sky', icon: isDay ? 'wb-sunny' : 'nightlight-round' };
  }
  if ([1, 2].includes(code)) {
    return { condition: 'Partly Cloudy', icon: 'wb-cloudy' };
  }
  if (code === 3) {
    return { condition: 'Overcast', icon: 'cloud' };
  }
  if ([45, 48].includes(code)) {
    return { condition: 'Fog', icon: 'foggy' };
  }
  if ([51, 53, 55, 56, 57].includes(code)) {
    return { condition: 'Drizzle', icon: 'grain' };
  }
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return { condition: 'Rain', icon: 'water-drop' };
  }
  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return { condition: 'Snow', icon: 'ac-unit' };
  }
  if ([95, 96, 99].includes(code)) {
    return { condition: 'Thunderstorm', icon: 'flash-on' };
  }

  return { condition: 'Weather Update', icon: 'wb-sunny' };
};

const resolveLocationNameFromCoordinates = async ({ latitude, longitude }) => {
  const reverseGeocodeUrl = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&count=1&language=en&format=json`;
  const reverseGeocodeResponse = await fetch(reverseGeocodeUrl);

  if (!reverseGeocodeResponse.ok) {
    return '';
  }

  const reverseGeocodeData = await reverseGeocodeResponse.json();
  const topLocation = reverseGeocodeData?.results?.[0];

  if (!topLocation) {
    return '';
  }

  return [topLocation.name, topLocation.admin1, topLocation.country].filter(Boolean).join(', ');
};

const fetchWeatherPayload = async ({ latitude, longitude, city = '', state = '' }) => {
  let resolvedLatitude = Number(latitude);
  let resolvedLongitude = Number(longitude);
  let resolvedLocationName = city || 'Current Location';

  if (!Number.isFinite(resolvedLatitude) || !Number.isFinite(resolvedLongitude)) {
    const searchQuery = [city, state, 'India'].filter(Boolean).join(', ').trim();
    const geocodeQuery = searchQuery || 'Pune, Maharashtra, India';

    const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(geocodeQuery)}&count=1&language=en&format=json`;
    const geocodeResponse = await fetch(geocodeUrl);

    if (!geocodeResponse.ok) {
      throw new Error('Failed to resolve weather location');
    }

    const geocodeData = await geocodeResponse.json();
    const topLocation = geocodeData?.results?.[0];
    if (!topLocation) {
      throw new Error('No weather location found for the provided query');
    }

    resolvedLatitude = Number(topLocation.latitude);
    resolvedLongitude = Number(topLocation.longitude);
    resolvedLocationName = [topLocation.name, topLocation.admin1, topLocation.country].filter(Boolean).join(', ');
  } else if (!city) {
    const reverseLocationName = await resolveLocationNameFromCoordinates({
      latitude: resolvedLatitude,
      longitude: resolvedLongitude,
    });

    if (reverseLocationName) {
      resolvedLocationName = reverseLocationName;
    }
  }

  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${resolvedLatitude}&longitude=${resolvedLongitude}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,uv_index,visibility,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=5`;
  const weatherResponse = await fetch(weatherUrl);

  if (!weatherResponse.ok) {
    throw new Error('Failed to fetch weather data');
  }

  const weatherData = await weatherResponse.json();
  const current = weatherData?.current || {};
  const daily = weatherData?.daily || {};

  const currentMeta = getWeatherMetaFromCode(current.weather_code, Number(current.is_day || 1) === 1);

  const forecast = (daily.time || []).slice(0, 5).map((date, index) => {
    const dailyCode = Number((daily.weather_code || [])[index] || 0);
    const dailyMeta = getWeatherMetaFromCode(dailyCode, true);

    const dateObject = new Date(`${date}T12:00:00`);
    const dayLabel = index === 0
      ? 'Today'
      : index === 1
        ? 'Tomorrow'
        : dateObject.toLocaleDateString('en-US', { weekday: 'short' });

    return {
      day: dayLabel,
      date,
      tempMaxC: roundAmount((daily.temperature_2m_max || [])[index]),
      tempMinC: roundAmount((daily.temperature_2m_min || [])[index]),
      precipitationChance: Number((daily.precipitation_probability_max || [])[index] || 0),
      weatherCode: dailyCode,
      condition: dailyMeta.condition,
      icon: dailyMeta.icon,
    };
  });

  return {
    location: {
      name: resolvedLocationName,
      latitude: resolvedLatitude,
      longitude: resolvedLongitude,
      timezone: weatherData?.timezone || 'auto',
    },
    current: {
      temperatureC: roundAmount(current.temperature_2m),
      humidity: Number(current.relative_humidity_2m || 0),
      precipitationMm: roundAmount(current.precipitation),
      windSpeedKmh: roundAmount(current.wind_speed_10m),
      uvIndex: roundAmount(current.uv_index),
      visibilityKm: roundAmount(Number(current.visibility || 0) / 1000),
      weatherCode: Number(current.weather_code || 0),
      condition: currentMeta.condition,
      icon: currentMeta.icon,
      isDay: Number(current.is_day || 1) === 1,
      timestamp: current.time || new Date().toISOString(),
    },
    forecast,
  };
};

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

// ============ WEATHER ROUTES ============

app.get('/api/weather/get-weather', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude, city = '', state = '' } = req.query;
    const hasCoordinateParams = latitude !== undefined && latitude !== null
      && longitude !== undefined && longitude !== null;

    const fallbackLatitude = req.user?.location?.coordinates?.latitude;
    const fallbackLongitude = req.user?.location?.coordinates?.longitude;

    const weatherPayload = await fetchWeatherPayload({
      latitude: latitude ?? fallbackLatitude,
      longitude: longitude ?? fallbackLongitude,
      city: city || (hasCoordinateParams ? '' : req.user?.location?.city || 'Pune'),
      state: state || (hasCoordinateParams ? '' : req.user?.location?.state || 'Maharashtra'),
    });

    res.json({
      success: true,
      data: weatherPayload,
    });
  } catch (error) {
    console.error('Get weather error:', error);
    res.status(500).json({ message: 'Failed to fetch weather data', error: error.message });
  }
});

app.get('/api/weather/my-locations', authenticateToken, async (req, res) => {
  try {
    const latitude = req.user?.location?.coordinates?.latitude;
    const longitude = req.user?.location?.coordinates?.longitude;

    const primaryLabel = [
      req.user?.location?.city,
      req.user?.location?.state,
    ].filter(Boolean).join(', ') || 'Current Location';

    res.json({
      success: true,
      data: [
        {
          id: 'primary',
          label: primaryLabel,
          latitude: Number.isFinite(Number(latitude)) ? Number(latitude) : null,
          longitude: Number.isFinite(Number(longitude)) ? Number(longitude) : null,
          isFavorite: true,
        },
      ],
    });
  } catch (error) {
    console.error('Get weather locations error:', error);
    res.status(500).json({ message: 'Failed to fetch weather locations', error: error.message });
  }
});

app.get('/api/weather/location/:weatherId', authenticateToken, async (req, res) => {
  try {
    if (req.params.weatherId !== 'primary') {
      return res.status(404).json({ message: 'Weather location not found' });
    }

    const latitude = req.user?.location?.coordinates?.latitude;
    const longitude = req.user?.location?.coordinates?.longitude;

    const weatherPayload = await fetchWeatherPayload({
      latitude,
      longitude,
      city: req.user?.location?.city || 'Pune',
      state: req.user?.location?.state || 'Maharashtra',
    });

    res.json({
      success: true,
      data: weatherPayload,
    });
  } catch (error) {
    console.error('Get weather location details error:', error);
    res.status(500).json({ message: 'Failed to fetch weather location details', error: error.message });
  }
});

app.put('/api/weather/favorite/:weatherId', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      message: `Weather location ${req.params.weatherId} marked as favorite`,
    });
  } catch (error) {
    console.error('Set weather favorite error:', error);
    res.status(500).json({ message: 'Failed to update weather favorite', error: error.message });
  }
});

// ============ AUTHENTICATION ROUTES ============

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, phone, password, role } = req.body;

    if (!adminRuntimeSettings.allowNewRegistrations) {
      return res.status(503).json({
        message: 'New registrations are temporarily disabled by admin',
      });
    }

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
      user: serializeUser(user),
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

    if (user.accountStatus === 'banned') {
      return res.status(403).json({
        message: user.accountStatusReason || 'Your account has been banned by admin',
      });
    }

    if (user.accountStatus === 'suspended') {
      return res.status(403).json({
        message: user.accountStatusReason || 'Your account is temporarily suspended by admin',
      });
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
      user: serializeUser(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -otp');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      user: serializeUser(user),
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
  }
});

app.put('/api/auth/update-bank-details', authenticateToken, async (req, res) => {
  try {
    if (!['farmer', 'trader'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only farmers and traders can update bank details' });
    }

    const {
      accountNumber,
      ifscCode,
      accountHolderName,
    } = req.body || {};

    if (!accountNumber || !ifscCode || !accountHolderName) {
      return res.status(400).json({
        message: 'accountNumber, ifscCode, and accountHolderName are required',
      });
    }

    const normalizedAccountNumber = String(accountNumber).replace(/\s+/g, '');
    const normalizedIfsc = String(ifscCode).trim().toUpperCase();
    const normalizedHolderName = String(accountHolderName).trim();

    if (normalizedAccountNumber.length < 8 || normalizedAccountNumber.length > 24) {
      return res.status(400).json({ message: 'Please enter a valid bank account number' });
    }

    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(normalizedIfsc)) {
      return res.status(400).json({ message: 'Please enter a valid IFSC code' });
    }

    req.user.bankDetails = {
      accountNumber: normalizedAccountNumber,
      ifscCode: normalizedIfsc,
      accountHolderName: normalizedHolderName,
    };

    await req.user.save();

    res.json({
      success: true,
      message: 'Bank details updated successfully',
      user: serializeUser(req.user),
    });
  } catch (error) {
    console.error('Update bank details error:', error);
    res.status(500).json({ message: 'Failed to update bank details', error: error.message });
  }
});

app.post('/api/auth/submit-kyc', authenticateToken, upload.single('idProofImage'), async (req, res) => {
  try {
    if (!['farmer', 'trader'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only farmers and traders can submit KYC' });
    }

    const {
      fullName,
      documentType,
      documentNumber,
      address = '',
      businessName = '',
      businessAddress = '',
      gstNumber = '',
      notes = '',
    } = req.body || {};

    if (!fullName || !documentType || !documentNumber) {
      return res.status(400).json({
        message: 'fullName, documentType, and documentNumber are required',
      });
    }

    const allowedDocumentTypes = ['aadhaar', 'pan', 'passport', 'voter_id', 'driving_license', 'other'];
    const normalizedDocumentType = String(documentType).toLowerCase().trim();
    if (!allowedDocumentTypes.includes(normalizedDocumentType)) {
      return res.status(400).json({ message: 'Invalid document type' });
    }

    const previousKycDetails = req.user.kycDetails || {};
    const uploadedIdProofImage = req.file ? `/uploads/${req.file.filename}` : previousKycDetails.idProofImage || '';

    req.user.kycDetails = {
      ...previousKycDetails,
      fullName: String(fullName).trim(),
      documentType: normalizedDocumentType,
      documentNumber: String(documentNumber).trim(),
      address: String(address || '').trim(),
      businessName: String(businessName || '').trim(),
      businessAddress: String(businessAddress || '').trim(),
      gstNumber: String(gstNumber || '').trim().toUpperCase(),
      notes: String(notes || '').trim(),
      idProofImage: uploadedIdProofImage,
      submittedAt: new Date(),
      reviewedAt: undefined,
      reviewedBy: undefined,
      rejectionReason: '',
    };

    req.user.kycStatus = 'submitted';
    await req.user.save();

    res.json({
      success: true,
      message: 'KYC submitted successfully',
      data: {
        kycStatus: normalizeKycStatus(req.user.kycStatus),
        kycDetails: req.user.kycDetails,
      },
      user: serializeUser(req.user),
    });
  } catch (error) {
    console.error('Submit KYC error:', error);
    res.status(500).json({ message: 'Failed to submit KYC', error: error.message });
  }
});

app.get('/api/auth/my-kyc', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -otp');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        kycStatus: normalizeKycStatus(user.kycStatus),
        kycDetails: user.kycDetails || {},
      },
    });
  } catch (error) {
    console.error('Get my KYC error:', error);
    res.status(500).json({ message: 'Failed to fetch KYC status', error: error.message });
  }
});

app.get('/api/auth/get-all-kyc', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can access KYC records' });
    }

    const users = await User.find({
      $or: [
        { kycStatus: { $in: ['submitted', 'approved', 'verified', 'rejected'] } },
        { 'kycDetails.submittedAt': { $exists: true } },
      ],
    })
      .select('-password -otp')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: users.map((candidate) => ({
        _id: candidate._id,
        id: candidate._id,
        name: candidate.name,
        phone: candidate.phone,
        role: candidate.role,
        kycStatus: normalizeKycStatus(candidate.kycStatus),
        kycDetails: candidate.kycDetails || {},
        createdAt: candidate.createdAt,
        updatedAt: candidate.updatedAt,
      })),
      total: users.length,
    });
  } catch (error) {
    console.error('Get all KYC error:', error);
    res.status(500).json({ message: 'Failed to fetch KYC records', error: error.message });
  }
});

app.put('/api/auth/kyc-approve/:kycId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can approve KYC' });
    }

    const candidate = await User.findById(req.params.kycId).select('-password -otp');
    if (!candidate) {
      return res.status(404).json({ message: 'KYC record not found' });
    }

    candidate.kycStatus = 'approved';
    candidate.kycDetails = {
      ...(candidate.kycDetails || {}),
      reviewedAt: new Date(),
      reviewedBy: req.user._id,
      rejectionReason: '',
    };
    await candidate.save();

    res.json({
      success: true,
      message: 'KYC approved successfully',
      data: {
        id: candidate._id,
        kycStatus: normalizeKycStatus(candidate.kycStatus),
        kycDetails: candidate.kycDetails || {},
      },
    });
  } catch (error) {
    console.error('Approve KYC error:', error);
    res.status(500).json({ message: 'Failed to approve KYC', error: error.message });
  }
});

app.put('/api/auth/kyc-reject/:kycId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can reject KYC' });
    }

    const { reason = 'KYC details did not pass verification checks' } = req.body || {};

    const candidate = await User.findById(req.params.kycId).select('-password -otp');
    if (!candidate) {
      return res.status(404).json({ message: 'KYC record not found' });
    }

    candidate.kycStatus = 'rejected';
    candidate.kycDetails = {
      ...(candidate.kycDetails || {}),
      reviewedAt: new Date(),
      reviewedBy: req.user._id,
      rejectionReason: String(reason).trim(),
    };
    await candidate.save();

    res.json({
      success: true,
      message: 'KYC rejected successfully',
      data: {
        id: candidate._id,
        kycStatus: normalizeKycStatus(candidate.kycStatus),
        kycDetails: candidate.kycDetails || {},
      },
    });
  } catch (error) {
    console.error('Reject KYC error:', error);
    res.status(500).json({ message: 'Failed to reject KYC', error: error.message });
  }
});

// ============ COMMUNITY ROUTES ============

const serializeCommunityPost = (post, viewerId) => {
  const likedByMe = (post.likes || []).some((userId) => idsEqual(userId, viewerId));

  return {
    id: post._id,
    content: post.content,
    cropCategory: post.cropCategory,
    tags: post.tags || [],
    author: post.authorId ? {
      id: post.authorId._id,
      name: post.authorId.name,
      role: post.authorId.role,
      phone: post.authorId.phone,
    } : null,
    likeCount: (post.likes || []).length,
    commentCount: (post.comments || []).length,
    likedByMe,
    comments: (post.comments || []).map((comment) => ({
      id: comment._id,
      content: comment.content,
      createdAt: comment.createdAt,
      user: comment.userId ? {
        id: comment.userId._id,
        name: comment.userId.name,
        role: comment.userId.role,
      } : null,
    })),
    isPinned: post.isPinned,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
};

app.get('/api/community/posts', authenticateToken, async (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;

    const query = {
      isActive: true,
    };

    if (category && category !== 'all' && category !== 'General') {
      query.cropCategory = category;
    }

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNumber - 1) * pageSize;

    const [posts, total] = await Promise.all([
      CommunityPost.find(query)
        .populate('authorId', 'name role phone')
        .populate('comments.userId', 'name role')
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      CommunityPost.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: posts.map((post) => serializeCommunityPost(post, req.user._id)),
      pagination: {
        total,
        page: pageNumber,
        pages: Math.ceil(total / pageSize),
        limit: pageSize,
      },
    });
  } catch (error) {
    console.error('Get community posts error:', error);
    res.status(500).json({ message: 'Failed to fetch community posts', error: error.message });
  }
});

app.post('/api/community/posts', authenticateToken, async (req, res) => {
  try {
    const {
      content,
      cropCategory = 'General',
      tags = [],
    } = req.body || {};

    if (!content || String(content).trim().length < 3) {
      return res.status(400).json({ message: 'Post content must be at least 3 characters' });
    }

    const normalizedTags = Array.isArray(tags)
      ? tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 5)
      : String(tags || '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 5);

    const post = await CommunityPost.create({
      authorId: req.user._id,
      content: String(content).trim(),
      cropCategory,
      tags: normalizedTags,
    });

    const populatedPost = await CommunityPost.findById(post._id)
      .populate('authorId', 'name role phone')
      .populate('comments.userId', 'name role');

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: serializeCommunityPost(populatedPost, req.user._id),
    });
  } catch (error) {
    console.error('Create community post error:', error);
    res.status(500).json({ message: 'Failed to create post', error: error.message });
  }
});

app.post('/api/community/posts/:postId/like', authenticateToken, async (req, res) => {
  try {
    const post = await CommunityPost.findOne({
      _id: req.params.postId,
      isActive: true,
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const currentUserId = req.user._id;
    const alreadyLiked = (post.likes || []).some((userId) => idsEqual(userId, currentUserId));

    if (alreadyLiked) {
      post.likes = (post.likes || []).filter((userId) => !idsEqual(userId, currentUserId));
    } else {
      post.likes = [...(post.likes || []), currentUserId];
    }

    await post.save();

    res.json({
      success: true,
      message: alreadyLiked ? 'Post unliked successfully' : 'Post liked successfully',
      data: {
        id: post._id,
        likedByMe: !alreadyLiked,
        likeCount: (post.likes || []).length,
      },
    });
  } catch (error) {
    console.error('Like community post error:', error);
    res.status(500).json({ message: 'Failed to like post', error: error.message });
  }
});

app.post('/api/community/posts/:postId/comment', authenticateToken, async (req, res) => {
  try {
    const { comment, content } = req.body || {};
    const commentText = String(comment || content || '').trim();

    if (!commentText) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const post = await CommunityPost.findOne({
      _id: req.params.postId,
      isActive: true,
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.comments.push({
      userId: req.user._id,
      content: commentText,
      createdAt: new Date(),
    });
    await post.save();

    const populatedPost = await CommunityPost.findById(post._id)
      .populate('authorId', 'name role phone')
      .populate('comments.userId', 'name role');

    res.json({
      success: true,
      message: 'Comment added successfully',
      data: serializeCommunityPost(populatedPost, req.user._id),
    });
  } catch (error) {
    console.error('Comment community post error:', error);
    res.status(500).json({ message: 'Failed to comment on post', error: error.message });
  }
});

// ============ FARM TASK ROUTES ============

app.post('/api/tasks/create', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'farmer') {
      return res.status(403).json({ message: 'Only farmers can create tasks' });
    }

    const {
      title,
      description = '',
      category = 'Other',
      priority = 'medium',
      dueDate,
      notes = '',
      reminderAt,
    } = req.body || {};

    if (!title || !dueDate) {
      return res.status(400).json({ message: 'title and dueDate are required' });
    }

    const parsedDueDate = new Date(dueDate);
    if (Number.isNaN(parsedDueDate.getTime())) {
      return res.status(400).json({ message: 'Invalid dueDate value' });
    }

    const task = await Task.create({
      farmerId: req.user._id,
      title: String(title).trim(),
      description: String(description).trim(),
      category,
      priority,
      dueDate: parsedDueDate,
      notes: String(notes).trim(),
      reminderAt: reminderAt ? new Date(reminderAt) : undefined,
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task,
    });
  } catch (error) {
    console.error('Create farm task error:', error);
    res.status(500).json({ message: 'Failed to create task', error: error.message });
  }
});

app.get('/api/tasks/my-tasks', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'farmer') {
      return res.status(403).json({ message: 'Only farmers can access tasks' });
    }

    const {
      status,
      category,
      fromDate,
      toDate,
    } = req.query;

    const query = {
      farmerId: req.user._id,
    };

    if (status) {
      query.status = status;
    }
    if (category && category !== 'all') {
      query.category = category;
    }
    if (fromDate || toDate) {
      query.dueDate = {};
      if (fromDate) query.dueDate.$gte = new Date(fromDate);
      if (toDate) query.dueDate.$lte = new Date(toDate);
    }

    const tasks = await Task.find(query)
      .sort({ dueDate: 1, createdAt: -1 });

    res.json({
      success: true,
      data: tasks,
      total: tasks.length,
    });
  } catch (error) {
    console.error('Get farm tasks error:', error);
    res.status(500).json({ message: 'Failed to fetch tasks', error: error.message });
  }
});

app.put('/api/tasks/update/:taskId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'farmer') {
      return res.status(403).json({ message: 'Only farmers can update tasks' });
    }

    const task = await Task.findOne({
      _id: req.params.taskId,
      farmerId: req.user._id,
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const {
      title,
      description,
      category,
      priority,
      dueDate,
      status,
      notes,
      reminderAt,
    } = req.body || {};

    if (title !== undefined) task.title = String(title).trim();
    if (description !== undefined) task.description = String(description).trim();
    if (category) task.category = category;
    if (priority) task.priority = priority;
    if (notes !== undefined) task.notes = String(notes).trim();
    if (dueDate) {
      const parsedDueDate = new Date(dueDate);
      if (Number.isNaN(parsedDueDate.getTime())) {
        return res.status(400).json({ message: 'Invalid dueDate value' });
      }
      task.dueDate = parsedDueDate;
    }
    if (reminderAt !== undefined) {
      task.reminderAt = reminderAt ? new Date(reminderAt) : undefined;
    }
    if (status) {
      task.status = status;
      task.completedAt = status === 'completed' ? new Date() : undefined;
    }

    await task.save();

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: task,
    });
  } catch (error) {
    console.error('Update farm task error:', error);
    res.status(500).json({ message: 'Failed to update task', error: error.message });
  }
});

app.delete('/api/tasks/delete/:taskId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'farmer') {
      return res.status(403).json({ message: 'Only farmers can delete tasks' });
    }

    const task = await Task.findOneAndDelete({
      _id: req.params.taskId,
      farmerId: req.user._id,
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Delete farm task error:', error);
    res.status(500).json({ message: 'Failed to delete task', error: error.message });
  }
});

// ============ ANALYTICS ROUTES ============

app.get('/api/analytics/price-trend', authenticateToken, async (req, res) => {
  try {
    if (!['trader', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only traders and admin can access analytics' });
    }

    const requestedDays = Number(req.query.days || 14);
    const days = Math.min(90, Math.max(7, requestedDays || 14));
    const windowStart = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const listings = await Crop.find({
      createdAt: { $gte: windowStart },
      status: { $in: ['available', 'reserved', 'sold'] },
    }).select('price category cropName createdAt');

    const groupedByDay = new Map();
    const groupedByCategory = new Map();

    listings.forEach((listing) => {
      const dayKey = listing.createdAt.toISOString().slice(0, 10);
      const price = Number(listing.price || 0);
      const category = listing.category || 'Other';

      if (!groupedByDay.has(dayKey)) {
        groupedByDay.set(dayKey, {
          day: dayKey,
          sum: 0,
          count: 0,
          minPrice: price,
          maxPrice: price,
        });
      }

      const dayEntry = groupedByDay.get(dayKey);
      dayEntry.sum += price;
      dayEntry.count += 1;
      dayEntry.minPrice = Math.min(dayEntry.minPrice, price);
      dayEntry.maxPrice = Math.max(dayEntry.maxPrice, price);

      if (!groupedByCategory.has(category)) {
        groupedByCategory.set(category, {
          category,
          sum: 0,
          count: 0,
        });
      }

      const categoryEntry = groupedByCategory.get(category);
      categoryEntry.sum += price;
      categoryEntry.count += 1;
    });

    const points = Array.from(groupedByDay.values())
      .map((entry) => ({
        day: entry.day,
        averagePrice: roundAmount(entry.sum / Math.max(entry.count, 1)),
        minPrice: roundAmount(entry.minPrice),
        maxPrice: roundAmount(entry.maxPrice),
        listings: entry.count,
      }))
      .sort((a, b) => a.day.localeCompare(b.day));

    const categoryAverages = Array.from(groupedByCategory.values())
      .map((entry) => ({
        category: entry.category,
        averagePrice: roundAmount(entry.sum / Math.max(entry.count, 1)),
        listings: entry.count,
      }))
      .sort((a, b) => b.averagePrice - a.averagePrice);

    res.json({
      success: true,
      data: {
        days,
        points,
        categoryAverages,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Get price trend analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch price trend analytics', error: error.message });
  }
});

app.get('/api/analytics/top-crops', authenticateToken, async (req, res) => {
  try {
    if (!['trader', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only traders and admin can access analytics' });
    }

    const orderScopeMatch = {};
    if (req.user.role === 'trader') {
      orderScopeMatch.traderId = req.user._id;
    }

    const [summaryRows, topCropsRows, topFarmersRows] = await Promise.all([
      Order.aggregate([
        { $match: orderScopeMatch },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalSpend: { $sum: '$totalAmount' },
            completedOrders: {
              $sum: {
                $cond: [{ $in: ['$status', ['delivered', 'completed']] }, 1, 0],
              },
            },
            activeOrders: {
              $sum: {
                $cond: [{ $in: ['$status', ['confirmed', 'payment_pending', 'payment_received', 'ready_for_pickup', 'in_transit']] }, 1, 0],
              },
            },
          },
        },
      ]),
      Order.aggregate([
        { $match: orderScopeMatch },
        {
          $group: {
            _id: '$cropId',
            ordersCount: { $sum: 1 },
            totalQuantity: { $sum: '$quantity' },
            totalRevenue: { $sum: '$totalAmount' },
            averagePrice: { $avg: '$pricePerUnit' },
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 8 },
        {
          $lookup: {
            from: 'crops',
            localField: '_id',
            foreignField: '_id',
            as: 'crop',
          },
        },
        {
          $unwind: {
            path: '$crop',
            preserveNullAndEmptyArrays: true,
          },
        },
      ]),
      Order.aggregate([
        { $match: orderScopeMatch },
        {
          $group: {
            _id: '$farmerId',
            ordersCount: { $sum: 1 },
            totalRevenue: { $sum: '$totalAmount' },
            lastTradeAt: { $max: '$updatedAt' },
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'farmer',
          },
        },
        {
          $unwind: {
            path: '$farmer',
            preserveNullAndEmptyArrays: true,
          },
        },
      ]),
    ]);

    const summary = summaryRows[0] || {
      totalOrders: 0,
      totalSpend: 0,
      completedOrders: 0,
      activeOrders: 0,
    };

    res.json({
      success: true,
      data: {
        summary: {
          totalOrders: Number(summary.totalOrders || 0),
          completedOrders: Number(summary.completedOrders || 0),
          activeOrders: Number(summary.activeOrders || 0),
          totalSpend: roundAmount(summary.totalSpend || 0),
          averageOrderValue: summary.totalOrders
            ? roundAmount((summary.totalSpend || 0) / summary.totalOrders)
            : 0,
        },
        topCrops: topCropsRows.map((entry) => ({
          cropId: entry._id,
          cropName: entry.crop?.cropName || 'Unknown Crop',
          category: entry.crop?.category || 'Other',
          unit: entry.crop?.unit || 'kg',
          ordersCount: Number(entry.ordersCount || 0),
          totalQuantity: roundAmount(entry.totalQuantity || 0),
          totalRevenue: roundAmount(entry.totalRevenue || 0),
          averagePrice: roundAmount(entry.averagePrice || 0),
        })),
        topFarmers: topFarmersRows.map((entry) => ({
          farmerId: entry._id,
          name: entry.farmer?.name || 'Unknown Farmer',
          phone: entry.farmer?.phone || '',
          city: entry.farmer?.location?.city || '',
          state: entry.farmer?.location?.state || '',
          kycStatus: normalizeKycStatus(entry.farmer?.kycStatus || 'pending'),
          ordersCount: Number(entry.ordersCount || 0),
          totalRevenue: roundAmount(entry.totalRevenue || 0),
          lastTradeAt: entry.lastTradeAt || null,
        })),
      },
    });
  } catch (error) {
    console.error('Get top crop analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch top crop analytics', error: error.message });
  }
});

app.get('/api/analytics/farmer-network', authenticateToken, async (req, res) => {
  try {
    if (!['trader', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only traders and admin can access farmer network analytics' });
    }

    const ordersQuery = {};
    const proposalsQuery = {};
    if (req.user.role === 'trader') {
      ordersQuery.traderId = req.user._id;
      proposalsQuery.traderId = req.user._id;
    }

    const [orders, proposals] = await Promise.all([
      Order.find(ordersQuery)
        .populate('farmerId', 'name phone location kycStatus')
        .select('farmerId status totalAmount updatedAt createdAt'),
      Proposal.find(proposalsQuery)
        .populate('farmerId', 'name phone location kycStatus')
        .select('farmerId status updatedAt createdAt'),
    ]);

    const network = new Map();

    const ensureEntry = (farmer) => {
      const farmerId = toIdString(farmer?._id || farmer);
      if (!farmerId) return null;

      if (!network.has(farmerId)) {
        network.set(farmerId, {
          farmerId,
          name: farmer?.name || 'Unknown Farmer',
          phone: farmer?.phone || '',
          city: farmer?.location?.city || '',
          state: farmer?.location?.state || '',
          kycStatus: normalizeKycStatus(farmer?.kycStatus || 'pending'),
          proposalCount: 0,
          acceptedProposals: 0,
          rejectedProposals: 0,
          orderCount: 0,
          completedOrders: 0,
          totalRevenue: 0,
          lastInteractionAt: null,
        });
      }

      return network.get(farmerId);
    };

    proposals.forEach((proposal) => {
      const entry = ensureEntry(proposal.farmerId);
      if (!entry) return;

      entry.proposalCount += 1;
      if (proposal.status === 'accepted') entry.acceptedProposals += 1;
      if (proposal.status === 'rejected') entry.rejectedProposals += 1;

      const interactionDate = proposal.updatedAt || proposal.createdAt;
      if (interactionDate && (!entry.lastInteractionAt || interactionDate > entry.lastInteractionAt)) {
        entry.lastInteractionAt = interactionDate;
      }
    });

    orders.forEach((order) => {
      const entry = ensureEntry(order.farmerId);
      if (!entry) return;

      entry.orderCount += 1;
      entry.totalRevenue += Number(order.totalAmount || 0);
      if (['delivered', 'completed'].includes(order.status)) {
        entry.completedOrders += 1;
      }

      const interactionDate = order.updatedAt || order.createdAt;
      if (interactionDate && (!entry.lastInteractionAt || interactionDate > entry.lastInteractionAt)) {
        entry.lastInteractionAt = interactionDate;
      }
    });

    const networkRows = Array.from(network.values())
      .map((entry) => {
        const totalInteractions = entry.proposalCount + entry.orderCount;
        const relationshipStrength = entry.completedOrders >= 3
          ? 'strong'
          : entry.completedOrders >= 1 || entry.acceptedProposals >= 1
            ? 'growing'
            : 'new';

        return {
          ...entry,
          totalRevenue: roundAmount(entry.totalRevenue),
          totalInteractions,
          relationshipStrength,
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue || b.totalInteractions - a.totalInteractions);

    res.json({
      success: true,
      data: networkRows,
      total: networkRows.length,
    });
  } catch (error) {
    console.error('Get farmer network analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch farmer network analytics', error: error.message });
  }
});

// ============ CROP ROUTES ============

/// ============ CROP ROUTES ============

// ✅ 1. AVAILABLE CROPS (FIRST)
// ============ CROP ROUTES ============

// ✅ 1. AVAILABLE CROPS (FIXED)
app.get('/api/crops/available', async (req, res) => {
  try {
    const crops = await Crop.find({ status: 'available' })
      .populate('farmerId', 'name phone location')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: crops,
    });
  } catch (error) {
    console.error('Get crops error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// ✅ 2. MY CROPS
app.get('/api/crops/my-crops', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'farmer') {
      return res.status(403).json({ message: 'Only farmers allowed' });
    }

    const crops = await Crop.find({ farmerId: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: crops,
    });
  } catch (error) {
    console.error('Get farmer crops error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// ❗ 3. SINGLE CROP (KEEP LAST)
app.get('/api/crops/:id', async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id)
      .populate('farmerId', 'name phone location');

    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    res.json({
      success: true,
      data: crop,
    });
  } catch (error) {
    console.error('Get crop error:', error);
    res.status(500).json({ message: 'Server error' });
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

    // Create order with orderNumber
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Handle delivery location - provide defaults if not available
    const deliveryLocation = proposal.deliveryLocation || {};
    const contactInfo = proposal.traderId || {};

    const order = new Order({
      orderNumber,
      proposalId: proposal._id,
      farmerId: proposal.farmerId,
      traderId: proposal.traderId._id || proposal.traderId,
      cropId: proposal.cropId._id,
      quantity: proposal.quantity,
      unit: proposal.cropId.unit || 'kg',
      pricePerUnit: proposal.priceOffered,
      totalAmount: proposal.totalAmount,
      paymentStatus: proposal.advanceAmount > 0 ? 'partial' : 'pending',
      deliveryDetails: {
        address: deliveryLocation.address || 'To be confirmed',
        city: deliveryLocation.city || '',
        state: deliveryLocation.state || '',
        pincode: deliveryLocation.pincode || '',
        scheduledDate: proposal.proposedDeliveryDate,
        contactPerson: contactInfo.name || 'Buyer',
        contactPhone: contactInfo.phone || '',
      },
      farmingDetails: {
        harvestDate: proposal.cropId.harvestDate,
        qualityGrade: proposal.cropId.qualityGrade || 'N/A',
        pesticidesUsed: proposal.cropId.pesticidesUsed || false,
        organic: proposal.cropId.organic || false,
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

// ============ DISPUTE ROUTES ============

const isDisputeAccessibleByUser = (dispute, user) => {
  if (user.role === 'admin') return true;
  return idsEqual(dispute.raisedBy, user._id) || idsEqual(dispute.againstUser, user._id);
};

app.post('/api/disputes', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      category = 'other',
      priority = 'medium',
      orderId,
      proposalId,
      againstUserId,
      evidence = [],
    } = req.body || {};

    if (!title || !description) {
      return res.status(400).json({ message: 'title and description are required' });
    }

    if (orderId) {
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      const canAccessOrder =
        req.user.role === 'admin' ||
        idsEqual(order.farmerId, req.user._id) ||
        idsEqual(order.traderId, req.user._id) ||
        idsEqual(order.transportDetails?.driverId, req.user._id);

      if (!canAccessOrder) {
        return res.status(403).json({ message: 'Not authorized to raise dispute for this order' });
      }
    }

    if (proposalId) {
      const proposal = await Proposal.findById(proposalId);
      if (!proposal) {
        return res.status(404).json({ message: 'Proposal not found' });
      }

      const canAccessProposal =
        req.user.role === 'admin' ||
        idsEqual(proposal.farmerId, req.user._id) ||
        idsEqual(proposal.traderId, req.user._id);

      if (!canAccessProposal) {
        return res.status(403).json({ message: 'Not authorized to raise dispute for this proposal' });
      }
    }

    if (againstUserId) {
      const againstUser = await User.findById(againstUserId).select('_id');
      if (!againstUser) {
        return res.status(404).json({ message: 'Against user not found' });
      }
    }

    const normalizedEvidence = Array.isArray(evidence)
      ? evidence
        .map((item) => ({
          fileUrl: String(item?.fileUrl || '').trim(),
          note: String(item?.note || '').trim(),
          uploadedBy: req.user._id,
          uploadedAt: new Date(),
        }))
        .filter((item) => item.fileUrl || item.note)
      : [];

    const dispute = await Dispute.create({
      title: String(title).trim(),
      description: String(description).trim(),
      category,
      priority,
      raisedBy: req.user._id,
      againstUser: againstUserId || undefined,
      orderId: orderId || undefined,
      proposalId: proposalId || undefined,
      evidence: normalizedEvidence,
      lastUpdatedBy: req.user._id,
    });

    const populatedDispute = await Dispute.findById(dispute._id)
      .populate('raisedBy', 'name phone role')
      .populate('againstUser', 'name phone role')
      .populate('orderId', 'orderNumber status totalAmount')
      .populate('proposalId', 'status totalAmount');

    res.status(201).json({
      success: true,
      message: 'Dispute created successfully',
      data: populatedDispute,
    });
  } catch (error) {
    console.error('Create dispute error:', error);
    res.status(500).json({ message: 'Failed to create dispute', error: error.message });
  }
});

app.get('/api/disputes/my', authenticateToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (req.user.role !== 'admin') {
      query.$or = [
        { raisedBy: req.user._id },
        { againstUser: req.user._id },
      ];
    }

    if (status) {
      query.status = status;
    }

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNumber - 1) * pageSize;

    const [disputes, total] = await Promise.all([
      Dispute.find(query)
        .populate('raisedBy', 'name phone role')
        .populate('againstUser', 'name phone role')
        .populate('orderId', 'orderNumber status totalAmount')
        .populate('proposalId', 'status totalAmount')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      Dispute.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: disputes,
      pagination: {
        total,
        page: pageNumber,
        pages: Math.ceil(total / pageSize),
        limit: pageSize,
      },
    });
  } catch (error) {
    console.error('Get my disputes error:', error);
    res.status(500).json({ message: 'Failed to fetch disputes', error: error.message });
  }
});

app.post('/api/disputes/:disputeId/evidence', authenticateToken, upload.single('evidence'), async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.disputeId);
    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    if (!isDisputeAccessibleByUser(dispute, req.user)) {
      return res.status(403).json({ message: 'Not authorized to update this dispute' });
    }

    const note = String(req.body?.note || '').trim();
    const evidenceUrl = req.file
      ? `/uploads/${req.file.filename}`
      : String(req.body?.fileUrl || '').trim();

    if (!note && !evidenceUrl) {
      return res.status(400).json({ message: 'Either note or evidence file is required' });
    }

    dispute.evidence.push({
      fileUrl: evidenceUrl,
      note,
      uploadedBy: req.user._id,
      uploadedAt: new Date(),
    });
    dispute.lastUpdatedBy = req.user._id;

    if (dispute.status === 'open') {
      dispute.status = 'in_review';
    }

    await dispute.save();

    const populatedDispute = await Dispute.findById(dispute._id)
      .populate('raisedBy', 'name phone role')
      .populate('againstUser', 'name phone role')
      .populate('orderId', 'orderNumber status totalAmount')
      .populate('proposalId', 'status totalAmount')
      .populate('evidence.uploadedBy', 'name role');

    res.json({
      success: true,
      message: 'Dispute evidence added successfully',
      data: populatedDispute,
    });
  } catch (error) {
    console.error('Add dispute evidence error:', error);
    res.status(500).json({ message: 'Failed to add dispute evidence', error: error.message });
  }
});

// ============ ADMIN ROUTES ============

app.get('/api/admin/stats', authenticateToken, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      usersCount,
      cropsCount,
      proposalsCount,
      ordersCount,
      transactionsCount,
      agreementsCount,
      disputesCount,
      usersByRole,
      usersByAccountStatus,
      ordersByStatus,
      proposalsByStatus,
      disputesByStatus,
      tradeValueRows,
      completedTransactionAmountRows,
      recentUsers,
      recentCrops,
      recentProposals,
      recentOrders,
      recentDisputes,
    ] = await Promise.all([
      User.countDocuments({}),
      Crop.countDocuments({}),
      Proposal.countDocuments({}),
      Order.countDocuments({}),
      Transaction.countDocuments({}),
      Agreement.countDocuments({}),
      Dispute.countDocuments({}),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
      User.aggregate([
        { $group: { _id: '$accountStatus', count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Proposal.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Dispute.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        {
          $group: {
            _id: null,
            totalTradeValue: { $sum: '$totalAmount' },
          },
        },
      ]),
      Transaction.aggregate([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: null,
            totalTransactionAmount: { $sum: '$amount' },
          },
        },
      ]),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Crop.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Proposal.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Order.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Dispute.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    ]);

    res.json({
      success: true,
      data: {
        totals: {
          users: usersCount,
          crops: cropsCount,
          proposals: proposalsCount,
          orders: ordersCount,
          transactions: transactionsCount,
          agreements: agreementsCount,
          disputes: disputesCount,
        },
        usersByRole,
        usersByAccountStatus,
        ordersByStatus,
        proposalsByStatus,
        disputesByStatus,
        finance: {
          totalTradeValue: roundAmount(tradeValueRows[0]?.totalTradeValue || 0),
          totalCompletedTransactionAmount: roundAmount(
            completedTransactionAmountRows[0]?.totalTransactionAmount || 0
          ),
        },
        last7Days: {
          newUsers: recentUsers,
          newCrops: recentCrops,
          newProposals: recentProposals,
          newOrders: recentOrders,
          newDisputes: recentDisputes,
        },
      },
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ message: 'Failed to fetch admin stats', error: error.message });
  }
});

app.get('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const {
      role,
      status,
      kycStatus,
      search,
      page = 1,
      limit = 25,
    } = req.query;

    const query = {};
    if (role && role !== 'all') query.role = role;
    if (status && status !== 'all') query.accountStatus = status;
    if (kycStatus && kycStatus !== 'all') {
      if (kycStatus === 'approved') {
        query.kycStatus = { $in: ['approved', 'verified'] };
      } else {
        query.kycStatus = kycStatus;
      }
    }

    if (search) {
      const searchRegex = new RegExp(String(search).trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { phone: searchRegex },
      ];
    }

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 25));
    const skip = (pageNumber - 1) * pageSize;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -otp')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: users.map((user) => serializeUser(user)),
      pagination: {
        total,
        page: pageNumber,
        pages: Math.ceil(total / pageSize),
        limit: pageSize,
      },
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
});

app.get('/api/admin/users/:userId', authenticateToken, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const user = await User.findById(req.params.userId).select('-password -otp');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const [
      cropsCount,
      proposalsAsTrader,
      proposalsAsFarmer,
      ordersAsTrader,
      ordersAsFarmer,
      deliveriesCount,
      disputesRaised,
      disputesAgainst,
      recentTransactions,
    ] = await Promise.all([
      Crop.countDocuments({ farmerId: user._id }),
      Proposal.countDocuments({ traderId: user._id }),
      Proposal.countDocuments({ farmerId: user._id }),
      Order.countDocuments({ traderId: user._id }),
      Order.countDocuments({ farmerId: user._id }),
      Order.countDocuments({ 'transportDetails.driverId': user._id }),
      Dispute.countDocuments({ raisedBy: user._id }),
      Dispute.countDocuments({ againstUser: user._id }),
      Transaction.find({
        $or: [
          { payerId: user._id },
          { payeeId: user._id },
        ],
      })
        .select('referenceNumber amount status paymentMethod createdAt')
        .sort({ createdAt: -1 })
        .limit(8),
    ]);

    res.json({
      success: true,
      data: {
        user: serializeUser(user),
        activity: {
          cropsCount,
          proposalsAsTrader,
          proposalsAsFarmer,
          ordersAsTrader,
          ordersAsFarmer,
          deliveriesCount,
          disputesRaised,
          disputesAgainst,
        },
        recentTransactions,
      },
    });
  } catch (error) {
    console.error('Get admin user details error:', error);
    res.status(500).json({ message: 'Failed to fetch user details', error: error.message });
  }
});

app.put('/api/admin/users/:userId/suspend', authenticateToken, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    if (idsEqual(req.user._id, req.params.userId)) {
      return res.status(400).json({ message: 'Admin cannot suspend own account' });
    }

    const targetUser = await User.findById(req.params.userId).select('-password -otp');
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    targetUser.accountStatus = 'suspended';
    targetUser.accountStatusReason = String(req.body?.reason || 'Account suspended by admin').trim();
    targetUser.accountStatusUpdatedAt = new Date();
    targetUser.accountStatusUpdatedBy = req.user._id;
    await targetUser.save();

    res.json({
      success: true,
      message: 'User suspended successfully',
      data: serializeUser(targetUser),
    });
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({ message: 'Failed to suspend user', error: error.message });
  }
});

app.put('/api/admin/users/:userId/activate', authenticateToken, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const targetUser = await User.findById(req.params.userId).select('-password -otp');
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    targetUser.accountStatus = 'active';
    targetUser.accountStatusReason = '';
    targetUser.accountStatusUpdatedAt = new Date();
    targetUser.accountStatusUpdatedBy = req.user._id;
    await targetUser.save();

    res.json({
      success: true,
      message: 'User activated successfully',
      data: serializeUser(targetUser),
    });
  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({ message: 'Failed to activate user', error: error.message });
  }
});

app.put('/api/admin/users/:userId/ban', authenticateToken, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    if (idsEqual(req.user._id, req.params.userId)) {
      return res.status(400).json({ message: 'Admin cannot ban own account' });
    }

    const targetUser = await User.findById(req.params.userId).select('-password -otp');
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    targetUser.accountStatus = 'banned';
    targetUser.accountStatusReason = String(req.body?.reason || 'Account banned by admin').trim();
    targetUser.accountStatusUpdatedAt = new Date();
    targetUser.accountStatusUpdatedBy = req.user._id;
    await targetUser.save();

    res.json({
      success: true,
      message: 'User banned successfully',
      data: serializeUser(targetUser),
    });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({ message: 'Failed to ban user', error: error.message });
  }
});

app.get('/api/admin/orders', authenticateToken, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const { status, paymentStatus, search, page = 1, limit = 25 } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (paymentStatus && paymentStatus !== 'all') query.paymentStatus = paymentStatus;
    if (search) {
      query.orderNumber = { $regex: String(search).trim(), $options: 'i' };
    }

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 25));
    const skip = (pageNumber - 1) * pageSize;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('cropId', 'cropName category unit')
        .populate('farmerId', 'name phone accountStatus kycStatus')
        .populate('traderId', 'name phone accountStatus kycStatus')
        .populate('transportDetails.driverId', 'name phone accountStatus')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      Order.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: pageNumber,
        pages: Math.ceil(total / pageSize),
        limit: pageSize,
      },
    });
  } catch (error) {
    console.error('Get admin orders error:', error);
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
});

app.get('/api/admin/crops', authenticateToken, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const { status, category, search, page = 1, limit = 25 } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (category && category !== 'all') query.category = category;
    if (search) {
      const searchRegex = new RegExp(String(search).trim(), 'i');
      query.$or = [
        { cropName: searchRegex },
        { farmerName: searchRegex },
      ];
    }

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 25));
    const skip = (pageNumber - 1) * pageSize;

    const [crops, total] = await Promise.all([
      Crop.find(query)
        .populate('farmerId', 'name phone accountStatus kycStatus')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      Crop.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: crops,
      pagination: {
        total,
        page: pageNumber,
        pages: Math.ceil(total / pageSize),
        limit: pageSize,
      },
    });
  } catch (error) {
    console.error('Get admin crops error:', error);
    res.status(500).json({ message: 'Failed to fetch crops', error: error.message });
  }
});

app.get('/api/admin/proposals', authenticateToken, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const { status, search, page = 1, limit = 25 } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (search) {
      query.message = { $regex: String(search).trim(), $options: 'i' };
    }

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 25));
    const skip = (pageNumber - 1) * pageSize;

    const [proposals, total] = await Promise.all([
      Proposal.find(query)
        .populate('cropId', 'cropName category unit price farmerName')
        .populate('farmerId', 'name phone accountStatus kycStatus')
        .populate('traderId', 'name phone accountStatus kycStatus')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      Proposal.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: proposals,
      pagination: {
        total,
        page: pageNumber,
        pages: Math.ceil(total / pageSize),
        limit: pageSize,
      },
    });
  } catch (error) {
    console.error('Get admin proposals error:', error);
    res.status(500).json({ message: 'Failed to fetch proposals', error: error.message });
  }
});

app.get('/api/admin/deliveries', authenticateToken, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const { status, page = 1, limit = 25 } = req.query;
    const query = {
      'transportDetails.driverId': { $exists: true, $ne: null },
    };
    if (status && status !== 'all') query.status = status;

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 25));
    const skip = (pageNumber - 1) * pageSize;

    const [deliveries, total] = await Promise.all([
      Order.find(query)
        .populate('cropId', 'cropName category unit')
        .populate('farmerId', 'name phone')
        .populate('traderId', 'name phone')
        .populate('transportDetails.driverId', 'name phone accountStatus')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(pageSize),
      Order.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: deliveries,
      pagination: {
        total,
        page: pageNumber,
        pages: Math.ceil(total / pageSize),
        limit: pageSize,
      },
    });
  } catch (error) {
    console.error('Get admin deliveries error:', error);
    res.status(500).json({ message: 'Failed to fetch deliveries', error: error.message });
  }
});

app.get('/api/admin/disputes', authenticateToken, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const {
      status,
      priority,
      category,
      search,
      page = 1,
      limit = 25,
    } = req.query;

    const query = {};
    if (status && status !== 'all') query.status = status;
    if (priority && priority !== 'all') query.priority = priority;
    if (category && category !== 'all') query.category = category;
    if (search) {
      const searchRegex = new RegExp(String(search).trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
      ];
    }

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 25));
    const skip = (pageNumber - 1) * pageSize;

    const [disputes, total] = await Promise.all([
      Dispute.find(query)
        .populate('raisedBy', 'name phone role accountStatus')
        .populate('againstUser', 'name phone role accountStatus')
        .populate('orderId', 'orderNumber status totalAmount')
        .populate('proposalId', 'status totalAmount')
        .populate('resolution.resolvedBy', 'name role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      Dispute.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: disputes,
      pagination: {
        total,
        page: pageNumber,
        pages: Math.ceil(total / pageSize),
        limit: pageSize,
      },
    });
  } catch (error) {
    console.error('Get admin disputes error:', error);
    res.status(500).json({ message: 'Failed to fetch disputes', error: error.message });
  }
});

app.put('/api/admin/disputes/:disputeId/status', authenticateToken, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const {
      status,
      resolutionNote = '',
      action = '',
    } = req.body || {};

    const allowedStatuses = ['open', 'in_review', 'resolved', 'rejected', 'closed'];
    if (!allowedStatuses.includes(String(status || '').trim())) {
      return res.status(400).json({ message: 'Invalid dispute status' });
    }

    const dispute = await Dispute.findById(req.params.disputeId);
    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    dispute.status = status;
    dispute.lastUpdatedBy = req.user._id;

    if (['resolved', 'rejected', 'closed'].includes(status)) {
      dispute.resolution = {
        ...(dispute.resolution || {}),
        note: String(resolutionNote || dispute.resolution?.note || '').trim(),
        action: String(action || dispute.resolution?.action || '').trim(),
        resolvedBy: req.user._id,
        resolvedAt: new Date(),
      };
    } else if (status === 'in_review') {
      dispute.resolution = {
        ...(dispute.resolution || {}),
        note: String(resolutionNote || dispute.resolution?.note || '').trim(),
        action: String(action || dispute.resolution?.action || '').trim(),
      };
    }

    await dispute.save();

    const populatedDispute = await Dispute.findById(dispute._id)
      .populate('raisedBy', 'name phone role accountStatus')
      .populate('againstUser', 'name phone role accountStatus')
      .populate('orderId', 'orderNumber status totalAmount')
      .populate('proposalId', 'status totalAmount')
      .populate('resolution.resolvedBy', 'name role');

    res.json({
      success: true,
      message: 'Dispute status updated successfully',
      data: populatedDispute,
    });
  } catch (error) {
    console.error('Update admin dispute status error:', error);
    res.status(500).json({ message: 'Failed to update dispute status', error: error.message });
  }
});

app.get('/api/admin/settings', authenticateToken, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    res.json({
      success: true,
      data: adminRuntimeSettings,
    });
  } catch (error) {
    console.error('Get admin settings error:', error);
    res.status(500).json({ message: 'Failed to fetch settings', error: error.message });
  }
});

app.put('/api/admin/settings', authenticateToken, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const updates = req.body || {};

    if (updates.maintenanceMode !== undefined) {
      adminRuntimeSettings.maintenanceMode = Boolean(updates.maintenanceMode);
    }
    if (updates.allowNewRegistrations !== undefined) {
      adminRuntimeSettings.allowNewRegistrations = Boolean(updates.allowNewRegistrations);
    }
    if (updates.supportEmail !== undefined) {
      adminRuntimeSettings.supportEmail = String(updates.supportEmail || '').trim();
    }
    if (updates.maxUploadSizeMb !== undefined) {
      const maxUploadSizeMb = Number(updates.maxUploadSizeMb);
      if (Number.isFinite(maxUploadSizeMb)) {
        adminRuntimeSettings.maxUploadSizeMb = Math.min(100, Math.max(1, maxUploadSizeMb));
      }
    }

    res.json({
      success: true,
      message: 'Admin settings updated successfully',
      data: adminRuntimeSettings,
    });
  } catch (error) {
    console.error('Update admin settings error:', error);
    res.status(500).json({ message: 'Failed to update settings', error: error.message });
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
((req, res) => {
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

    httpServer.listen(5001, '0.0.0.0', () => {
      console.log('Server running on port 5001');
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