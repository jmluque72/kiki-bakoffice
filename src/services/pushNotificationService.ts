import { apiClient } from '../config/api';

export interface PushNotificationFilters {
  divisionId?: string;
  roles?: ('coordinador' | 'familyadmin' | 'familyviewer')[];
  userIds?: string[];
  includeCoordinators?: boolean;
}

export interface CreatePushNotificationRequest {
  title: string;
  body: string;
  targetType: 'institution' | 'division' | 'users' | 'coordinators';
  filters?: PushNotificationFilters;
  scheduledAt?: string;
}

export interface PushNotification {
  _id: string;
  title: string;
  body: string;
  targetType: string;
  filters: PushNotificationFilters;
  account: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'partial';
  stats: {
    totalRecipients: number;
    totalDevices: number;
    sent: number;
    failed: number;
    queued: number;
  };
  createdAt: string;
  sentAt?: string;
}

export interface PushNotificationsResponse {
  success: boolean;
  data: PushNotification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CreatePushNotificationResponse {
  success: boolean;
  message: string;
  data: {
    notification: PushNotification;
    stats: PushNotification['stats'];
  };
}

class PushNotificationService {
  async createPushNotification(
    data: CreatePushNotificationRequest
  ): Promise<CreatePushNotificationResponse> {
    const response = await apiClient.post<CreatePushNotificationResponse>(
      '/api/admin/push-notifications',
      data
    );
    return response.data;
  }

  async getPushNotifications(
    page: number = 1,
    limit: number = 20,
    status?: string
  ): Promise<PushNotificationsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (status) {
      params.append('status', status);
    }
    
    const response = await apiClient.get<PushNotificationsResponse>(
      `/api/admin/push-notifications?${params.toString()}`
    );
    return response.data;
  }

  async getPushNotificationById(id: string): Promise<{ success: boolean; data: PushNotification }> {
    const response = await apiClient.get<{ success: boolean; data: PushNotification }>(
      `/api/admin/push-notifications/${id}`
    );
    return response.data;
  }

  async getUsersByDivision(divisionId: string): Promise<{ success: boolean; data: any[] }> {
    const response = await apiClient.get<{ success: boolean; data: any[] }>(
      `/api/admin/push-notifications/users/division/${divisionId}`
    );
    return response.data;
  }
}

export const pushNotificationService = new PushNotificationService();

