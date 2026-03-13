import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

const STORAGE_KEY = '@farmconnect_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        if (json) {
          const parsed = JSON.parse(json);
          setUser(parsed);
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const saveUser = async (userData) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  };

  const login = async ({ phone, password }) => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (!json) {
        return { success: false, message: 'No account found. Please register first.' };
      }

      const stored = JSON.parse(json);
      if (stored.phone !== phone || stored.password !== password) {
        return { success: false, message: 'Invalid phone or password.' };
      }

      setUser(stored);
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, message: 'An unexpected error occurred.' };
    }
  };

  const register = async ({ fullName, role, phone, password, language }) => {
    const userData = {
      fullName,
      role,
      phone,
      password,
      language,
    };
    await saveUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Logout failed:', error);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
