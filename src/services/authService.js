/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import apiService from './apiService';
import { API_ENDPOINTS } from '../config/api';
import storageService from './storageService';

class AuthService {
  /**
   * Register new user
   */
  async register(userData) {
    const response = await apiService.post(API_ENDPOINTS.AUTH.REGISTER, userData);
    return response;
  }

  /**
   * Login with phone and password
   */
  async login(phone, password) {
    const response = await apiService.post(API_ENDPOINTS.AUTH.LOGIN, {
      phone,
      password,
    });

    if (response.token) {
      await storageService.saveToken(response.token);
      if (response.user) {
        await storageService.saveUser(response.user);
      }
    }

    return response;
  }

  /**
   * Send OTP to phone number
   */
  async sendOTP(phone) {
    const response = await apiService.post(API_ENDPOINTS.AUTH.SEND_OTP, {
      phone,
    });
    return response;
  }

  /**
   * Verify OTP and login
   */
  async verifyOTP(phone, otp) {
    const response = await apiService.post(API_ENDPOINTS.AUTH.VERIFY_OTP, {
      phone,
      otp,
    });

    if (response.token) {
      await storageService.saveToken(response.token);
      if (response.user) {
        await storageService.saveUser(response.user);
      }
    }

    return response;
  }

  /**
   * Get user profile
   */
  async getProfile() {
    const response = await apiService.get(API_ENDPOINTS.AUTH.PROFILE);
    if (response.user) {
      await storageService.saveUser(response.user);
    }
    return response;
  }

  /**
   * Update bank details
   */
  async updateBankDetails(bankDetails) {
    const response = await apiService.put(API_ENDPOINTS.AUTH.UPDATE_BANK, bankDetails);
    if (response.user) {
      await storageService.saveUser(response.user);
    }
    return response;
  }

  /**
   * Submit KYC documents
   */
  async submitKYC(formData) {
    const response = await apiService.upload(API_ENDPOINTS.AUTH.SUBMIT_KYC, formData);
    return response;
  }

  /**
   * Get my KYC status
   */
  async getMyKYC() {
    const response = await apiService.get(API_ENDPOINTS.AUTH.MY_KYC);
    return response;
  }

  /**
   * Logout user
   */
  async logout() {
    await storageService.clearAll();
    return true;
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    const token = await storageService.getToken();
    return !!token;
  }

  /**
   * Get current user from storage
   */
  async getCurrentUser() {
    return await storageService.getUser();
  }

  /**
   * Refresh user profile
   */
  async refreshProfile() {
    try {
      return await this.getProfile();
    } catch (error) {
      console.error('Error refreshing profile:', error);
      return null;
    }
  }
}

export default new AuthService();
