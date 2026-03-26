/**
 * Error Handler Utilities
 * Centralized error handling and user-friendly error messages
 */

import Toast from 'react-native-toast-message';
import { ERROR_MESSAGES } from '../config/constants';

/**
 * Handle API errors
 */
export const handleAPIError = (error, showToast = true) => {
  let errorMessage = ERROR_MESSAGES.SERVER_ERROR;

  if (error.message) {
    // Check for specific error types
    if (error.message.includes('Network')) {
      errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
    } else if (error.message.includes('Session expired') || error.message.includes('Unauthorized')) {
      errorMessage = ERROR_MESSAGES.UNAUTHORIZED;
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Request timeout. Please try again.';
    } else {
      errorMessage = error.message;
    }
  }

  if (showToast) {
    showErrorToast(errorMessage);
  }

  console.error('API Error:', error);

  return {
    success: false,
    error: errorMessage,
  };
};

/**
 * Handle validation errors
 */
export const handleValidationError = (errors, showToast = true) => {
  if (!errors || Object.keys(errors).length === 0) {
    return;
  }

  // Get first error message
  const firstError = Object.values(errors)[0];

  if (showToast) {
    showErrorToast(firstError);
  }

  return {
    success: false,
    errors,
  };
};

/**
 * Handle file upload errors
 */
export const handleFileUploadError = (error, showToast = true) => {
  let errorMessage = 'File upload failed. Please try again.';

  if (error.message) {
    if (error.message.includes('size')) {
      errorMessage = ERROR_MESSAGES.FILE_TOO_LARGE;
    } else if (error.message.includes('type') || error.message.includes('format')) {
      errorMessage = ERROR_MESSAGES.INVALID_FILE_TYPE;
    } else if (error.message.includes('permission')) {
      errorMessage = ERROR_MESSAGES.PERMISSION_DENIED;
    } else {
      errorMessage = error.message;
    }
  }

  if (showToast) {
    showErrorToast(errorMessage);
  }

  console.error('File Upload Error:', error);

  return {
    success: false,
    error: errorMessage,
  };
};

/**
 * Handle authentication errors
 */
export const handleAuthError = (error, showToast = true) => {
  let errorMessage = 'Authentication failed. Please try again.';

  if (error.message) {
    if (error.message.includes('credentials')) {
      errorMessage = 'Invalid credentials. Please check your phone and password.';
    } else if (error.message.includes('exists')) {
      errorMessage = 'This phone number is already registered.';
    } else if (error.message.includes('OTP')) {
      errorMessage = 'Invalid or expired OTP. Please try again.';
    } else {
      errorMessage = error.message;
    }
  }

  if (showToast) {
    showErrorToast(errorMessage);
  }

  console.error('Auth Error:', error);

  return {
    success: false,
    error: errorMessage,
  };
};

/**
 * Show error toast
 */
export const showErrorToast = (message, duration = 3000) => {
  Toast.show({
    type: 'error',
    text1: 'Error',
    text2: message,
    visibilityTime: duration,
    position: 'top',
    topOffset: 50,
  });
};

/**
 * Show success toast
 */
export const showSuccessToast = (message, duration = 2000) => {
  Toast.show({
    type: 'success',
    text1: 'Success',
    text2: message,
    visibilityTime: duration,
    position: 'top',
    topOffset: 50,
  });
};

/**
 * Show info toast
 */
export const showInfoToast = (message, duration = 2000) => {
  Toast.show({
    type: 'info',
    text1: 'Info',
    text2: message,
    visibilityTime: duration,
    position: 'top',
    topOffset: 50,
  });
};

/**
 * Show warning toast
 */
export const showWarningToast = (message, duration = 3000) => {
  Toast.show({
    type: 'warning',
    text1: 'Warning',
    text2: message,
    visibilityTime: duration,
    position: 'top',
    topOffset: 50,
  });
};

/**
 * Log error for debugging
 */
export const logError = (context, error, additionalInfo = {}) => {
  const errorLog = {
    context,
    message: error.message || 'Unknown error',
    stack: error.stack,
    timestamp: new Date().toISOString(),
    ...additionalInfo,
  };

  console.error('Error Log:', JSON.stringify(errorLog, null, 2));

  // In production, you would send this to a logging service like Sentry
  // Example: Sentry.captureException(error, { extra: errorLog });

  return errorLog;
};

/**
 * Parse error from response
 */
export const parseError = (error) => {
  if (typeof error === 'string') {
    return error;
  }

  if (error.response) {
    // Server responded with an error
    return error.response.data?.message || error.response.statusText || 'Server error';
  }

  if (error.request) {
    // Request was made but no response
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  if (error.message) {
    return error.message;
  }

  return ERROR_MESSAGES.SERVER_ERROR;
};

/**
 * Global error boundary handler
 */
export const handleGlobalError = (error, errorInfo) => {
  logError('Global Error Boundary', error, { errorInfo });

  // Show user-friendly message
  showErrorToast('Something went wrong. Please restart the app.');
};

/**
 * Handle promise rejection
 */
export const handlePromiseRejection = (reason, promise) => {
  console.error('Unhandled Promise Rejection:', reason);
  logError('Unhandled Promise', new Error(reason));
};

/**
 * Retry function with exponential backoff
 */
export const retryWithBackoff = async (
  fn,
  maxRetries = 3,
  baseDelay = 1000,
  onRetry = null
) => {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);

        if (onRetry) {
          onRetry(attempt + 1, maxRetries, delay);
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

/**
 * Safe async handler (prevents unhandled promise rejections)
 */
export const safeAsync = (fn) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error('Safe Async Error:', error);
      handleAPIError(error);
      return null;
    }
  };
};

export default {
  handleAPIError,
  handleValidationError,
  handleFileUploadError,
  handleAuthError,
  showErrorToast,
  showSuccessToast,
  showInfoToast,
  showWarningToast,
  logError,
  parseError,
  handleGlobalError,
  handlePromiseRejection,
  retryWithBackoff,
  safeAsync,
};
