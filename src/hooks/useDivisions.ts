import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { grupoService } from '../services/grupoService';

export interface Division {
  _id: string;
  nombre: string;
  descripcion?: string;
  cuenta: {
    _id: string;
    nombre: string;
    razonSocial: string;
  };
  activo: boolean;
  creadoPor: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const useDivisions = () => {
  const { user } = useAuth();
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log('🏫 [DIVISIONS] Hook inicializado');
  console.log('🏫 [DIVISIONS] User desde useAuth:', user);

  const loadDivisions = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🏫 [DIVISIONS] Cargando divisiones...');
      console.log('🏫 [DIVISIONS] Usuario:', user?.nombre);
      console.log('🏫 [DIVISIONS] Rol:', user?.role?.nombre);

      // Usar el mismo endpoint que la pantalla de divisiones
      // El servidor ya maneja la lógica de obtener la cuenta del usuario desde el token
      const response = await grupoService.getGrupos(1, 100, '');
      console.log('🏫 [DIVISIONS] Respuesta completa:', response);
      
      const divisions = response.grupos || [];
      console.log('🏫 [DIVISIONS] Divisiones recibidas:', divisions.length);

      setDivisions(divisions);
    } catch (err: any) {
      console.error('Error loading divisions:', err);
      setError(err.message || 'Error al cargar divisiones');
    } finally {
      setLoading(false);
    }
  };

  // Cargar divisiones al montar el componente
  useEffect(() => {
    console.log('🏫 [DIVISIONS] useEffect ejecutado');
    console.log('🏫 [DIVISIONS] User:', user);
    console.log('🏫 [DIVISIONS] User account ID:', user?.account?._id);
    
    // Intentar cargar divisiones siempre
    console.log('🏫 [DIVISIONS] Llamando a loadDivisions...');
    loadDivisions();
  }, [user]);

  return {
    divisions,
    loading,
    error,
    loadDivisions,
    clearError: () => setError(null)
  };
};
