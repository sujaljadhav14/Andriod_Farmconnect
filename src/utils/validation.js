/**
 * Validation Utilities
 * Helper functions for form validation
 */

import { PHONE } from '../config/constants';

/**
 * Validate phone number
 */
export const validatePhone = (phone) => {
  if (!phone) {
    return { isValid: false, error: 'Phone number is required' };
  }

  // Remove spaces and special characters
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

  // Check if it's exactly 10 digits
  if (!/^\d{10}$/.test(cleanPhone)) {
    return { isValid: false, error: 'Phone number must be 10 digits' };
  }

  // Check if it starts with valid digits (6-9 for Indian mobile numbers)
  if (!/^[6-9]/.test(cleanPhone)) {
    return { isValid: false, error: 'Phone number must start with 6-9' };
  }

  return { isValid: true, value: cleanPhone };
};

/**
 * Validate email
 */
export const validateEmail = (email) => {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  return { isValid: true, value: email.toLowerCase() };
};

/**
 * Validate password
 */
export const validatePassword = (password, minLength = 6) => {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < minLength) {
    return { isValid: false, error: `Password must be at least ${minLength} characters` };
  }

  return { isValid: true, value: password };
};

/**
 * Validate name
 */
export const validateName = (name) => {
  if (!name) {
    return { isValid: false, error: 'Name is required' };
  }

  if (name.trim().length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters' };
  }

  if (!/^[a-zA-Z\s]+$/.test(name)) {
    return { isValid: false, error: 'Name should only contain letters' };
  }

  return { isValid: true, value: name.trim() };
};

/**
 * Validate IFSC code
 */
export const validateIFSC = (ifsc) => {
  if (!ifsc) {
    return { isValid: false, error: 'IFSC code is required' };
  }

  // IFSC format: 4 letters, 7 characters (letters or digits)
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  const cleanIFSC = ifsc.toUpperCase().trim();

  if (!ifscRegex.test(cleanIFSC)) {
    return { isValid: false, error: 'Invalid IFSC code format' };
  }

  return { isValid: true, value: cleanIFSC };
};

/**
 * Validate account number
 */
export const validateAccountNumber = (accountNumber) => {
  if (!accountNumber) {
    return { isValid: false, error: 'Account number is required' };
  }

  const cleanAccount = accountNumber.replace(/\s/g, '');

  // Account number should be 9-18 digits
  if (!/^\d{9,18}$/.test(cleanAccount)) {
    return { isValid: false, error: 'Account number must be 9-18 digits' };
  }

  return { isValid: true, value: cleanAccount };
};

/**
 * Validate PAN number
 */
export const validatePAN = (pan) => {
  if (!pan) {
    return { isValid: false, error: 'PAN number is required' };
  }

  // PAN format: 5 letters, 4 digits, 1 letter
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  const cleanPAN = pan.toUpperCase().trim();

  if (!panRegex.test(cleanPAN)) {
    return { isValid: false, error: 'Invalid PAN format (e.g., ABCDE1234F)' };
  }

  return { isValid: true, value: cleanPAN };
};

/**
 * Validate Aadhaar number
 */
export const validateAadhaar = (aadhaar) => {
  if (!aadhaar) {
    return { isValid: false, error: 'Aadhaar number is required' };
  }

  const cleanAadhaar = aadhaar.replace(/\s/g, '');

  // Aadhaar should be 12 digits
  if (!/^\d{12}$/.test(cleanAadhaar)) {
    return { isValid: false, error: 'Aadhaar number must be 12 digits' };
  }

  return { isValid: true, value: cleanAadhaar };
};

/**
 * Validate GST number
 */
export const validateGST = (gst) => {
  if (!gst) {
    return { isValid: false, error: 'GST number is required' };
  }

  // GST format: 2 digits (state code), 10 characters (PAN), 1 letter, 1 digit, 1 letter
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  const cleanGST = gst.toUpperCase().trim();

  if (!gstRegex.test(cleanGST)) {
    return { isValid: false, error: 'Invalid GST format' };
  }

  return { isValid: true, value: cleanGST };
};

