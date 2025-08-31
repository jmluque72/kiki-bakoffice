import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { 
  AsistenciaService, 
  Asistencia, 
  AsistenciaFilters, 
  PaginationInfo,
  CreateAsistenciaRequest,
  UpdateAsistenciaRequest
} from '../services/asistenciaService';

export const useBackofficeAsistencias = () => {
  const { user } = useAuth();
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Cargar asistencias
  const loadAsistencias = async (page: number = 1, filters: AsistenciaFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 [BACKOFFICE ASISTENCIAS] Cargando asistencias...');
      console.log('📊 [BACKOFFICE ASISTENCIAS] Usuario:', user?.nombre);
      console.log('📊 [BACKOFFICE ASISTENCIAS] Rol:', user?.role?.nombre);
      console.log('📊 [BACKOFFICE ASISTENCIAS] Account ID:', user?.account?._id);
      
      const params: any = {
        page,
        limit: itemsPerPage,
        ...filters
      };
      
      // Para AdminAccount, solo mostrar asistencias de su cuenta
      if (user?.role?.nombre === 'adminaccount') {
        params.accountId = user?.account?._id;
      }
      // Para SuperAdmin, permitir filtrar por cuenta específica
      else if (user?.role?.nombre === 'superadmin' && filters.accountId) {
        params.accountId = filters.accountId;
      }
      
      console.log('📊 [BACKOFFICE ASISTENCIAS] Parámetros:', params);
      
      const result = await AsistenciaService.getBackofficeAsistencias(params);
      
      console.log('📊 [BACKOFFICE ASISTENCIAS] Asistencias recibidas:', result);
      console.log('📊 [BACKOFFICE ASISTENCIAS] Cantidad:', result.asistencias?.length || 0);
      console.log('📊 [BACKOFFICE ASISTENCIAS] Paginación:', result.pagination);
      
      setAsistencias(result.asistencias);
      setPagination(result.pagination);
      setCurrentPage(page);
    } catch (error: any) {
      console.error('Error loading asistencias:', error);
      setError(error.message || 'Error al cargar asistencias');
    } finally {
      setLoading(false);
    }
  };

  // Crear asistencia
  const createAsistencia = async (data: CreateAsistenciaRequest) => {
    try {
      setError(null);
      const result = await AsistenciaService.createAsistencia(data);
      await loadAsistencias(currentPage);
      return { success: true, message: 'Asistencia registrada exitosamente', data: result };
    } catch (error: any) {
      const errorMessage = error.message || 'Error al registrar asistencia';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Actualizar asistencia
  const updateAsistencia = async (asistenciaId: string, data: UpdateAsistenciaRequest) => {
    try {
      setError(null);
      const result = await AsistenciaService.updateAsistencia(asistenciaId, data);
      await loadAsistencias(currentPage);
      return { success: true, message: 'Asistencia actualizada exitosamente', data: result };
    } catch (error: any) {
      const errorMessage = error.message || 'Error al actualizar asistencia';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Eliminar asistencia
  const deleteAsistencia = async (asistenciaId: string) => {
    try {
      setError(null);
      await AsistenciaService.deleteAsistencia(asistenciaId);
      await loadAsistencias(currentPage);
      return { success: true, message: 'Asistencia eliminada exitosamente' };
    } catch (error: any) {
      const errorMessage = error.message || 'Error al eliminar asistencia';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Funciones de paginación
  const handlePageChange = (page: number, filters: AsistenciaFilters = {}) => {
    loadAsistencias(page, filters);
  };

  const handleNextPage = (filters: AsistenciaFilters = {}) => {
    if (pagination?.hasNextPage) {
      handlePageChange(currentPage + 1, filters);
    }
  };

  const handlePrevPage = (filters: AsistenciaFilters = {}) => {
    if (pagination?.hasPrevPage) {
      handlePageChange(currentPage - 1, filters);
    }
  };

  // Exportar asistencias
  const exportAsistencias = async (filters: AsistenciaFilters = {}) => {
    try {
      const params: any = { ...filters };
      
      // Para AdminAccount, solo exportar asistencias de su cuenta
      if (user?.role?.nombre === 'adminaccount') {
        params.accountId = user?.account?._id;
      }
      
      const blob = await AsistenciaService.exportAsistencias(params);
      
      // Crear y descargar el archivo
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `asistencias_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { success: true, message: 'Asistencias exportadas exitosamente' };
    } catch (error: any) {
      const errorMessage = error.message || 'Error al exportar asistencias';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Obtener estadísticas
  const getStats = async (fechaInicio?: string, fechaFin?: string) => {
    try {
      const accountId = user?.account?._id;
      if (!accountId) {
        throw new Error('No se pudo identificar la cuenta');
      }
      
      const stats = await AsistenciaService.getAsistenciasStats(accountId, fechaInicio, fechaFin);
      return { success: true, data: stats };
    } catch (error: any) {
      const errorMessage = error.message || 'Error al obtener estadísticas';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Cargar asistencias al montar el componente
  useEffect(() => {
    if (user) {
      loadAsistencias(1);
    }
  }, [user]);

  return {
    // Estado
    asistencias,
    pagination,
    loading,
    error,
    currentPage,
    itemsPerPage,
    
    // Funciones
    loadAsistencias,
    createAsistencia,
    updateAsistencia,
    deleteAsistencia,
    handlePageChange,
    handleNextPage,
    handlePrevPage,
    exportAsistencias,
    getStats,
    
    // Utilidades
    clearError: () => setError(null)
  };
};
