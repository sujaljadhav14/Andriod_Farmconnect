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
  async getMyCrops(farmerId) {
    // Pass farmerId as query parameter
    const endpoint = farmerId 
      ? `${API_ENDPOINTS.CROPS.MY_CROPS}?farmerId=${farmerId}`
      : API_ENDPOINTS.CROPS.MY_CROPS;
    const response = await apiService.get(endpoint);
    return response;
  }

  /**
   * Get all available crops (for traders)
   */
  async getAvailableCrops(filters = {}) {
    try {
      const queryParams = new URLSearchParams();

      // Only add filters if they have values
      if (filters.category && filters.category !== '') queryParams.append('category', filters.category);
      if (filters.minPrice && filters.minPrice !== '') queryParams.append('minPrice', filters.minPrice);
      if (filters.maxPrice && filters.maxPrice !== '') queryParams.append('maxPrice', filters.maxPrice);
      if (filters.quality && filters.quality !== '') queryParams.append('quality', filters.quality);
      if (filters.location && filters.location !== '') queryParams.append('location', filters.location);
      if (filters.search && filters.search !== '') queryParams.append('search', filters.search);

      const queryString = queryParams.toString();
      const endpoint = queryString
        ? `${API_ENDPOINTS.CROPS.AVAILABLE}?${queryString}`
        : API_ENDPOINTS.CROPS.AVAILABLE;

      console.log('🌾 Loading available crops from:', endpoint);
      const response = await apiService.get(endpoint);
      console.log('🌾 Available crops response:', response);
      return response;
    } catch (error) {
      console.error('❌ Error fetching available crops:', error);
      throw error;
    }
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
    console.log('📦 Building FormData for crop:', {
      cropName: cropData.cropName,
      category: cropData.category,
      quantity: cropData.quantity,
      price: cropData.pricePerUnit,
      quality: cropData.quality,
      harvestDate: cropData.harvestDate || cropData.expectedHarvestDate,
      hasImage: !!imageFile,
      imageUri: imageFile?.uri,
    });

    const formData = new FormData();

    // ---- Backend expects these exact field names ----
    formData.append('cropName', cropData.cropName);
    formData.append('category', cropData.category);
    formData.append('quantity', String(cropData.quantity));
    formData.append('unit', cropData.unit || 'kg');

    // Backend field is 'price', not 'pricePerUnit'
    formData.append('price', String(cropData.pricePerUnit || cropData.price || 0));

    // Backend field is 'qualityGrade', not 'quality'
    formData.append('qualityGrade', cropData.quality || cropData.qualityGrade || '');

    formData.append('description', cropData.description || '');
    formData.append('harvestDate', cropData.harvestDate || cropData.expectedHarvestDate || '');
    formData.append('pesticidesUsed', String(cropData.pesticidesUsed || false));
    formData.append('organic', String(cropData.organic || false));
    formData.append('minOrderQuantity', String(cropData.minOrderQuantity || 1));

    // Backend location fields: address, city, state, pincode
    const loc = cropData.locationDetails || {};
    formData.append('address', loc.village || loc.address || cropData.location || '');
    formData.append('city', loc.tehsil || loc.district || loc.city || '');
    formData.append('state', loc.state || '');
    formData.append('pincode', loc.pincode || '');

    // Image field name must be 'images' to match upload.array('images', 5)
    if (imageFile) {
      console.log('📸 Appending image:', {
        uri: imageFile.uri,
        type: imageFile.type,
        name: imageFile.name,
      });
      formData.append('images', {
        uri: imageFile.uri,
        type: imageFile.type || 'image/jpeg',
        name: imageFile.name || `crop_${Date.now()}.jpg`,
      });
    }

    console.log('✅ FormData prepared, making API call to:', API_ENDPOINTS.CROPS.ADD);
    const response = await apiService.upload(API_ENDPOINTS.CROPS.ADD, formData);
    console.log('✅ Crop created:', response);
    return response;
  }

  /**
   * Update an existing crop
   */
  async updateCrop(cropId, cropData, imageFile) {
    const formData = new FormData();

    if (cropData.cropName) formData.append('cropName', cropData.cropName);
    if (cropData.category) formData.append('category', cropData.category);
    if (cropData.quantity !== undefined) formData.append('quantity', String(cropData.quantity));
    if (cropData.unit) formData.append('unit', cropData.unit);

    // Backend field is 'price'
    if (cropData.pricePerUnit !== undefined) formData.append('price', String(cropData.pricePerUnit));
    else if (cropData.price !== undefined) formData.append('price', String(cropData.price));

    // Backend field is 'qualityGrade'
    if (cropData.quality) formData.append('qualityGrade', cropData.quality);
    else if (cropData.qualityGrade) formData.append('qualityGrade', cropData.qualityGrade);

    if (cropData.harvestDate) formData.append('harvestDate', cropData.harvestDate);
    if (cropData.description !== undefined) formData.append('description', cropData.description);
    if (cropData.status) formData.append('status', cropData.status);

    // Image field name must be 'images'
    if (imageFile) {
      formData.append('images', {
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
    const normalizeStatus = (status) => {
      if (!status) return 'available';
      const statusStr = String(status).toLowerCase();
      return statusStr;
    };

    // Handle farmer data - can be an ID string or a populated object
    let farmerData = null;
    if (crop.farmerId) {
      if (typeof crop.farmerId === 'object' && crop.farmerId._id) {
        // Populated object
        farmerData = {
          id: crop.farmerId._id,
          name: crop.farmerId.name,
          phone: crop.farmerId.phone,
        };
      } else if (typeof crop.farmerId === 'string') {
        // Just an ID
        farmerData = {
          id: crop.farmerId,
          name: 'Farmer',
          phone: null,
        };
      }
    }

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
      status: normalizeStatus(crop.status),
      availableQuantity: crop.availableQuantity || (crop.quantity - (crop.reservedQuantity || 0)),
      reservedQuantity: crop.reservedQuantity || 0,
      harvestDate: crop.harvestDate,
      expectedHarvestDate: crop.expectedHarvestDate,
      cultivationDate: crop.cultivationDate,
      location: crop.location || '',
      locationDetails: crop.locationDetails || {},
      // Handle both cropImage and images array from backend
      cropImage: crop.cropImage || (crop.images && crop.images[0]) || null,
      images: crop.images || [],
      farmer: farmerData,
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
