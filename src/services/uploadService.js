/**
 * Upload Service
 * Handles file uploads including images and documents
 */

import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { FILE_CONSTRAINTS, ERROR_MESSAGES } from '../config/constants';

class UploadService {
  /**
   * Request camera permissions
   */
  async requestCameraPermissions() {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      return false;
    }
  }

  /**
   * Request media library permissions
   */
  async requestMediaLibraryPermissions() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting media library permissions:', error);
      return false;
    }
  }

  /**
   * Pick image from camera
   */
  async pickImageFromCamera(options = {}) {
    const hasPermission = await this.requestCameraPermissions();
    if (!hasPermission) {
      throw new Error(ERROR_MESSAGES.PERMISSION_DENIED);
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing !== false,
        aspect: options.aspect || [4, 3],
        quality: options.quality || 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        // Validate file size
        if (asset.fileSize && asset.fileSize > FILE_CONSTRAINTS.MAX_SIZE) {
          throw new Error(ERROR_MESSAGES.FILE_TOO_LARGE);
        }

        return {
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          fileSize: asset.fileSize,
          width: asset.width,
          height: asset.height,
        };
      }

      return null;
    } catch (error) {
      console.error('Error picking image from camera:', error);
      throw error;
    }
  }

  /**
   * Pick image from gallery
   */
  async pickImageFromGallery(options = {}) {
    const hasPermission = await this.requestMediaLibraryPermissionsAsync();
    if (!hasPermission) {
      throw new Error(ERROR_MESSAGES.PERMISSION_DENIED);
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing !== false,
        allowsMultipleSelection: options.allowsMultipleSelection || false,
        aspect: options.aspect || [4, 3],
        quality: options.quality || 0.8,
        selectionLimit: options.selectionLimit || 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        if (options.allowsMultipleSelection) {
          return result.assets.map((asset) => ({
            uri: asset.uri,
            type: asset.type || 'image/jpeg',
            name: asset.fileName || `photo_${Date.now()}.jpg`,
            fileSize: asset.fileSize,
            width: asset.width,
            height: asset.height,
          }));
        }

        const asset = result.assets[0];

        // Validate file size
        if (asset.fileSize && asset.fileSize > FILE_CONSTRAINTS.MAX_SIZE) {
          throw new Error(ERROR_MESSAGES.FILE_TOO_LARGE);
        }

        return {
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          fileSize: asset.fileSize,
          width: asset.width,
          height: asset.height,
        };
      }

      return null;
    } catch (error) {
      console.error('Error picking image from gallery:', error);
      throw error;
    }
  }

  /**
   * Pick document
   */
  async pickDocument(options = {}) {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: options.type || '*/*',
        copyToCacheDirectory: true,
        multiple: options.multiple || false,
      });

      if (result.canceled) {
        return null;
      }

      if (result.assets && result.assets.length > 0) {
        if (options.multiple) {
          return result.assets.map((asset) => ({
            uri: asset.uri,
            type: asset.mimeType,
            name: asset.name,
            size: asset.size,
          }));
        }

        const asset = result.assets[0];

        // Validate file size
        if (asset.size && asset.size > FILE_CONSTRAINTS.MAX_SIZE) {
          throw new Error(ERROR_MESSAGES.FILE_TOO_LARGE);
        }

        return {
          uri: asset.uri,
          type: asset.mimeType,
          name: asset.name,
          size: asset.size,
        };
      }

      return null;
    } catch (error) {
      if (error.message === 'User cancelled document picker') {
        return null;
      }
      console.error('Error picking document:', error);
      throw error;
    }
  }

  /**
   * Validate image type
   */
  isValidImageType(type) {
    return FILE_CONSTRAINTS.IMAGE_TYPES.includes(type);
  }

  /**
   * Validate document type
   */
  isValidDocumentType(type) {
    return FILE_CONSTRAINTS.DOCUMENT_TYPES.includes(type);
  }

  /**
   * Create FormData for file upload
   */
  createFormData(file, fieldName = 'file', additionalData = {}) {
    const formData = new FormData();

    // Add file
    formData.append(fieldName, {
      uri: file.uri,
      type: file.type,
      name: file.name,
    });

    // Add additional data
    Object.keys(additionalData).forEach((key) => {
      const value = additionalData[key];
      if (typeof value === 'object' && value !== null) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    });

    return formData;
  }

  /**
   * Create FormData for multiple files
   */
  createMultipleFilesFormData(files, fieldName = 'files', additionalData = {}) {
    const formData = new FormData();

    // Add files
    files.forEach((file, index) => {
      formData.append(fieldName, {
        uri: file.uri,
        type: file.type,
        name: file.name || `file_${index}_${Date.now()}`,
      });
    });

    // Add additional data
    Object.keys(additionalData).forEach((key) => {
      const value = additionalData[key];
      if (typeof value === 'object' && value !== null) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    });

    return formData;
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

export default new UploadService();
