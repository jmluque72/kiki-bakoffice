import { useState, useEffect } from 'react';
import { apiClient, API_ENDPOINTS, Association } from '../config/api';

export const useAssociations = () => {
  const [associations, setAssociations] = useState<Association[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingAssociations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get(API_ENDPOINTS.ASSOCIATIONS.PENDING);
      
      if (response.data.success) {
        setAssociations(response.data.data);
      } else {
        setError(response.data.message || 'Error al cargar las asociaciones');
      }
    } catch (err: any) {
      console.error('Error fetching associations:', err);
      setError(err.response?.data?.message || 'Error al cargar las asociaciones');
    } finally {
      setLoading(false);
    }
  };

  const approveAssociation = async (associationId: string) => {
    try {
      setError(null);
      
      const response = await apiClient.put(API_ENDPOINTS.ASSOCIATIONS.APPROVE(associationId));
      
      if (response.data.success) {
        // Actualizar la lista después de aprobar
        await fetchPendingAssociations();
        return { success: true, message: 'Asociación aprobada exitosamente' };
      } else {
        setError(response.data.message || 'Error al aprobar la asociación');
        return { success: false, message: response.data.message };
      }
    } catch (err: any) {
      console.error('Error approving association:', err);
      const errorMessage = err.response?.data?.message || 'Error al aprobar la asociación';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const rejectAssociation = async (associationId: string) => {
    try {
      setError(null);
      
      const response = await apiClient.put(API_ENDPOINTS.ASSOCIATIONS.REJECT(associationId));
      
      if (response.data.success) {
        // Actualizar la lista después de rechazar
        await fetchPendingAssociations();
        return { success: true, message: 'Asociación rechazada exitosamente' };
      } else {
        setError(response.data.message || 'Error al rechazar la asociación');
        return { success: false, message: response.data.message };
      }
    } catch (err: any) {
      console.error('Error rejecting association:', err);
      const errorMessage = err.response?.data?.message || 'Error al rechazar la asociación';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  useEffect(() => {
    fetchPendingAssociations();
  }, []);

  return {
    associations,
    loading,
    error,
    fetchPendingAssociations,
    approveAssociation,
    rejectAssociation
  };
}; 