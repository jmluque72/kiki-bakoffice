import { useState, useEffect, useCallback } from 'react';
import { NotificationService, Notification } from '../services/notificationService';

export interface UseNotificationsReturn {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  calendarData: { [fecha: string]: { fecha: string; totalNotificaciones: number; notificaciones: Notification[] } };
  selectedDivision: string | null;
  loadNotifications: () => Promise<void>;
  loadCalendarData: (divisionId?: string, fechaInicio?: string, fechaFin?: string) => Promise<void>;
  setSelectedDivision: (divisionId: string | null) => void;
  clearError: () => void;
}

export const useNotifications = (): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calendarData, setCalendarData] = useState<{ [fecha: string]: { fecha: string; totalNotificaciones: number; notificaciones: Notification[] } }>({});
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await NotificationService.getBackofficeNotifications({
        limit: 50,
        divisionId: selectedDivision || undefined
      });
      
      setNotifications(result.notifications);
    } catch (err: any) {
      console.error('Error loading notifications:', err);
      setError(err.message || 'Error al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  }, [selectedDivision]);

  const loadCalendarData = useCallback(async (divisionId?: string, fechaInicio?: string, fechaFin?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await NotificationService.getCalendarData({
        divisionId: divisionId || selectedDivision || undefined,
        fechaInicio,
        fechaFin
      });
      
      setCalendarData(data);
    } catch (err: any) {
      console.error('Error loading calendar data:', err);
      setError(err.message || 'Error al cargar datos del calendario');
    } finally {
      setLoading(false);
    }
  }, [selectedDivision]);

  return {
    notifications,
    loading,
    error,
    calendarData,
    selectedDivision,
    loadNotifications,
    loadCalendarData,
    setSelectedDivision,
    clearError
  };
};
