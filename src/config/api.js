/**
 * API Configuration
 * Central configuration for API endpoints and URLs
 */

// ============================================================
// ⚠️  IMPORTANT: UPDATE THIS IP WHEN YOUR WIFI CHANGES! ⚠️
// Run `ipconfig` in cmd and look for "IPv4 Address" under
// your active WiFi adapter. Replace the IP below.
// ============================================================
// For Android emulator: use http://10.0.2.2:5050
// For iOS simulator:    use http://localhost:5050
// For physical device:  use your PC's LAN IP (e.g. 192.168.x.x)

export const API_BASE_URL = 'http://192.168.0.100:5001/api'; // <-- UPDATE THIS IP if WiFi changes (run ipconfig)
// Socket.IO URL (same as API base, without /api)
export const SOCKET_URL = 'http://192.168.0.100:5001'; // <-- UPDATE THIS IP if WiFi changes

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    SEND_OTP: '/auth/send-otp',
    VERIFY_OTP: '/auth/verify-otp',
    PROFILE: '/auth/me',
    UPDATE_BANK: '/auth/update-bank-details',
    SUBMIT_KYC: '/auth/submit-kyc',
    MY_KYC: '/auth/my-kyc',
  },

  // Crops
  CROPS: {
    MY_CROPS: '/crops/my-crops',
    AVAILABLE: '/crops/available',
    ADD: '/crops/add',
    UPDATE: (cropId) => `/crops/update/${cropId}`,
    DELETE: (cropId) => `/crops/delete/${cropId}`,
    DETAILS: (cropId) => `/crops/${cropId}`,
    STATUS: (cropId) => `/crops/status/${cropId}`,
  },

  // Proposals
  PROPOSALS: {
    CREATE: '/proposals',
    TRADER: '/proposals/trader',
    FARMER: '/proposals/farmer',
    FOR_CROP: (cropId) => `/proposals/crop/${cropId}`,
    ACCEPT: (proposalId) => `/proposals/${proposalId}/accept`,
    REJECT: (proposalId) => `/proposals/${proposalId}/reject`,
    WITHDRAW: (proposalId) => `/proposals/${proposalId}/withdraw`,
    STATS: '/proposals/stats',
  },

  // Orders
  ORDERS: {
    CREATE: '/orders/create',
    FARMER_ORDERS: '/orders/farmer/my-orders',
    TRADER_ORDERS: '/orders/trader/my-orders',
    DETAILS: (orderId) => `/orders/${orderId}`,
    ACCEPT: (orderId) => `/orders/accept/${orderId}`,
    REJECT: (orderId) => `/orders/reject/${orderId}`,
    READY: (orderId) => `/orders/ready/${orderId}`,
    CANCEL: (orderId) => `/orders/cancel/${orderId}`,
  },

  // Agreements
  AGREEMENTS: {
    LIST: '/agreements',
    STATS: '/agreements/stats',
    GET: (orderId) => `/agreements/${orderId}`,
    EXPORT: (orderId) => `/agreements/${orderId}/export`,
    FARMER_SIGN: (orderId) => `/agreements/farmer-sign/${orderId}`,
    TRADER_SIGN: (orderId) => `/agreements/trader-sign/${orderId}`,
    CANCEL: (orderId) => `/agreements/cancel/${orderId}`,
  },

  // Transport
  TRANSPORT: {
    AVAILABLE: '/transport/available',
    ACCEPT: (orderId) => `/transport/accept/${orderId}`,
    MY_DELIVERIES: '/transport/my-deliveries',
    HISTORY: '/transport/history',
    STATUS: (deliveryId) => `/transport/status/${deliveryId}`,
    DETAILS: (deliveryId) => `/transport/details/${deliveryId}`,
    LOCATION_UPDATE: (deliveryId) => `/transport/location/${deliveryId}`,
    LOCATION: (deliveryId) => `/transport/location/${deliveryId}`,
  },

  // Vehicles
  VEHICLES: {
    MY_VEHICLES: '/vehicles/my-vehicles',
    ADD: '/vehicles/add',
    UPDATE: (vehicleId) => `/vehicles/${vehicleId}/update`,
    DELETE: (vehicleId) => `/vehicles/${vehicleId}/delete`,
    AVAILABILITY: (vehicleId) => `/vehicles/${vehicleId}/availability`,
    AVAILABLE_ORDERS: '/vehicles/orders/available',
    SUGGEST: (orderId) => `/vehicles/suggest/${orderId}`,
  },

  // Transactions/Payments
  TRANSACTIONS: {
    CREATE: '/transactions',
    MY_TRANSACTIONS: '/transactions',
    STATS: '/transactions/stats',
    DETAILS: (transactionId) => `/transactions/${transactionId}`,
    BY_REFERENCE: (referenceNumber) => `/transactions/reference/${referenceNumber}`,
  },

  // Disputes
  DISPUTES: {
    CREATE: '/disputes',
    MY_DISPUTES: '/disputes/my',
    ADD_EVIDENCE: (disputeId) => `/disputes/${disputeId}/evidence`,
  },

  // Weather
  WEATHER: {
    GET_WEATHER: '/weather/get-weather',
    MY_LOCATIONS: '/weather/my-locations',
    LOCATION: (weatherId) => `/weather/location/${weatherId}`,
    FAVORITE: (weatherId) => `/weather/favorite/${weatherId}`,
    ALERTS: '/weather/alerts/all',
  },

  // Community
  COMMUNITY: {
    POSTS: '/community/posts',
    CREATE_POST: '/community/posts',
    LIKE: (postId) => `/community/posts/${postId}/like`,
    COMMENT: (postId) => `/community/posts/${postId}/comment`,
  },

  // Tasks
  TASKS: {
    CREATE: '/tasks/create',
    MY_TASKS: '/tasks/my-tasks',
    UPDATE: (taskId) => `/tasks/update/${taskId}`,
    DELETE: (taskId) => `/tasks/delete/${taskId}`,
  },

  // Analytics
  ANALYTICS: {
    PRICE_TREND: '/analytics/price-trend',
    TOP_CROPS: '/analytics/top-crops',
    FARMER_NETWORK: '/analytics/farmer-network',
  },

  // Admin
  ADMIN: {
    STATS: '/admin/stats',
    USERS: '/admin/users',
    USER_DETAILS: (userId) => `/admin/users/${userId}`,
    SUSPEND_USER: (userId) => `/admin/users/${userId}/suspend`,
    ACTIVATE_USER: (userId) => `/admin/users/${userId}/activate`,
    BAN_USER: (userId) => `/admin/users/${userId}/ban`,
    ALL_KYC: '/auth/get-all-kyc',
    KYC_APPROVE: (kycId) => `/auth/kyc-approve/${kycId}`,
    KYC_REJECT: (kycId) => `/auth/kyc-reject/${kycId}`,
    ALL_ORDERS: '/admin/orders',
    ALL_CROPS: '/admin/crops',
    ALL_PROPOSALS: '/admin/proposals',
    ALL_DELIVERIES: '/admin/deliveries',
    DISPUTES: '/admin/disputes',
    UPDATE_DISPUTE_STATUS: (disputeId) => `/admin/disputes/${disputeId}/status`,
    SETTINGS: '/admin/settings',
  },
};

// API Request Timeout (milliseconds)
export const API_TIMEOUT = 30000; // 30 seconds

// Max file upload size (bytes)
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// Image quality for compression
export const IMAGE_QUALITY = 0.8;

// Retry configuration
export const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // milliseconds
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};
