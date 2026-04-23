import apiService from './apiService';
import { API_ENDPOINTS } from '../config/api';

class AdminService {
  buildQuery(params = {}) {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '' || value === 'all') return;
      query.append(key, String(value));
    });

    const queryString = query.toString();
    return queryString ? `?${queryString}` : '';
  }

  async getStats() {
    try {
      const response = await apiService.get(API_ENDPOINTS.ADMIN.STATS);
      console.log('📊 Admin stats response:', response);
      return response?.data || {};
    } catch (error) {
      console.error('❌ Failed to fetch admin stats:', error);
      throw error;
    }
  }

  async getUsers(filters = {}) {
    const response = await apiService.get(`${API_ENDPOINTS.ADMIN.USERS}${this.buildQuery(filters)}`);
    return {
      data: Array.isArray(response?.data) ? response.data : [],
      pagination: response?.pagination || null,
    };
  }

  async getUserDetails(userId) {
    const response = await apiService.get(API_ENDPOINTS.ADMIN.USER_DETAILS(userId));
    return response?.data || null;
  }

  async suspendUser(userId, reason = '') {
    const response = await apiService.put(API_ENDPOINTS.ADMIN.SUSPEND_USER(userId), { reason });
    return response?.data || null;
  }

  async activateUser(userId, reason = '') {
    const response = await apiService.put(API_ENDPOINTS.ADMIN.ACTIVATE_USER(userId), { reason });
    return response?.data || null;
  }

  async banUser(userId, reason = '') {
    const response = await apiService.put(API_ENDPOINTS.ADMIN.BAN_USER(userId), { reason });
    return response?.data || null;
  }

  // ✅ KYC Management Methods
  async getAllKYC() {
    try {
      const response = await apiService.get(API_ENDPOINTS.ADMIN.ALL_KYC);
      console.log('📋 KYC records:', response?.data);
      return {
        data: Array.isArray(response?.data) ? response.data : [],
        total: response?.total || 0,
      };
    } catch (error) {
      console.error('❌ Failed to fetch KYC records:', error);
      throw error;
    }
  }

  async approveKYC(kycId) {
    try {
      const response = await apiService.put(API_ENDPOINTS.ADMIN.KYC_APPROVE(kycId), {});
      console.log('✅ KYC approved:', response?.data);
      return response?.data || null;
    } catch (error) {
      console.error('❌ Failed to approve KYC:', error);
      throw error;
    }
  }

  async rejectKYC(kycId, reason = '') {
    try {
      const response = await apiService.put(API_ENDPOINTS.ADMIN.KYC_REJECT(kycId), { reason });
      console.log('❌ KYC rejected:', response?.data);
      return response?.data || null;
    } catch (error) {
      console.error('❌ Failed to reject KYC:', error);
      throw error;
    }
  }

  async getOrders(filters = {}) {
    const response = await apiService.get(`${API_ENDPOINTS.ADMIN.ALL_ORDERS}${this.buildQuery(filters)}`);
    return {
      data: Array.isArray(response?.data) ? response.data : [],
      pagination: response?.pagination || null,
    };
  }

  async getCrops(filters = {}) {
    const response = await apiService.get(`${API_ENDPOINTS.ADMIN.ALL_CROPS}${this.buildQuery(filters)}`);
    return {
      data: Array.isArray(response?.data) ? response.data : [],
      pagination: response?.pagination || null,
    };
  }

  async getProposals(filters = {}) {
    const response = await apiService.get(`${API_ENDPOINTS.ADMIN.ALL_PROPOSALS}${this.buildQuery(filters)}`);
    return {
      data: Array.isArray(response?.data) ? response.data : [],
      pagination: response?.pagination || null,
    };
  }

  async getDeliveries(filters = {}) {
    const response = await apiService.get(`${API_ENDPOINTS.ADMIN.ALL_DELIVERIES}${this.buildQuery(filters)}`);
    return {
      data: Array.isArray(response?.data) ? response.data : [],
      pagination: response?.pagination || null,
    };
  }

  async getDisputes(filters = {}) {
    const response = await apiService.get(`${API_ENDPOINTS.ADMIN.DISPUTES}${this.buildQuery(filters)}`);
    return {
      data: Array.isArray(response?.data) ? response.data : [],
      pagination: response?.pagination || null,
    };
  }

  async updateDisputeStatus(disputeId, payload) {
    const response = await apiService.put(API_ENDPOINTS.ADMIN.UPDATE_DISPUTE_STATUS(disputeId), payload);
    return response?.data || null;
  }

  async getSettings() {
    const response = await apiService.get(API_ENDPOINTS.ADMIN.SETTINGS);
    return response?.data || {};
  }

  async updateSettings(payload) {
    const response = await apiService.put(API_ENDPOINTS.ADMIN.SETTINGS, payload);
    return response?.data || {};
  }
}

export default new AdminService();
