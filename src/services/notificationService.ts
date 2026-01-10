import { apiClient, API_ENDPOINTS, ApiResponse } from '../config/api';

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'informacion' | 'comunicacion' | 'institucion';
  sender?: {
    _id: string;
    name?: string;
    nombre?: string;
    email: string;
  };
  account: {
    _id: string;
    nombre: string;
  };
  division?: {
    _id: string;
    nombre: string;
  };
  recipients?: Array<{
    _id: string;
    nombre: string;
    email?: string;
  }>;
  recipientsCount?: number;
  readBy: Array<{
    user: string;
    readAt: string;
  }>;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  sentAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface NotificationResponse {
  success: boolean;
  data: Notification[];
  pagination: PaginationInfo;
}

export interface CreateNotificationRequest {
  title: string;
  message: string;
  type: 'informacion' | 'comunicacion' | 'institucion';
  accountId: string;
  divisionId?: string;
  recipients?: string[];
}

export class NotificationService {
  // Obtener notificaciones para el backoffice
  static async getBackofficeNotifications(params?: {
    limit?: number;
    skip?: number;
    accountId?: string;
    divisionId?: string;
    type?: string;
    search?: string;
  }): Promise<{ notifications: Notification[]; pagination: PaginationInfo }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.skip) queryParams.append('skip', params.skip.toString());
      if (params?.accountId) queryParams.append('accountId', params.accountId);
      if (params?.divisionId) queryParams.append('divisionId', params.divisionId);
      if (params?.type) queryParams.append('type', params.type);
      if (params?.search) queryParams.append('search', params.search);

      const response = await apiClient.get<NotificationResponse>(
        `/api/backoffice/notifications?${queryParams.toString()}`
      );
      
      if (response.data.success && response.data.data) {
        return {
          notifications: response.data.data,
          pagination: response.data.pagination
        };
      } else {
        throw new Error(response.data.message || 'Error al obtener notificaciones');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener notificaciones');
    }
  }

  // Enviar notificación
  static async sendNotification(data: CreateNotificationRequest): Promise<Notification> {
    try {
      const response = await apiClient.post<ApiResponse<Notification>>(
        '/api/notifications',
        data
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Error al enviar notificación');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al enviar notificación');
    }
  }

  // Marcar como leída
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      const response = await apiClient.put<ApiResponse>(
        `/api/notifications/${notificationId}/read`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al marcar notificación como leída');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al marcar notificación como leída');
    }
  }

  // Eliminar notificación
  static async deleteNotification(notificationId: string): Promise<void> {
    try {
      const response = await apiClient.delete<ApiResponse>(
        `/api/notifications/${notificationId}`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al eliminar notificación');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al eliminar notificación');
    }
  }

  // Obtener detalles de una notificación
  static async getNotificationDetails(notificationId: string): Promise<Notification> {
    try {
      const response = await apiClient.get<ApiResponse<Notification>>(
        `/api/notifications/${notificationId}/details`
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Error al obtener detalles de la notificación');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener detalles de la notificación');
    }
  }

  // Obtener destinatarios disponibles
  static async getRecipients(accountId: string, divisionId?: string): Promise<any[]> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('accountId', accountId);
      if (divisionId) queryParams.append('divisionId', divisionId);

      const response = await apiClient.get<ApiResponse<any[]>>(
        `/api/notifications/recipients?${queryParams.toString()}`
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Error al obtener destinatarios');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener destinatarios');
    }
  }

  // Obtener notificaciones para usuarios familyadmin/familyviewer
  static async getUserNotifications(params?: {
    limit?: number;
    skip?: number;
    accountId?: string;
    divisionId?: string;
    unreadOnly?: boolean;
  }): Promise<Notification[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.skip) queryParams.append('skip', params.skip.toString());
      if (params?.accountId) queryParams.append('accountId', params.accountId);
      if (params?.divisionId) queryParams.append('divisionId', params.divisionId);
      if (params?.unreadOnly) queryParams.append('unreadOnly', params.unreadOnly.toString());

      const response = await apiClient.get<ApiResponse<Notification[]>>(
        `/api/notifications?${queryParams.toString()}`
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        return [];
      }
    } catch (error: any) {
      console.error('Error al obtener notificaciones del usuario:', error);
      return [];
    }
  }

  // Obtener conteo de notificaciones sin leer
  static async getUnreadCount(): Promise<number> {
    try {
      const response = await apiClient.get<ApiResponse<{ count: number }>>(
        '/api/notifications/unread-count'
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data.count;
      } else {
        return 0;
      }
    } catch (error: any) {
      console.error('Error al obtener conteo de notificaciones sin leer:', error);
      return 0;
    }
  }

  // Obtener datos del calendario de notificaciones
  static async getCalendarData(params: {
    divisionId?: string;
    fechaInicio?: string;
    fechaFin?: string;
  }): Promise<{ [fecha: string]: { fecha: string; totalNotificaciones: number; notificaciones: Notification[] } }> {
    try {
      const queryParams = new URLSearchParams();
      if (params.divisionId) queryParams.append('divisionId', params.divisionId);
      if (params.fechaInicio) queryParams.append('fechaInicio', params.fechaInicio);
      if (params.fechaFin) queryParams.append('fechaFin', params.fechaFin);

      const response = await apiClient.get(
        `/backoffice/notifications/calendar?${queryParams.toString()}`
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Error al obtener datos del calendario');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener datos del calendario');
    }
  }
}

// Interfaces para templates de notificaciones
export interface NotificationTemplate {
  _id: string;
  nombre: string;
  texto: string;
  account: {
    _id: string;
    nombre: string;
  };
  creadoPor: {
    _id: string;
    name: string;
    email: string;
  };
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateRequest {
  nombre: string;
  texto: string;
  accountId: string;
}

export interface UpdateTemplateRequest {
  nombre?: string;
  texto?: string;
  activo?: boolean;
}

export class NotificationTemplateService {
  // Obtener templates de una institución
  static async getTemplates(accountId: string): Promise<NotificationTemplate[]> {
    try {
      const response = await apiClient.get<ApiResponse<NotificationTemplate[]>>(
        `/api/notifications/templates?accountId=${accountId}`
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Error al obtener templates');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener templates');
    }
  }

  // Crear template
  static async createTemplate(data: CreateTemplateRequest): Promise<NotificationTemplate> {
    try {
      const response = await apiClient.post<ApiResponse<NotificationTemplate>>(
        '/api/notifications/templates',
        data
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Error al crear template');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al crear template');
    }
  }

  // Actualizar template
  static async updateTemplate(templateId: string, data: UpdateTemplateRequest): Promise<NotificationTemplate> {
    try {
      const response = await apiClient.put<ApiResponse<NotificationTemplate>>(
        `/api/notifications/templates/${templateId}`,
        data
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Error al actualizar template');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al actualizar template');
    }
  }

  // Eliminar template
  static async deleteTemplate(templateId: string): Promise<void> {
    try {
      const response = await apiClient.delete<ApiResponse<void>>(
        `/api/notifications/templates/${templateId}`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al eliminar template');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al eliminar template');
    }
  }
}