/**
 * Validate pincode
 */
export const validatePincode = (pincode) => {
  if (!pincode) {
    return { isValid: false, error: 'Pincode is required' };
  }

  const cleanPincode = pincode.trim();

  // Indian pincode is 6 digits
  if (!/^\d{6}$/.test(cleanPincode)) {
    return { isValid: false, error: 'Pincode must be 6 digits' };
  }

  return { isValid: true, value: cleanPincode };
};

/**
 * Validate number (price, quantity, etc.)
 */
export const validateNumber = (value, min = 0, max = Infinity, fieldName = 'Value') => {
  if (value === '' || value === null || value === undefined) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  const num = parseFloat(value);

  if (isNaN(num)) {
    return { isValid: false, error: `${fieldName} must be a number` };
  }

  if (num < min) {
    return { isValid: false, error: `${fieldName} must be at least ${min}` };
  }

  if (num > max) {
    return { isValid: false, error: `${fieldName} must be at most ${max}` };
  }

  return { isValid: true, value: num };
};

/**
 * Validate required field
 */
export const validateRequired = (value, fieldName = 'This field') => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  return { isValid: true, value };
};

/**
 * Validate OTP
 */
export const validateOTP = (otp) => {
  if (!otp) {
    return { isValid: false, error: 'OTP is required' };
  }

  const cleanOTP = otp.trim();

  if (!/^\d{6}$/.test(cleanOTP)) {
    return { isValid: false, error: 'OTP must be 6 digits' };
  }

  return { isValid: true, value: cleanOTP };
};

/**
 * Validate date (not in past)
 */
export const validateFutureDate = (date, fieldName = 'Date') => {
  if (!date) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selectedDate < today) {
    return { isValid: false, error: `${fieldName} cannot be in the past` };
  }

  return { isValid: true, value: date };
};

/**
 * Validate vehicle number
 */
export const validateVehicleNumber = (vehicleNumber) => {
  if (!vehicleNumber) {
    return { isValid: false, error: 'Vehicle number is required' };
  }

  // Indian vehicle number format: XX00XX0000 or XX-00-XX-0000
  const cleanVehicleNumber = vehicleNumber.toUpperCase().replace(/[\s\-]/g, '');

  if (!/^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/.test(cleanVehicleNumber)) {
    return { isValid: false, error: 'Invalid vehicle number format' };
  }

  return { isValid: true, value: vehicleNumber.toUpperCase() };
};

/**
 * Batch validate multiple fields
 */
export const validateForm = (validations) => {
  const errors = {};
  let isValid = true;

  Object.keys(validations).forEach((field) => {
    const validation = validations[field];
    if (!validation.isValid) {
      errors[field] = validation.error;
      isValid = false;
    }
  });

  return { isValid, errors };
};

// ============================================
// Simple string-returning validation helpers
// Return null if valid, error string if invalid
// ============================================

/**
 * Simple phone validation (returns error string or null)
 */
export const simpleValidatePhone = (phone) => {
  const result = validatePhone(phone);
  return result.isValid ? null : result.error;
};

/**
 * Simple password validation (returns error string or null)
 */
export const simpleValidatePassword = (password, minLength = 6) => {
  const result = validatePassword(password, minLength);
  return result.isValid ? null : result.error;
};

/**
 * Simple name validation (returns error string or null)
 */
export const simpleValidateName = (name) => {
  const result = validateName(name);
  return result.isValid ? null : result.error;
};

/**
 * Simple email validation (returns error string or null)
 */
export const simpleValidateEmail = (email) => {
  const result = validateEmail(email);
  return result.isValid ? null : result.error;
};

/**
 * Simple required validation (returns error string or null)
 */
export const simpleValidateRequired = (value, fieldName = 'This field') => {
  const result = validateRequired(value, fieldName);
  return result.isValid ? null : result.error;
};
