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

export const API_BASE_URL = 'http://192.168.0.103:5050'; // <-- UPDATE THIS IP

// Socket.IO URL (same as API base)
export const SOCKET_URL = 'http://192.168.0.103:5050'; // <-- UPDATE THIS IP

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    SEND_OTP: '/api/auth/send-otp',
    VERIFY_OTP: '/api/auth/verify-otp',
    PROFILE: '/api/auth/me', // Backend route is /me, not /profile
    UPDATE_BANK: '/api/auth/update-bank-details',
    SUBMIT_KYC: '/api/auth/submit-kyc',
    MY_KYC: '/api/auth/my-kyc',
  },

  // Crops
  CROPS: {
    MY_CROPS: '/api/crops/my-crops',
    AVAILABLE: '/api/crops/available',
    ADD: '/api/crops/add',
    UPDATE: (cropId) => `/api/crops/update/${cropId}`,
    DELETE: (cropId) => `/api/crops/delete/${cropId}`,
    DETAILS: (cropId) => `/api/crops/details/${cropId}`,
    STATUS: (cropId) => `/api/crops/status/${cropId}`,
  },

  // Proposals
  PROPOSALS: {
    CREATE: '/api/proposals',
    TRADER: '/api/proposals/trader',
    FARMER: '/api/proposals/farmer',
    FOR_CROP: (cropId) => `/api/proposals/crop/${cropId}`,
    ACCEPT: (proposalId) => `/api/proposals/${proposalId}/accept`,
    REJECT: (proposalId) => `/api/proposals/${proposalId}/reject`,
    WITHDRAW: (proposalId) => `/api/proposals/${proposalId}/withdraw`,
    STATS: '/api/proposals/stats',
  },

  // Orders
  ORDERS: {
    CREATE: '/api/orders/create',
    FARMER_ORDERS: '/api/orders/farmer/my-orders',
    TRADER_ORDERS: '/api/orders/trader/my-orders',
    DETAILS: (orderId) => `/api/orders/${orderId}`,
    ACCEPT: (orderId) => `/api/orders/accept/${orderId}`,
    REJECT: (orderId) => `/api/orders/reject/${orderId}`,
    READY: (orderId) => `/api/orders/ready/${orderId}`,
    CANCEL: (orderId) => `/api/orders/cancel/${orderId}`,
  },

  // Agreements
  AGREEMENTS: {
    LIST: '/api/agreements',
    STATS: '/api/agreements/stats',
    GET: (orderId) => `/api/agreements/${orderId}`,
    EXPORT: (orderId) => `/api/agreements/${orderId}/export`,
    FARMER_SIGN: (orderId) => `/api/agreements/farmer-sign/${orderId}`,
    TRADER_SIGN: (orderId) => `/api/agreements/trader-sign/${orderId}`,
    CANCEL: (orderId) => `/api/agreements/cancel/${orderId}`,
  },

  // Transport
  TRANSPORT: {
    AVAILABLE: '/api/transport/available',
    ACCEPT: (orderId) => `/api/transport/accept/${orderId}`,
    MY_DELIVERIES: '/api/transport/my-deliveries',
    HISTORY: '/api/transport/history',
    STATUS: (deliveryId) => `/api/transport/status/${deliveryId}`,
    DETAILS: (deliveryId) => `/api/transport/details/${deliveryId}`,
    LOCATION_UPDATE: (deliveryId) => `/api/transport/location/${deliveryId}`,
    LOCATION: (deliveryId) => `/api/transport/location/${deliveryId}`,
  },

  // Vehicles
  VEHICLES: {
    MY_VEHICLES: '/api/vehicles/my-vehicles',
    ADD: '/api/vehicles/add',
    UPDATE: (vehicleId) => `/api/vehicles/${vehicleId}/update`,
    DELETE: (vehicleId) => `/api/vehicles/${vehicleId}/delete`,
    AVAILABILITY: (vehicleId) => `/api/vehicles/${vehicleId}/availability`,
    AVAILABLE_ORDERS: '/api/vehicles/orders/available',
    SUGGEST: (orderId) => `/api/vehicles/suggest/${orderId}`,
  },

  // Transactions/Payments
  TRANSACTIONS: {
    CREATE: '/api/transactions',
    MY_TRANSACTIONS: '/api/transactions',
    STATS: '/api/transactions/stats',
    DETAILS: (transactionId) => `/api/transactions/${transactionId}`,
    BY_REFERENCE: (referenceNumber) => `/api/transactions/reference/${referenceNumber}`,
  },

  // Disputes
  DISPUTES: {
    CREATE: '/api/disputes',
    MY_DISPUTES: '/api/disputes/my',
    ADD_EVIDENCE: (disputeId) => `/api/disputes/${disputeId}/evidence`,
  },

  // Weather
  WEATHER: {
    GET_WEATHER: '/api/weather/get-weather',
    MY_LOCATIONS: '/api/weather/my-locations',
    LOCATION: (weatherId) => `/api/weather/location/${weatherId}`,
    FAVORITE: (weatherId) => `/api/weather/favorite/${weatherId}`,
    ALERTS: '/api/weather/alerts/all',
  },

  // Community
  COMMUNITY: {
    POSTS: '/api/community/posts',
    CREATE_POST: '/api/community/posts',
    LIKE: (postId) => `/api/community/posts/${postId}/like`,
    COMMENT: (postId) => `/api/community/posts/${postId}/comment`,
  },

  // Tasks
  TASKS: {
    CREATE: '/api/tasks/create',
    MY_TASKS: '/api/tasks/my-tasks',
    UPDATE: (taskId) => `/api/tasks/update/${taskId}`,
    DELETE: (taskId) => `/api/tasks/delete/${taskId}`,
  },

  // Analytics
  ANALYTICS: {
    PRICE_TREND: '/api/analytics/price-trend',
    TOP_CROPS: '/api/analytics/top-crops',
    FARMER_NETWORK: '/api/analytics/farmer-network',
  },

  // Admin
  ADMIN: {
    STATS: '/api/admin/stats',
    USERS: '/api/admin/users',
    USER_DETAILS: (userId) => `/api/admin/users/${userId}`,
    SUSPEND_USER: (userId) => `/api/admin/users/${userId}/suspend`,
    ACTIVATE_USER: (userId) => `/api/admin/users/${userId}/activate`,
    BAN_USER: (userId) => `/api/admin/users/${userId}/ban`,
    ALL_KYC: '/api/auth/get-all-kyc',
    KYC_APPROVE: (kycId) => `/api/auth/kyc-approve/${kycId}`,
    KYC_REJECT: (kycId) => `/api/auth/kyc-reject/${kycId}`,
    ALL_ORDERS: '/api/admin/orders',
    ALL_CROPS: '/api/admin/crops',
    ALL_DELIVERIES: '/api/admin/deliveries',
    DISPUTES: '/api/admin/disputes',
    SETTINGS: '/api/admin/settings',
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
