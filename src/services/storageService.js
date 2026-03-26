/**
 * Storage Service
 * AsyncStorage wrapper for managing app data persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/constants';

class StorageService {
  // Auth Token Management
  async saveToken(token) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      return true;
    } catch (error) {
      console.error('Error saving token:', error);
      return false;
    }
  }

  async getToken() {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  async removeToken() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      return true;
    } catch (error) {
      console.error('Error removing token:', error);
      return false;
    }
  }

  // User Data Management
  async saveUser(userData) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Error saving user data:', error);
      return false;
    }
  }

  async getUser() {
    try {
      const userDataString = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (userDataString) {
        return JSON.parse(userDataString);
      }
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  async removeUser() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
      return true;
    } catch (error) {
      console.error('Error removing user data:', error);
      return false;
    }
  }

  // Language Preference
  async saveLanguage(languageCode) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, languageCode);
      return true;
    } catch (error) {
      console.error('Error saving language:', error);
      return false;
    }
  }

  async getLanguage() {
    try {
      const language = await AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE);
      return language || 'en'; // Default to English
    } catch (error) {
      console.error('Error getting language:', error);
      return 'en';
    }
  }

  // FCM Token (for push notifications)
  async saveFCMToken(fcmToken) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FCM_TOKEN, fcmToken);
      return true;
    } catch (error) {
      console.error('Error saving FCM token:', error);
      return false;
    }
  }

  async getFCMToken() {
    try {
      const fcmToken = await AsyncStorage.getItem(STORAGE_KEYS.FCM_TOKEN);
      return fcmToken;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  // Generic Storage Methods
  async setItem(key, value) {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, stringValue);
      return true;
    } catch (error) {
      console.error(`Error saving item ${key}:`, error);
      return false;
    }
  }

  async getItem(key) {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        try {
          return JSON.parse(value);
        } catch {
          return value; // Return as string if not JSON
        }
      }
      return null;
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return null;
    }
  }

  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
      return false;
    }
  }

  // Clear All Data (Logout)
  async clearAll() {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.FCM_TOKEN,
      ]);
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }

  // Get all keys
  async getAllKeys() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys;
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  }
}

export default new StorageService();
