import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { NotificationService } from '../services/notificationService';

export const useNotificationCount = () => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const { user } = useAuth();

  // Solo cargar notificaciones para familyadmin y familyviewer
  const shouldShowNotifications = user?.role?.nombre === 'familyadmin' || user?.role?.nombre === 'familyviewer';

  const fetchUnreadCount = async () => {
    if (!shouldShowNotifications) {
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      const count = await NotificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread notifications count:', error);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Cargar conteo inicial
  useEffect(() => {
    fetchUnreadCount();
  }, [user?.role?.nombre]);

  // Actualizar conteo cada 30 segundos
  useEffect(() => {
    if (!shouldShowNotifications) return;

    const interval = setInterval(fetchUnreadCount, 30000); // 30 segundos
    return () => clearInterval(interval);
  }, [shouldShowNotifications]);

  return {
    unreadCount,
    loading,
    shouldShowNotifications,
    refreshCount: fetchUnreadCount
  };
};
