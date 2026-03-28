/**
 * Vehicle Service
 * Handles transporter vehicle related API calls
 */

import apiService from './apiService';
import { API_ENDPOINTS } from '../config/api';

class VehicleService {
  async getMyVehicles() {
    return apiService.get(API_ENDPOINTS.VEHICLES.MY_VEHICLES);
  }

  async addVehicle(vehicleData) {
    return apiService.post(API_ENDPOINTS.VEHICLES.ADD, vehicleData);
  }

  async updateVehicle(vehicleId, vehicleData) {
    return apiService.put(API_ENDPOINTS.VEHICLES.UPDATE(vehicleId), vehicleData);
  }

  async deleteVehicle(vehicleId) {
    return apiService.delete(API_ENDPOINTS.VEHICLES.DELETE(vehicleId));
  }

  async updateAvailability(vehicleId, availabilityStatus) {
    return apiService.put(API_ENDPOINTS.VEHICLES.AVAILABILITY(vehicleId), {
      availabilityStatus,
    });
  }

  async getAvailableOrders() {
    return apiService.get(API_ENDPOINTS.VEHICLES.AVAILABLE_ORDERS);
  }

  async suggestForOrder(orderId) {
    return apiService.get(API_ENDPOINTS.VEHICLES.SUGGEST(orderId));
  }

  normalizeVehicle(vehicle) {
    const id = vehicle?._id || vehicle?.id || '';

    return {
      id,
      vehicleType: vehicle?.vehicleType || 'Other',
      vehicleNumber: vehicle?.vehicleNumber || '',
      capacity: Number(vehicle?.capacity || 0),
      capacityUnit: vehicle?.capacityUnit || 'kg',
      model: vehicle?.model || '',
      year: vehicle?.year || '',
      availabilityStatus: vehicle?.availabilityStatus || 'available',
      isActive: vehicle?.isActive !== false,
      createdAt: vehicle?.createdAt || null,
      updatedAt: vehicle?.updatedAt || null,
    };
  }

  normalizeVehicles(vehicles) {
    if (!Array.isArray(vehicles)) return [];
    return vehicles.map((vehicle) => this.normalizeVehicle(vehicle));
  }

  getAvailabilityLabel(status) {
    switch ((status || '').toLowerCase()) {
      case 'available':
        return 'Available';
      case 'on_delivery':
        return 'On Delivery';
      case 'maintenance':
        return 'Maintenance';
      case 'inactive':
        return 'Inactive';
      default:
        return 'Unknown';
    }
  }

  getAvailabilityColor(status) {
    switch ((status || '').toLowerCase()) {
      case 'available':
        return '#2E7D32';
      case 'on_delivery':
        return '#1565C0';
      case 'maintenance':
        return '#E65100';
      case 'inactive':
        return '#757575';
      default:
        return '#546E7A';
    }
  }
}

export default new VehicleService();
