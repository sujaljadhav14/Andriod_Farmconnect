/**
 * Authentication Context
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

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        storageService.getToken(),
        storageService.getUser(),
      ]);
      console.log("INIT AUTH USER:", storedUser);
      if (storedToken && storedUser) {
  setToken(storedToken);
  setUser(storedUser);
  setIsAuthenticated(true); 
}
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setInitializing(false);
      setLoading(false);
    }
  };

  // 🔥 Role-based screen helper
  const getScreenByRole = (role) => {
    const r = role?.toLowerCase();

    if (r === 'farmer') return 'FarmerMain';
    if (r === 'trader') return 'TraderMain';
    if (r === 'transport') return 'TransportMain';
    if (r === 'admin') return 'AdminMain';

    return 'FarmerMain'; // fallback
  };

  const login = async (phone, password) => {
    try {
      setLoading(true);
      const response = await authService.login(phone, password);

      if (response.token && response.user) {
        setToken(response.token);
        setUser(response.user);
        setIsAuthenticated(true);

        try {
          await socketService.connect();
        } catch (err) {
          console.error('Socket error:', err);
        }

        return {
          success: true,
          user: response.user,
          dashboardScreen: getScreenByRole(response.user.role),
        };
      }

      throw new Error(response.message || 'Login failed');
    } catch (error) {
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

        try {
          await socketService.connect();
        } catch (err) {
          console.error('Socket error:', err);
        }

        return {
          success: true,
          user: response.user,
          dashboardScreen: getScreenByRole(response.user.role),
        };
      }

      throw new Error('OTP failed');
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const sendOTP = async (phone) => {
    try {
      setLoading(true);
      const res = await authService.sendOTP(phone);
      return { success: true, message: res.message };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
  try {
    setLoading(true);

    socketService.disconnect();

    // ✅ CORRECT FUNCTIONS
    await storageService.removeToken();
    await storageService.removeUser();

    setUser(null);
    setToken(null);
    setIsAuthenticated(false);

    console.log("LOGOUT SUCCESS");

  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    setLoading(false);
  }
};

  const refreshUserProfile = async () => {
    try {
      const res = await authService.getProfile();
      if (res.user) setUser(res.user);
    } catch (error) {
      if (error.message.includes('Unauthorized')) {
        await logout();
      }
    }
  };

  const updateProfile = async (updates) => {
    try {
      setUser((prev) => ({ ...prev, ...updates }));
      await storageService.saveUser({ ...user, ...updates });
      return { success: true };
    } catch (error) {
      await refreshUserProfile();
      return { success: false, error: error.message };
    }
  };

  // ✅ THIS FIXES YOUR ERROR
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
    getScreenByRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// ✅ ONLY ONE EXPORT
export default AuthProvider;