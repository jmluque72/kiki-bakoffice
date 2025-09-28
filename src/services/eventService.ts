import { apiClient } from '../config/api';

export interface Event {
  _id: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  hora: string;
  lugar?: string;
  estado: 'activo' | 'finalizado' | 'cancelado';
  requiereAutorizacion?: boolean;
  creador: {
    _id: string;
    name: string;
    email: string;
  };
  institucion: {
    _id: string;
    nombre: string;
  };
  division?: {
    _id: string;
    nombre: string;
  };
  participantes: any[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventRequest {
  titulo: string;
  descripcion: string;
  fecha: string;
  hora: string;
  lugar?: string;
  institutionId: string;
  divisionId: string;
  estado?: string;
  requiereAutorizacion?: boolean;
}

export interface EventsResponse {
  events: Event[];
  total: number;
  page: number;
  limit: number;
}

export interface EventCalendarData {
  [fecha: string]: {
    fecha: string;
    totalEventos: number;
    eventos: Event[];
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export class EventService {
  static async getCalendarData(params: {
    divisionId: string;
    fechaInicio: string;
    fechaFin: string;
  }): Promise<EventCalendarData> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('divisionId', params.divisionId);
      queryParams.append('fechaInicio', params.fechaInicio);
      queryParams.append('fechaFin', params.fechaFin);

      const response = await apiClient.get<ApiResponse<EventCalendarData>>(
        `/backoffice/eventos/calendar?${queryParams.toString()}`
      );
      
      return response.data.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener datos del calendario de eventos');
    }
  }

  static async getEvents(filters: {
    page?: number;
    limit?: number;
    institucion?: string;
    division?: string;
    estado?: string;
    fechaInicio?: string;
    fechaFin?: string;
    search?: string;
  } = {}): Promise<EventsResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.institucion) queryParams.append('institucion', filters.institucion);
      if (filters.division) queryParams.append('division', filters.division);
      if (filters.estado) queryParams.append('estado', filters.estado);
      if (filters.fechaInicio) queryParams.append('fechaInicio', filters.fechaInicio);
      if (filters.fechaFin) queryParams.append('fechaFin', filters.fechaFin);
      if (filters.search) queryParams.append('search', filters.search);

      const response = await apiClient.get<ApiResponse<EventsResponse>>(
        `/api/events?${queryParams.toString()}`
      );
      
      return response.data.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener eventos');
    }
  }

  static async getEventById(eventId: string): Promise<Event> {
    try {
      const response = await apiClient.get<ApiResponse<{ event: Event }>>(
        `/api/events/${eventId}`
      );
      
      return response.data.data!.event;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener evento');
    }
  }

  static async createEvent(eventData: CreateEventRequest): Promise<{ success: boolean; message: string; data?: Event }> {
    try {
      console.log('🚀 [EVENT_SERVICE] Enviando datos:', eventData);
      console.log('🚀 [EVENT_SERVICE] URL completa:', apiClient.defaults.baseURL + '/events/create');
      
      const response = await apiClient.post<ApiResponse<{ event: Event }>>('/events/create', eventData);
      
      console.log('✅ [EVENT_SERVICE] Respuesta exitosa:', response.data);
      
      return {
        success: true,
        message: 'Evento creado exitosamente',
        data: response.data.data!.event
      };
    } catch (error: any) {
      console.log('❌ [EVENT_SERVICE] Error completo:', error);
      console.log('❌ [EVENT_SERVICE] Error response:', error.response);
      console.log('❌ [EVENT_SERVICE] Error message:', error.message);
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al crear evento'
      };
    }
  }

  static async updateEvent(eventId: string, eventData: Partial<CreateEventRequest>): Promise<{ success: boolean; message: string; data?: Event }> {
    try {
      const response = await apiClient.put<ApiResponse<{ event: Event }>>(`/api/events/${eventId}`, eventData);
      
      return {
        success: true,
        message: 'Evento actualizado exitosamente',
        data: response.data.data!.event
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al actualizar evento'
      };
    }
  }

  static async deleteEvent(eventId: string): Promise<{ success: boolean; message: string }> {
    try {
      await apiClient.delete(`/api/events/${eventId}`);
      
      return {
        success: true,
        message: 'Evento eliminado exitosamente'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al eliminar evento'
      };
    }
  }

  static async getEventStats(institutionId: string): Promise<{
    total: number;
    activos: number;
    finalizados: number;
    cancelados: number;
    proximos: number;
  }> {
    try {
      const response = await apiClient.get<ApiResponse<{
        total: number;
        activos: number;
        finalizados: number;
        cancelados: number;
        proximos: number;
      }>>(`/api/events/stats/${institutionId}`);
      
      return response.data.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener estadísticas de eventos');
    }
  }
}