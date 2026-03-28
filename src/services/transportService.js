/**
 * Transport Service
 * Handles transport and delivery related API calls
 */

import apiService from './apiService';
import { API_ENDPOINTS } from '../config/api';

const formatStatusLabel = (status) => {
  if (!status) return 'Unknown';

  return status
    .toString()
    .replace(/_/g, ' ')
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const withQueryParams = (endpoint, params = {}) => {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

  return query ? `${endpoint}?${query}` : endpoint;
};

class TransportService {
  async getAvailableOrders(filters = {}) {
    const endpoint = withQueryParams(API_ENDPOINTS.TRANSPORT.AVAILABLE, filters);
    return apiService.get(endpoint);
  }

  async acceptDelivery(orderId, payload = {}) {
    return apiService.put(API_ENDPOINTS.TRANSPORT.ACCEPT(orderId), payload);
  }

  async getMyDeliveries(options = {}) {
    const { history = false, status } = options;

    if (history) {
      return apiService.get(API_ENDPOINTS.TRANSPORT.HISTORY);
    }

    const endpoint = withQueryParams(API_ENDPOINTS.TRANSPORT.MY_DELIVERIES, {
      status,
    });
    return apiService.get(endpoint);
  }

  async updateDeliveryStatus(deliveryId, status, note = '') {
    return apiService.put(API_ENDPOINTS.TRANSPORT.STATUS(deliveryId), {
      status,
      note,
    });
  }

  async getDeliveryDetails(deliveryId) {
    return apiService.get(API_ENDPOINTS.TRANSPORT.DETAILS(deliveryId));
  }

  normalizeDelivery(order) {
    const id = order?._id || order?.id || '';
    const rawStatus = order?.status || 'unknown';

    return {
      id,
      orderNumber: order?.orderNumber || `ORD-${id.slice(-6).toUpperCase()}`,
      status: rawStatus,
      statusLabel: formatStatusLabel(rawStatus),

      cropName: order?.cropId?.cropName || order?.crop?.cropName || 'Unknown Crop',
      cropCategory: order?.cropId?.category || order?.crop?.category || '',
      cropImage: order?.cropId?.images?.[0] || order?.crop?.cropImage || '',

      quantity: Number(order?.quantity || 0),
      unit: order?.unit || 'kg',
      totalAmount: Number(order?.totalAmount || 0),
      paymentStatus: order?.paymentStatus || 'pending',

      pickupCity:
        order?.farmerId?.location?.city ||
        order?.pickupDetails?.city ||
        order?.location?.city ||
        '',
      pickupAddress:
        order?.farmerId?.location?.address ||
        order?.pickupDetails?.address ||
        '',

      deliveryCity: order?.deliveryDetails?.city || '',
      deliveryAddress: order?.deliveryDetails?.address || '',
      scheduledDate: order?.deliveryDetails?.scheduledDate || null,
      deliveredAt: order?.deliveryDetails?.actualDate || null,

      farmer: {
        id: order?.farmerId?._id || order?.farmerId?.id || '',
        name: order?.farmerId?.name || 'Farmer',
        phone: order?.farmerId?.phone || '',
      },

      trader: {
        id: order?.traderId?._id || order?.traderId?.id || '',
        name: order?.traderId?.name || 'Trader',
        phone: order?.traderId?.phone || '',
      },

      transport: {
        driverId: order?.transportDetails?.driverId?._id || order?.transportDetails?.driverId || '',
        vehicleNumber: order?.transportDetails?.vehicleNumber || '',
        pickupTime: order?.transportDetails?.pickupTime || null,
        deliveryTime: order?.transportDetails?.deliveryTime || null,
      },

      transportNote: order?.notes?.transport || '',
      createdAt: order?.createdAt || null,
      updatedAt: order?.updatedAt || null,
    };
  }

  normalizeDeliveries(orders) {
    if (!Array.isArray(orders)) return [];
    return orders.map((order) => this.normalizeDelivery(order));
  }

  getStatusColor(status) {
    switch ((status || '').toLowerCase()) {
      case 'ready_for_pickup':
        return '#E65100';
      case 'in_transit':
        return '#1565C0';
      case 'delivered':
        return '#2E7D32';
      case 'completed':
        return '#1B5E20';
      case 'cancelled':
        return '#757575';
      default:
        return '#546E7A';
    }
  }
}

export default new TransportService();
