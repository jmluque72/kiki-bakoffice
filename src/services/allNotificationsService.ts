import axios from 'axios';
import { config } from '../config/env';
import { Notification, PaginationInfo } from './notificationService';
import RefreshTokenService from './refreshTokenService';

export interface AllNotificationsResponse {
  success: boolean;
  data: Notification[];
  pagination: PaginationInfo;
}

export class AllNotificationsService {
  // Obtener todas las notificaciones de la institución (para el modal del header)
  // Paginado de a 20, ordenado por fecha más reciente
  static async getAllInstitutionNotifications(params?: {
    limit?: number;
    skip?: number;
  }): Promise<{ notifications: Notification[]; pagination: PaginationInfo }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.skip) queryParams.append('skip', params.skip.toString());

      const url = `/api/backoffice/notifications/all?${queryParams.toString()}`;
      const baseURL = config.getApiUrl();
      const fullUrl = `${baseURL}${url}`;
      
      console.log('🔔 [ALL NOTIFICATIONS SERVICE] Llamando a:', fullUrl);
      
      // Obtener token directamente
      const token = RefreshTokenService.getAccessToken() || localStorage.getItem('kiki_token');
      
      // Crear una instancia de axios sin interceptores para evitar problemas de timeout
      const directAxios = axios.create({
        timeout: 60000, // 60 segundos de timeout
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      const response = await directAxios.get<AllNotificationsResponse>(fullUrl);
      
      console.log('🔔 [ALL NOTIFICATIONS SERVICE] Respuesta recibida:', {
        success: response.data.success,
        hasData: !!response.data.data,
        dataLength: response.data.data?.length || 0
      });

      if (response.data.success && response.data.data) {
        return {
          notifications: response.data.data,
          pagination: response.data.pagination
        };
      } else {
        const errorMsg = response.data.message || 'Error al obtener notificaciones';
        console.error('🔔 [ALL NOTIFICATIONS SERVICE] Error en respuesta:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error('🔔 [ALL NOTIFICATIONS SERVICE] Error completo:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        method: error.config?.method,
        timeout: error.code === 'ECONNABORTED'
      });
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('La solicitud tardó demasiado tiempo. Por favor, intenta nuevamente.');
      }
      
      const errorMessage = error.response?.data?.message 
        || error.message 
        || `Error al obtener notificaciones (${error.response?.status || 'unknown'})`;
      
      throw new Error(errorMessage);
    }
  }
}
