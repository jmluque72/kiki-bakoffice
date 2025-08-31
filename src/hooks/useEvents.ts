import { useState, useEffect } from 'react';
import { apiClient, API_ENDPOINTS } from '../config/api';

export interface Event {
  _id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  fechaInicio: string;
  fechaFin: string;
  ubicacion: {
    nombre: string;
    direccion?: string;
    esVirtual: boolean;
    enlaceVirtual?: string;
  };
  organizador: {
    _id: string;
    name: string;
    email: string;
  };
  cuenta: {
    _id: string;
    nombre: string;
    razonSocial: string;
  };
  capacidadMaxima?: number;
  participantes: Array<{
    usuario: {
      _id: string;
      name: string;
      email: string;
    };
    fechaInscripcion: string;
    estadoParticipacion: 'confirmado' | 'pendiente' | 'cancelado';
  }>;
  estado: 'borrador' | 'publicado' | 'en_curso' | 'finalizado' | 'cancelado';
  esPublico: boolean;
  requiereAprobacion: boolean;
  imagen?: string;
  tags: string[];
  metadatos: {
    creadoPor: {
      _id: string;
      name: string;
      email: string;
    };
    fechaCreacion: string;
    ultimaModificacion: string;
    modificadoPor?: {
      _id: string;
      name: string;
      email: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface EventsFilters {
  accountId?: string;
  categoria?: string;
  estado?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const fetchEvents = async (filters: EventsFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filters.accountId) params.append('accountId', filters.accountId);
      if (filters.categoria) params.append('categoria', filters.categoria);
      if (filters.estado) params.append('estado', filters.estado);
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      
      const response = await apiClient.get(`${API_ENDPOINTS.EVENTS.LIST}?${params.toString()}`);
      
      if (response.data.success) {
        setEvents(response.data.data.events);
        setTotal(response.data.data.total);
        setPage(response.data.data.page);
        setLimit(response.data.data.limit);
      } else {
        setError(response.data.message || 'Error al cargar los eventos');
      }
    } catch (err: any) {
      console.error('Error fetching events:', err);
      setError(err.response?.data?.message || 'Error al cargar los eventos');
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (eventData: any) => {
    try {
      setError(null);
      const response = await apiClient.post(API_ENDPOINTS.EVENTS.CREATE, eventData);
      
      if (response.data.success) {
        await fetchEvents();
        return { success: true, message: 'Evento creado exitosamente' };
      } else {
        setError(response.data.message || 'Error al crear el evento');
        return { success: false, message: response.data.message };
      }
    } catch (err: any) {
      console.error('Error creating event:', err);
      const errorMessage = err.response?.data?.message || 'Error al crear el evento';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const updateEvent = async (eventId: string, updateData: any) => {
    try {
      setError(null);
      const response = await apiClient.put(API_ENDPOINTS.EVENTS.UPDATE(eventId), updateData);
      
      if (response.data.success) {
        await fetchEvents();
        return { success: true, message: 'Evento actualizado exitosamente' };
      } else {
        setError(response.data.message || 'Error al actualizar el evento');
        return { success: false, message: response.data.message };
      }
    } catch (err: any) {
      console.error('Error updating event:', err);
      const errorMessage = err.response?.data?.message || 'Error al actualizar el evento';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      setError(null);
      const response = await apiClient.delete(API_ENDPOINTS.EVENTS.DELETE(eventId));
      
      if (response.data.success) {
        await fetchEvents();
        return { success: true, message: 'Evento eliminado exitosamente' };
      } else {
        setError(response.data.message || 'Error al eliminar el evento');
        return { success: false, message: response.data.message };
      }
    } catch (err: any) {
      console.error('Error deleting event:', err);
      const errorMessage = err.response?.data?.message || 'Error al eliminar el evento';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return {
    events,
    loading,
    error,
    total,
    page,
    limit,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent
  };
}; 