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
    this.serverURL = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;
  }

  buildURL(endpoint = '') {
    if (/^https?:\/\//i.test(endpoint)) {
      return endpoint;
    }

    let normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    if (this.baseURL.endsWith('/api') && normalizedEndpoint.startsWith('/api/')) {
      normalizedEndpoint = normalizedEndpoint.slice(4);
    }

    return `${this.baseURL}${normalizedEndpoint}`;
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

    console.log('🔍 Response Headers:', {
      status: response.status,
      statusText: response.statusText,
      contentType: contentType,
      isJSON: isJSON,
    });

    if (response.status === 401) {
      // Unauthorized - clear auth and redirect to login
      await this.handleUnauthorized();
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
    }

    if (!response.ok) {
      let errorMsg = response.statusText;
      if (isJSON) {
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorData.error || response.statusText;
          console.error('📄 JSON Error Response:', errorData);
        } catch (e) {
          console.error('Failed to parse JSON error:', e);
          errorMsg = await response.text();
        }
      } else {
        try {
          errorMsg = await response.text();
          console.error('📄 Text Error Response:', errorMsg);
        } catch (e) {
          console.error('Failed to read response text:', e);
          errorMsg = response.statusText;
        }
      }
      throw new Error(errorMsg || ERROR_MESSAGES.SERVER_ERROR);
    }

    if (isJSON) {
      return await response.json();
    } else {
      return await response.text();
    }
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
    const url = this.buildURL(endpoint);
    console.log("🌐 API CALL:", url);
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
      console.error(`API Error [${endpoint}]:`, {
        url,
        method: options.method || 'GET',
        error: error.message,
        type: error.name,
        isNetworkError: error.message === 'Network request failed' || error.name === 'TypeError',
        stack: error.stack
      });

      // Check if error is network-related
      if (!error.message || error.message === 'Network request failed' || error.name === 'TypeError') {
        console.error('🚨 Network Error Details:', {
          baseURL: this.baseURL,
          endpoint,
          fullURL: url,
          isMultipart: options.isMultipart,
          hasFormData: options.body instanceof FormData
        });
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
    const url = this.buildURL(endpoint);
    console.log('📤 Upload Request:', {
      endpoint,
      url,
      formDataKeys: formData._parts ? formData._parts.map(part => part[0]) : 'No _parts found'
    });

    try {
      const token = await storageService.getToken();
      console.log('🔐 Auth Token Present:', !!token);

      if (!token) {
        console.warn('⚠️ No auth token found - request will fail authentication');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        console.log('🌐 Sending fetch request to:', url);

        const response = await fetch(url, {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        console.log('📥 Response received:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          contentType: response.headers.get('content-type'),
        });

        const result = await this.handleResponse(response);
        console.log('✅ Upload Success:', result);
        return result;
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('💥 Fetch/Response error:', {
          name: error.name,
          message: error.message,
          code: error.code,
          stack: error.stack,
        });
        throw error;
      }
    } catch (error) {
      console.error('❌ Upload Failed:', {
        endpoint,
        errorName: error?.name,
        errorMessage: error?.message,
        errorCode: error?.code,
        responseStatus: error?.status,
        isNetworkError: error?.name === 'TypeError' || error?.message?.includes('Network'),
      });

      // Log full error object for debugging
      console.error('💾 Full error object:', JSON.stringify({
        ...error,
        name: error?.name,
        message: error?.message,
        code: error?.code,
      }, null, 2));

      // Re-throw with more informative error message
      if (!error?.message) {
        throw new Error('Upload failed: Unknown error occurred');
      }
      if (error.message === 'Network request failed' || error.name === 'TypeError') {
        throw new Error('Network error. Please check your connection and try again.');
      }
      throw error;
    }
  }

  /**
   * Download file
   */
  async download(endpoint) {
    const url = this.buildURL(endpoint);
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`${this.serverURL}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Connection check failed:', error);
      return false;
    }
  }

  /**
   * Test specific API endpoint connectivity
   */
  async testEndpoint(endpoint, method = 'GET') {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const url = this.buildURL(endpoint);
      console.log(`🔍 Testing endpoint: ${method} ${url}`);
      const headers = await this.getHeaders();
      const response = await fetch(url, {
        method,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(`✅ Endpoint test result:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      return {
        success: response.ok,
        status: response.status,
        statusText: response.statusText
      };
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`❌ Endpoint test failed:`, {
        endpoint,
        error: error.message,
        type: error.name
      });
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new APIService();
