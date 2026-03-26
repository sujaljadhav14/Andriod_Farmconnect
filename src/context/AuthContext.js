/**
 * Authentication Context
 * Manages authentication state and provides auth-related functions
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';
import storageService from '../services/storageService';
import socketService from '../services/socketService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  // Initialize auth state on app launch
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        storageService.getToken(),
        storageService.getUser(),
      ]);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
        setIsAuthenticated(true);

        // Connect socket for authenticated user
        try {
          await socketService.connect();
        } catch (error) {
          console.error('Socket connection failed:', error);
        }

        // Refresh user profile in background
        refreshUserProfile();
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setInitializing(false);
      setLoading(false);
    }
  };

  const login = async (phone, password) => {
    try {
      setLoading(true);
      const response = await authService.login(phone, password);

      if (response.token && response.user) {
        setToken(response.token);
        setUser(response.user);
        setIsAuthenticated(true);

        // Connect socket after login
        try {
          await socketService.connect();
        } catch (error) {
          console.error('Socket connection failed:', error);
        }

        return { success: true, user: response.user };
      }

      throw new Error(response.message || 'Login failed');
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authService.register(userData);
      return { success: true, message: response.message };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const loginWithOTP = async (phone, otp) => {
    try {
      setLoading(true);
      const response = await authService.verifyOTP(phone, otp);

      if (response.token && response.user) {
        setToken(response.token);
        setUser(response.user);
        setIsAuthenticated(true);

        // Connect socket after login
        try {
          await socketService.connect();
        } catch (error) {
          console.error('Socket connection failed:', error);
        }

        return { success: true, user: response.user };
      }

      throw new Error(response.message || 'OTP verification failed');
    } catch (error) {
      console.error('OTP login error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const sendOTP = async (phone) => {
    try {
      setLoading(true);
      const response = await authService.sendOTP(phone);
      return { success: true, message: response.message };
    } catch (error) {
      console.error('Send OTP error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);

      // Disconnect socket
      socketService.disconnect();

      // Clear storage
      await authService.logout();

      // Clear state
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const refreshUserProfile = async () => {
    try {
      const response = await authService.getProfile();
      if (response.user) {
        setUser(response.user);
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
      // If token is invalid, logout
      if (error.message.includes('Session expired') || error.message.includes('Unauthorized')) {
        await logout();
      }
    }
  };

  const updateProfile = async (updates) => {
    try {
      // Optimistically update UI
      setUser((prev) => ({ ...prev, ...updates }));

      // Save to storage
      await storageService.saveUser({ ...user, ...updates });

      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      // Revert on error
      refreshUserProfile();
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    initializing,
    login,
    register,
    loginWithOTP,
    sendOTP,
    logout,
    refreshUserProfile,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
