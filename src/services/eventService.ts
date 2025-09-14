import { apiClient } from '../config/api';

// Interfaces para eventos
export interface Event {
  _id: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  hora: string;
  lugar: string;
  estado: string;
  participantes: any[];
  creador: {
    name: string;
  };
  institucion: {
    _id: string;
    nombre: string;
  };
  division?: {
    _id: string;
    nombre: string;
  };
  autorizaciones?: {
    _id: string;
    tipo: string;
    estado: 'pendiente' | 'aprobada' | 'rechazada';
    estudiante?: {
      _id: string;
      nombre: string;
      email: string;
    };
    autorizadoPor?: {
      _id: string;
      nombre: string;
    };
    fechaAutorizacion?: string;
    observaciones?: string;
  }[];
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
  // Obtener datos del calendario (solo fechas con eventos)
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

  // Obtener eventos detallados para un día específico
  static async getDayEvents(fecha: string, divisionId: string): Promise<Event[]> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('fecha', fecha);
      queryParams.append('divisionId', divisionId);

      const response = await apiClient.get<ApiResponse<Event[]>>(
        `/backoffice/eventos/day?${queryParams.toString()}`
      );
      
      return response.data.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener eventos del día');
    }
  }

  // Obtener todos los eventos con filtros
  static async getEvents(filters: {
    divisionId?: string;
    fechaInicio?: string;
    fechaFin?: string;
    estado?: string;
    categoria?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ events: Event[]; total: number; page: number; limit: number }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.divisionId) queryParams.append('divisionId', filters.divisionId);
      if (filters.fechaInicio) queryParams.append('fechaInicio', filters.fechaInicio);
      if (filters.fechaFin) queryParams.append('fechaFin', filters.fechaFin);
      if (filters.estado) queryParams.append('estado', filters.estado);
      if (filters.categoria) queryParams.append('categoria', filters.categoria);
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());

      const response = await apiClient.get<ApiResponse<{ events: Event[]; total: number; page: number; limit: number }>>(
        `/backoffice/eventos?${queryParams.toString()}`
      );
      
      return response.data.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener eventos');
    }
  }

  // Crear evento
  static async createEvent(eventData: Partial<Event>): Promise<{ success: boolean; message: string; data?: Event }> {
    try {
      const response = await apiClient.post<ApiResponse<Event>>('/backoffice/eventos', eventData);
      
      return {
        success: true,
        message: 'Evento creado exitosamente',
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al crear evento'
      };
    }
  }

  // Actualizar evento
  static async updateEvent(eventId: string, eventData: Partial<Event>): Promise<{ success: boolean; message: string; data?: Event }> {
    try {
      const response = await apiClient.put<ApiResponse<Event>>(`/backoffice/eventos/${eventId}`, eventData);
      
      return {
        success: true,
        message: 'Evento actualizado exitosamente',
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al actualizar evento'
      };
    }
  }

  // Eliminar evento
  static async deleteEvent(eventId: string): Promise<{ success: boolean; message: string }> {
    try {
      await apiClient.delete(`/backoffice/eventos/${eventId}`);
      
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
}
