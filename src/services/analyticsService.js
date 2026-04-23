import apiService from './apiService';
import { API_ENDPOINTS } from '../config/api';

class AnalyticsService {
  async getPriceTrend(days = 14) {
    const endpoint = `${API_ENDPOINTS.ANALYTICS.PRICE_TREND}?days=${encodeURIComponent(days)}`;
    const response = await apiService.get(endpoint);

    return {
      days: Number(response?.data?.days || days),
      points: Array.isArray(response?.data?.points) ? response.data.points : [],
      categoryAverages: Array.isArray(response?.data?.categoryAverages) ? response.data.categoryAverages : [],
      generatedAt: response?.data?.generatedAt || null,
    };
  }

  async getTopCrops() {
    const response = await apiService.get(API_ENDPOINTS.ANALYTICS.TOP_CROPS);

    return {
      summary: response?.data?.summary || {
        totalOrders: 0,
        completedOrders: 0,
        activeOrders: 0,
        totalSpend: 0,
        averageOrderValue: 0,
      },
      topCrops: Array.isArray(response?.data?.topCrops) ? response.data.topCrops : [],
      topFarmers: Array.isArray(response?.data?.topFarmers) ? response.data.topFarmers : [],
    };
  }

  async getFarmerNetwork() {
    const response = await apiService.get(API_ENDPOINTS.ANALYTICS.FARMER_NETWORK);
    return Array.isArray(response?.data) ? response.data : [];
  }
}

export default new AnalyticsService();
