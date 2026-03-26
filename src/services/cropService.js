/**
 * Crop Service
 * Handles all crop-related API calls
 * NO DEMO DATA - All data from real backend
 */

import apiService from './apiService';
import { API_ENDPOINTS } from '../config/api';

class CropService {
  /**
   * Get farmer's crops
   */
  async getMyCrops() {
    const response = await apiService.get(API_ENDPOINTS.CROPS.MY_CROPS);
    return response;
  }

  /**
   * Get all available crops (for traders)
   */
  async getAvailableCrops(filters = {}) {
    const queryParams = new URLSearchParams();

    if (filters.category) queryParams.append('category', filters.category);
    if (filters.minPrice) queryParams.append('minPrice', filters.minPrice);
    if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice);
    if (filters.quality) queryParams.append('quality', filters.quality);
    if (filters.location) queryParams.append('location', filters.location);
    if (filters.search) queryParams.append('search', filters.search);

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.CROPS.AVAILABLE}?${queryString}`
      : API_ENDPOINTS.CROPS.AVAILABLE;

    const response = await apiService.get(endpoint);
    return response;
  }

  /**
   * Get crop details by ID
   */
  async getCropDetails(cropId) {
    const response = await apiService.get(API_ENDPOINTS.CROPS.DETAILS(cropId));
    return response;
  }

  /**
   * Add a new crop (farmer only)
   */
  async addCrop(cropData, imageFile) {
    const formData = new FormData();

    // Add crop data fields
    formData.append('cropName', cropData.cropName);
    formData.append('category', cropData.category);
    formData.append('variety', cropData.variety || '');
    formData.append('quantity', cropData.quantity);
    formData.append('unit', cropData.unit || 'kg');
    formData.append('pricePerUnit', cropData.pricePerUnit);
    formData.append('expectedPricePerUnit', cropData.expectedPricePerUnit || cropData.pricePerUnit);
    formData.append('quality', cropData.quality);
    formData.append('harvestDate', cropData.harvestDate || '');
    formData.append('expectedHarvestDate', cropData.expectedHarvestDate || '');
    formData.append('location', cropData.location || '');

    // Add location details
    if (cropData.locationDetails) {
      formData.append('village', cropData.locationDetails.village || '');
      formData.append('tehsil', cropData.locationDetails.tehsil || '');
      formData.append('district', cropData.locationDetails.district || '');
      formData.append('state', cropData.locationDetails.state || '');
      formData.append('pincode', cropData.locationDetails.pincode || '');
    }

    // Add image if provided
    if (imageFile) {
      formData.append('cropImage', {
        uri: imageFile.uri,
        type: imageFile.type || 'image/jpeg',
        name: imageFile.name || `crop_${Date.now()}.jpg`,
      });
    }

    const response = await apiService.upload(API_ENDPOINTS.CROPS.ADD, formData);
    return response;
  }

  /**
   * Update an existing crop
   */
  async updateCrop(cropId, cropData, imageFile) {
    const formData = new FormData();

    // Add crop data fields if provided
    if (cropData.cropName) formData.append('cropName', cropData.cropName);
    if (cropData.category) formData.append('category', cropData.category);
    if (cropData.variety !== undefined) formData.append('variety', cropData.variety);
    if (cropData.quantity !== undefined) formData.append('quantity', cropData.quantity);
    if (cropData.unit) formData.append('unit', cropData.unit);
    if (cropData.pricePerUnit !== undefined) formData.append('pricePerUnit', cropData.pricePerUnit);
    if (cropData.quality) formData.append('quality', cropData.quality);
    if (cropData.harvestDate) formData.append('harvestDate', cropData.harvestDate);
    if (cropData.status) formData.append('status', cropData.status);

    // Add image if provided
    if (imageFile) {
      formData.append('cropImage', {
        uri: imageFile.uri,
        type: imageFile.type || 'image/jpeg',
        name: imageFile.name || `crop_${Date.now()}.jpg`,
      });
    }

    const response = await apiService.upload(
      API_ENDPOINTS.CROPS.UPDATE(cropId),
      formData
    );
    return response;
  }

  /**
   * Delete a crop
   */
  async deleteCrop(cropId) {
    const response = await apiService.delete(API_ENDPOINTS.CROPS.DELETE(cropId));
    return response;
  }

  /**
   * Update crop status
   */
  async updateCropStatus(cropId, status) {
    const response = await apiService.put(
      API_ENDPOINTS.CROPS.STATUS(cropId),
      { status }
    );
    return response;
  }

  /**
   * Normalize crop data for display
   */
  normalizeCrop(crop) {
    return {
      id: crop._id || crop.id,
      cropName: crop.cropName || crop.name || 'Unnamed Crop',
      category: crop.category || 'Other',
      variety: crop.variety || '',
      quantity: crop.quantity || 0,
      unit: crop.unit || 'kg',
      pricePerUnit: crop.pricePerUnit || crop.price || 0,
      expectedPricePerUnit: crop.expectedPricePerUnit || crop.pricePerUnit || 0,
      quality: crop.quality || crop.qualityGrade || 'N/A',
      status: crop.status || 'Available',
      availableQuantity: crop.availableQuantity || (crop.quantity - (crop.reservedQuantity || 0)),
      reservedQuantity: crop.reservedQuantity || 0,
      harvestDate: crop.harvestDate,
      expectedHarvestDate: crop.expectedHarvestDate,
      cultivationDate: crop.cultivationDate,
      location: crop.location || '',
      locationDetails: crop.locationDetails || {},
      cropImage: crop.cropImage || null,
      images: crop.images || [],
      farmer: crop.farmerId || null,
      createdAt: crop.createdAt,
      updatedAt: crop.updatedAt,
    };
  }

  /**
   * Normalize array of crops
   */
  normalizeCrops(crops) {
    if (!Array.isArray(crops)) return [];
    return crops.map(crop => this.normalizeCrop(crop));
  }
}

export default new CropService();
