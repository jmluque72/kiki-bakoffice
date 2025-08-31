import { apiClient } from '../config/api';

export interface UploadResponse {
  success: boolean;
  message: string;
  data?: {
    imageId: string;
    imageKey: string;
    imageUrl: string;
  };
  error?: string;
}

export interface LogoUpdateResponse {
  success: boolean;
  message: string;
  data?: {
    accountId: string;
    logo: string;
    logoUrl: string;
  };
  error?: string;
}

export class UploadService {
  // Subir imagen a S3
  static async uploadImage(file: File): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await apiClient.post('/api/upload/s3/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al subir la imagen',
        error: error.message,
      };
    }
  }

  // Actualizar logo de una cuenta
  static async updateAccountLogo(accountId: string, imageKey: string): Promise<LogoUpdateResponse> {
    try {
      const response = await apiClient.put(`/api/accounts/${accountId}/logo`, {
        imageKey,
      });

      return response.data;
    } catch (error: any) {
      console.error('Error updating account logo:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al actualizar el logo',
        error: error.message,
      };
    }
  }

  // Obtener logo de una cuenta
  static async getAccountLogo(accountId: string): Promise<LogoUpdateResponse> {
    try {
      const response = await apiClient.get(`/api/accounts/${accountId}/logo`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting account logo:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener el logo',
        error: error.message,
      };
    }
  }

  // Eliminar imagen de S3
  static async deleteImage(imageKey: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete(`/api/upload/s3/image/${imageKey}`);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting image:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al eliminar la imagen',
      };
    }
  }
}
