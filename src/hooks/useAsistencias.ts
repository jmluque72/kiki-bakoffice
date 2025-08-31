import { useState, useEffect } from 'react';
import { apiClient, API_ENDPOINTS, Asistencia } from '../config/api';

export interface AsistenciasFilters {
  accountId?: string;
  grupoId?: string;
  alumnoId?: string;
  fechaInicio?: string;
  fechaFin?: string;
  page?: number;
  limit?: number;
}

export const useAsistencias = () => {
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const fetchAsistencias = async (filters: AsistenciasFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filters.accountId) params.append('accountId', filters.accountId);
      if (filters.grupoId) params.append('grupoId', filters.grupoId);
      if (filters.alumnoId) params.append('alumnoId', filters.alumnoId);
      if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
      if (filters.fechaFin) params.append('fechaFin', filters.fechaFin);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      
      const response = await apiClient.get(`${API_ENDPOINTS.ASISTENCIAS.LIST}?${params.toString()}`);
      
      if (response.data.success) {
        setAsistencias(response.data.data.asistencias);
        setTotal(response.data.data.total);
        setPage(response.data.data.page);
        setLimit(response.data.data.limit);
      } else {
        setError(response.data.message || 'Error al cargar las asistencias');
      }
    } catch (err: any) {
      console.error('Error fetching asistencias:', err);
      setError(err.response?.data?.message || 'Error al cargar las asistencias');
    } finally {
      setLoading(false);
    }
  };

  const createAsistencia = async (asistenciaData: {
    alumnoId: string;
    accountId: string;
    grupoId: string;
    fecha: string;
    estado?: 'presente' | 'ausente' | 'justificado' | 'tardanza';
    horaLlegada?: string;
    horaSalida?: string;
    observaciones?: string;
  }) => {
    try {
      setError(null);
      const response = await apiClient.post(API_ENDPOINTS.ASISTENCIAS.CREATE, asistenciaData);
      
      if (response.data.success) {
        await fetchAsistencias();
        return { success: true, message: 'Asistencia registrada exitosamente' };
      } else {
        setError(response.data.message || 'Error al registrar la asistencia');
        return { success: false, message: response.data.message };
      }
    } catch (err: any) {
      console.error('Error creating asistencia:', err);
      const errorMessage = err.response?.data?.message || 'Error al registrar la asistencia';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const updateAsistencia = async (asistenciaId: string, updateData: {
    estado?: 'presente' | 'ausente' | 'justificado' | 'tardanza';
    horaLlegada?: string;
    horaSalida?: string;
    observaciones?: string;
  }) => {
    try {
      setError(null);
      const response = await apiClient.put(API_ENDPOINTS.ASISTENCIAS.UPDATE(asistenciaId), updateData);
      
      if (response.data.success) {
        await fetchAsistencias();
        return { success: true, message: 'Asistencia actualizada exitosamente' };
      } else {
        setError(response.data.message || 'Error al actualizar la asistencia');
        return { success: false, message: response.data.message };
      }
    } catch (err: any) {
      console.error('Error updating asistencia:', err);
      const errorMessage = err.response?.data?.message || 'Error al actualizar la asistencia';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const deleteAsistencia = async (asistenciaId: string) => {
    try {
      setError(null);
      const response = await apiClient.delete(API_ENDPOINTS.ASISTENCIAS.DELETE(asistenciaId));
      
      if (response.data.success) {
        await fetchAsistencias();
        return { success: true, message: 'Asistencia eliminada exitosamente' };
      } else {
        setError(response.data.message || 'Error al eliminar la asistencia');
        return { success: false, message: response.data.message };
      }
    } catch (err: any) {
      console.error('Error deleting asistencia:', err);
      const errorMessage = err.response?.data?.message || 'Error al eliminar la asistencia';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  useEffect(() => {
    fetchAsistencias();
  }, []);

  return {
    asistencias,
    loading,
    error,
    total,
    page,
    limit,
    fetchAsistencias,
    createAsistencia,
    updateAsistencia,
    deleteAsistencia
  };
}; 