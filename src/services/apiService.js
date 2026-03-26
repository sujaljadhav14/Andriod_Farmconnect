/**
 * API Service
 * Base service for all API requests with authentication, error handling, and retry logic
 */

import { API_BASE_URL, API_TIMEOUT, RETRY_CONFIG } from '../config/api';
import { ERROR_MESSAGES } from '../config/constants';
import storageService from './storageService';

class APIService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.timeout = API_TIMEOUT;
  }

  /**
   * Get authentication headers
   */
  async getHeaders(isMultipart = false) {
    const token = await storageService.getToken();
    const headers = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!isMultipart) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  }

  /**
   * Handle API response
   */
  async handleResponse(response) {
    const contentType = response.headers.get('content-type');
    const isJSON = contentType && contentType.includes('application/json');

    if (response.status === 401) {
      // Unauthorized - clear auth and redirect to login
      await this.handleUnauthorized();
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
    }

    if (!response.ok) {
      const error = isJSON ? await response.json() : { message: response.statusText };
      throw new Error(error.message || ERROR_MESSAGES.SERVER_ERROR);
    }

    return isJSON ? await response.json() : await response.text();
  }

  /**
   * Handle unauthorized (401) response
   */
  async handleUnauthorized() {
    await storageService.clearAll();
    // Navigation will be handled by AuthContext
  }

  /**
   * Retry logic for failed requests
   */
  async retryRequest(requestFn, retries = 0) {
    try {
      return await requestFn();
    } catch (error) {
      if (retries < RETRY_CONFIG.maxRetries) {
        const delay = RETRY_CONFIG.retryDelay * Math.pow(2, retries); // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.retryRequest(requestFn, retries + 1);
      }
      throw error;
    }
  }

  /**
   * Make API request with timeout
   */
  async requestWithTimeout(url, options) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please try again.');
      }
      throw error;
    }
  }

  /**
   * Main request method
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.getHeaders(options.isMultipart);

    try {
      const requestFn = async () => {
        const response = await this.requestWithTimeout(url, {
          ...options,
          headers: { ...headers, ...options.headers },
        });
        return this.handleResponse(response);
      };

      // Retry only for retriable errors
      return await requestFn();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);

      // Check if error is network-related
      if (!error.message || error.message === 'Network request failed') {
        throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
      }

      throw error;
    }
  }

  /**
   * GET request
   */
  async get(endpoint) {
    return this.request(endpoint, {
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * PATCH request
   */
  async patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  /**
   * Upload file (multipart/form-data)
   */
  async upload(endpoint, formData) {
    return this.request(endpoint, {
      method: 'POST',
      body: formData,
      isMultipart: true,
    });
  }

  /**
   * Download file
   */
  async download(endpoint) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.getHeaders();

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      return await response.blob();
    } catch (error) {
      console.error(`Download Error [${endpoint}]:`, error);
      throw error;
    }
  }

  /**
   * Check if backend is reachable
   */
  async checkConnection() {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        timeout: 5000,
      });
      return response.ok;
    } catch (error) {
      console.error('Connection check failed:', error);
      return false;
    }
  }
}

export default new APIService();
