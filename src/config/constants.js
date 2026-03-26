/**
 * App Constants
 * Global constants used throughout the application
 */

// User Roles
export const USER_ROLES = {
  FARMER: 'farmer',
  TRADER: 'trader',
  TRANSPORT: 'transport',
  ADMIN: 'admin',
};

// Account Status
export const ACCOUNT_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  BANNED: 'banned',
};

// Crop Categories
export const CROP_CATEGORIES = [
  { label: 'Grains', value: 'Grains' },
  { label: 'Vegetables', value: 'Vegetables' },
  { label: 'Fruits', value: 'Fruits' },
  { label: 'Pulses', value: 'Pulses' },
  { label: 'Spices', value: 'Spices' },
  { label: 'Other', value: 'Other' },
];

// Crop Quality Grades
export const QUALITY_GRADES = [
  { label: 'A+ (Premium)', value: 'A+' },
  { label: 'A (High Quality)', value: 'A' },
  { label: 'B (Standard)', value: 'B' },
  { label: 'C (Basic)', value: 'C' },
];

// Crop Units
export const CROP_UNITS = [
  { label: 'Kilogram (kg)', value: 'kg' },
  { label: 'Quintal', value: 'quintal' },
  { label: 'Ton', value: 'ton' },
  { label: 'Piece', value: 'piece' },
];

// Crop Status
export const CROP_STATUS = {
  AVAILABLE: 'Available',
  RESERVED: 'Reserved',
  SOLD: 'Sold',
  UNAVAILABLE: 'Unavailable',
};

// Order Status
export const ORDER_STATUS = {
  PENDING: 'Pending',
  FARMER_AGREED: 'Farmer Agreed',
  BOTH_AGREED: 'Both Agreed',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  READY_FOR_PICKUP: 'Ready for Pickup',
  TRANSPORT_ASSIGNED: 'Transport Assigned',
  IN_TRANSIT: 'In Transit',
  DELIVERED: 'Delivered',
  AWAITING_PAYMENT: 'Awaiting Payment',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
};

// Proposal Status
export const PROPOSAL_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
  EXPIRED: 'expired',
};

// Agreement Status
export const AGREEMENT_STATUS = {
  PENDING_FARMER: 'pending_farmer',
  PENDING_TRADER: 'pending_trader',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  BREACHED: 'breached',
};

// Payment Methods
export const PAYMENT_METHODS = {
  FULL: 'Full',
  COD: 'COD',
  RAZORPAY: 'razorpay',
  BANK_TRANSFER: 'bank_transfer',
  UPI: 'upi',
  CASH: 'cash',
};

// Payment Terms for Proposals
export const PAYMENT_TERMS = [
  'On Delivery',
  'Advance Payment',
  '50% Advance',
  'Credit (7 Days)',
  'Credit (15 Days)',
];

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'Pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FULL_PAID: 'Full Paid',
  FAILED: 'Failed',
  REFUNDED: 'refunded',
};

// Transaction Types
export const TRANSACTION_TYPES = {
  BOOKING_PAYMENT: 'booking_payment',
  PLATFORM_FEE: 'platform_fee',
  FULL_PAYMENT: 'full_payment',
  REFUND: 'refund',
  PAYOUT: 'payout',
  COMMISSION: 'commission',
};

// Delivery Status
export const DELIVERY_STATUS = {
  ASSIGNED: 'Assigned',
  PICKED_UP: 'Picked Up',
  IN_TRANSIT: 'In Transit',
  DELIVERED: 'Delivered',
  FAILED: 'Failed',
};

// Vehicle Types
export const VEHICLE_TYPES = [
  { label: 'Bike', value: 'Bike' },
  { label: 'Auto', value: 'Auto' },
  { label: 'Tempo', value: 'Tempo' },
  { label: 'Truck', value: 'Truck' },
  { label: 'Mini Truck', value: 'Mini Truck' },
  { label: 'Other', value: 'Other' },
];

// Vehicle Availability Status
export const VEHICLE_STATUS = {
  AVAILABLE: 'available',
  ON_DELIVERY: 'on_delivery',
  MAINTENANCE: 'maintenance',
  INACTIVE: 'inactive',
};

// KYC Status
export const KYC_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

