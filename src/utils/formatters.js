/**
 * Formatter Utilities
 * Helper functions for formatting data for display
 */

import { CURRENCY } from '../config/constants';

/**
 * Format currency (Indian Rupee)
 */
export const formatCurrency = (amount, includeSymbol = true) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return includeSymbol ? `${CURRENCY.SYMBOL}0` : '0';
  }

  const formattedAmount = new Intl.NumberFormat(CURRENCY.LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

  return includeSymbol ? `${CURRENCY.SYMBOL}${formattedAmount}` : formattedAmount;
};

/**
 * Format phone number
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';

  // Remove all non-digit characters
  const cleanPhone = phone.toString().replace(/\D/g, '');

  // Format as +91 XXXXX XXXXX
  if (cleanPhone.length === 10) {
    return `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`;
  }

  // If already has country code
  if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
    return `+${cleanPhone.slice(0, 2)} ${cleanPhone.slice(2, 7)} ${cleanPhone.slice(7)}`;
  }

  return phone;
};

/**
 * Format date
 */
export const formatDate = (date, format = 'short') => {
  if (!date) return '';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  switch (format) {
    case 'short':
      // Jan 15, 2024
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

    case 'long':
      // January 15, 2024
      return d.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

    case 'full':
      // Monday, January 15, 2024
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

    case 'time':
      // 3:30 PM
      return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

    case 'datetime':
      // Jan 15, 2024 3:30 PM
      return `${formatDate(d, 'short')} ${formatDate(d, 'time')}`;

    case 'relative':
      return formatRelativeTime(d);

    default:
      return d.toLocaleDateString();
  }
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const now = new Date();
  const diffMs = now - d;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else {
    return formatDate(d, 'short');
  }
};

/**
 * Format number with Indian numbering system
 */
export const formatNumber = (number, decimals = 0) => {
  if (number === null || number === undefined || isNaN(number)) {
    return '0';
  }

  return new Intl.NumberFormat(CURRENCY.LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  if (!bytes) return 'Unknown size';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Format percentage
 */
export const formatPercentage = (value, decimals = 0) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }

  return `${formatNumber(value, decimals)}%`;
};

/**
 * Format address
 */
export const formatAddress = (addressObj) => {
  if (!addressObj) return '';

  const parts = [];

  if (addressObj.village) parts.push(addressObj.village);
  if (addressObj.tehsil) parts.push(addressObj.tehsil);
  if (addressObj.district) parts.push(addressObj.district);
  if (addressObj.state) parts.push(addressObj.state);
  if (addressObj.pincode) parts.push(addressObj.pincode);

  return parts.join(', ');
};

/**
 * Truncate text
 */
export const truncateText = (text, maxLength = 50, suffix = '...') => {
  if (!text) return '';
  if (text.length <= maxLength) return text;

  return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Format IFSC code
 */
export const formatIFSC = (ifsc) => {
  if (!ifsc) return '';
  return ifsc.toUpperCase();
};

/**
 * Format account number (mask partially)
 */
export const formatAccountNumber = (accountNumber, maskLength = 4) => {
  if (!accountNumber) return '';

  const str = accountNumber.toString();
  if (str.length <= maskLength) return str;

  const visiblePart = str.slice(-maskLength);
  const maskedPart = '*'.repeat(str.length - maskLength);

  return maskedPart + visiblePart;
};

/**
 * Format duration (seconds to readable format)
 */
export const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return '0s';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
};

/**
 * Format distance (meters to km/m)
 */
export const formatDistance = (meters) => {
  if (!meters || meters < 0) return '0 m';

  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  const km = meters / 1000;
  return `${formatNumber(km, 1)} km`;
};

/**
 * Format weight
 */
export const formatWeight = (value, unit = 'kg') => {
  if (value === null || value === undefined) return '';

  return `${formatNumber(value)} ${unit}`;
};

/**
 * Capitalize first letter
 */
export const capitalize = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Capitalize each word
 */
export const capitalizeWords = (text) => {
  if (!text) return '';
  return text
    .split(' ')
    .map((word) => capitalize(word))
    .join(' ');
};

/**
 * Format rating
 */
export const formatRating = (rating, maxRating = 5) => {
  if (rating === null || rating === undefined) return '0.0';

  const clampedRating = Math.max(0, Math.min(rating, maxRating));
  return clampedRating.toFixed(1);
};

/**
 * Format coordinates
 */
export const formatCoordinates = (lat, lng, decimals = 6) => {
  if (!lat || !lng) return '';

  return `${lat.toFixed(decimals)}, ${lng.toFixed(decimals)}`;
};

/**
 * Format transaction reference
 */
export const formatTransactionRef = (ref) => {
  if (!ref) return '';

  // If already formatted, return as is
  if (ref.includes('-')) return ref;

  // Format as TXN-XXXXX-XXXXX
  if (ref.startsWith('TXN')) {
    return ref;
  }

  return `TXN-${ref}`;
};
