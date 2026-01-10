import { apiClient } from '../config/api';

export interface PendingNotification {
  _id: string;
  title: string;
  message: string;
  type: string;
  sender: {
    _id: string;
    name: string;
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
  recipients: string[];
  recipientsCount: number;
  status: 'pending' | 'sent' | 'rejected';
  priority: string;
  createdAt: string;
  updatedAt: string;
}

export interface PendingNotificationsResponse {
  success: boolean;
  data: PendingNotification[];
}

class PendingNotificationsService {
  async getPendingNotifications(): Promise<PendingNotification[]> {
    try {
      const response = await apiClient.get<PendingNotificationsResponse>('/api/backoffice/notifications/pending');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching pending notifications:', error);
      throw error;
    }
  }

  async approveNotification(notificationId: string): Promise<void> {
    try {
      await apiClient.put(`/api/backoffice/notifications/${notificationId}/approve`);
    } catch (error) {
      console.error('Error approving notification:', error);
      throw error;
    }
  }

  async rejectNotification(notificationId: string, rejectionReason?: string): Promise<void> {
    try {
      await apiClient.put(`/api/backoffice/notifications/${notificationId}/reject`, {
        rejectionReason
      });
    } catch (error) {
      console.error('Error rejecting notification:', error);
      throw error;
    }
  }
}

export const pendingNotificationsService = new PendingNotificationsService();