// KYC Document Types
export const KYC_DOCUMENTS = {
  AADHAAR: 'aadhaar',
  PAN: 'pan',
  SELFIE: 'selfie',
  FARM_GEOTAG: 'farmGeotagPhoto',
  GST: 'gst',
  BUSINESS_REG: 'businessRegistration',
  OFFICE_GEOTAG: 'officeGeotagPhoto',
  ELECTRICITY_BILL: 'electricityBill',
  RENT_AGREEMENT: 'rentAgreement',
  BUSINESS_LICENSE: 'businessLicense',
  RTO_PERMIT: 'rtoPermit',
  COMMERCIAL_PERMIT: 'commercialPermit',
};

// Farm Task Categories
export const TASK_CATEGORIES = [
  { label: 'Sowing', value: 'Sowing' },
  { label: 'Irrigation', value: 'Irrigation' },
  { label: 'Fertilizing', value: 'Fertilizing' },
  { label: 'Harvesting', value: 'Harvesting' },
  { label: 'Maintenance', value: 'Maintenance' },
];

// Task Status
export const TASK_STATUS = {
  PENDING: 'Pending',
  COMPLETED: 'Completed',
};

// Weather Alert Levels
export const ALERT_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  SEVERE: 'severe',
};

// Dispute Status
export const DISPUTE_STATUS = {
  OPEN: 'open',
  UNDER_REVIEW: 'under_review',
  RESOLVED: 'resolved',
};

// Dispute Resolution
export const DISPUTE_RESOLUTION = {
  PENDING: 'pending',
  IN_FAVOR_OF_FARMER: 'in_favor_of_farmer',
  IN_FAVOR_OF_BUYER: 'in_favor_of_buyer',
  CLOSED: 'closed',
};

// File Upload Constraints
export const FILE_CONSTRAINTS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10 MB
  IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png'],
  DOCUMENT_TYPES: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
  MAX_IMAGES: 5,
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM DD, YYYY',
  DISPLAY_WITH_TIME: 'MMM DD, YYYY h:mm A',
  API: 'YYYY-MM-DD',
  TIMESTAMP: 'YYYY-MM-DD HH:mm:ss',
};

// Currency
export const CURRENCY = {
  SYMBOL: '₹',
  CODE: 'INR',
  LOCALE: 'en-IN',
};

// Phone Number
export const PHONE = {
  COUNTRY_CODE: '+91',
  MIN_LENGTH: 10,
  MAX_LENGTH: 10,
};

// OTP
export const OTP = {
  LENGTH: 6,
  EXPIRY_MINUTES: 5,
  RESEND_DELAY_SECONDS: 60,
};

// Rating
export const RATING = {
  MIN: 0,
  MAX: 5,
  DEFAULT: 0,
};

// Platform Fees
export const PLATFORM_FEES = {
  PER_KG: 1, // ₹1 per kg
  BOOKING_PERCENTAGE: 10, // 10% of total amount
};

// Map Configuration
export const MAP_CONFIG = {
  DEFAULT_LATITUDE: 20.5937, // India center
  DEFAULT_LONGITUDE: 78.9629,
  DEFAULT_DELTA: 10,
  TRACKING_INTERVAL: 30000, // 30 seconds
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'userData',
  LANGUAGE: 'appLanguage',
  THEME: 'appTheme',
  FCM_TOKEN: 'fcmToken',
};

// Socket Events
export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  PROPOSAL_NEW: 'proposal:new',
  PROPOSAL_ACCEPTED: 'proposal:accepted',
  PROPOSAL_REJECTED: 'proposal:rejected',
  ORDER_STATUS_UPDATE: 'order:status',
  DELIVERY_LOCATION: 'delivery:location',
  WEATHER_UPDATE: 'weather:update',
  NOTIFICATION: 'notification',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Session expired. Please login again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  FILE_TOO_LARGE: 'File size exceeds maximum limit (10 MB).',
  INVALID_FILE_TYPE: 'Invalid file type. Please select a valid file.',
  PERMISSION_DENIED: 'Permission denied. Please grant the required permissions.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Logged in successfully!',
  REGISTER_SUCCESS: 'Registration successful!',
  OTP_SENT: 'OTP sent to your phone.',
  PROFILE_UPDATED: 'Profile updated successfully.',
  CROP_ADDED: 'Crop added successfully!',
  CROP_UPDATED: 'Crop updated successfully!',
  CROP_DELETED: 'Crop deleted successfully!',
  PROPOSAL_SENT: 'Proposal sent successfully!',
  ORDER_PLACED: 'Order placed successfully!',
  PAYMENT_SUCCESS: 'Payment completed successfully!',
};
