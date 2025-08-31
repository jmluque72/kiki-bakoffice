import { useState, useEffect } from 'react';
import { apiClient, API_ENDPOINTS, Activity } from '../config/api';

export interface ActivitiesFilters {
  accountId?: string;
  userId?: string;
  tipo?: string;
  entidad?: string;
  fechaInicio?: string;
  fechaFin?: string;
  page?: number;
  limit?: number;
}

export const useActivities = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  const fetchActivities = async (filters: ActivitiesFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filters.accountId) params.append('accountId', filters.accountId);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.tipo) params.append('tipo', filters.tipo);
      if (filters.entidad) params.append('entidad', filters.entidad);
      if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
      if (filters.fechaFin) params.append('fechaFin', filters.fechaFin);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      
      const response = await apiClient.get(`${API_ENDPOINTS.ACTIVITIES.LIST}?${params.toString()}`);
      
      if (response.data.success) {
        setActivities(response.data.data.activities);
        setTotal(response.data.data.total);
        setPage(response.data.data.page);
        setLimit(response.data.data.limit);
      } else {
        setError(response.data.message || 'Error al cargar las actividades');
      }
    } catch (err: any) {
      console.error('Error fetching activities:', err);
      setError(err.response?.data?.message || 'Error al cargar las actividades');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const deleteActivity = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await apiClient.delete(`${API_ENDPOINTS.ACTIVITIES.DELETE(id)}`);
      
      if (response.data.success) {
        // Actualizar la lista de actividades
        setActivities(prev => prev.filter(activity => activity._id !== id));
        setTotal(prev => prev - 1);
        return true;
      } else {
        setError(response.data.message || 'Error al eliminar la actividad');
        return false;
      }
    } catch (err: any) {
      console.error('Error deleting activity:', err);
      setError(err.response?.data?.message || 'Error al eliminar la actividad');
      return false;
    }
  };

  return {
    activities,
    loading,
    error,
    total,
    page,
    limit,
    fetchActivities,
    deleteActivity
  };
}; 