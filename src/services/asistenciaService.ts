import { apiClient } from '../config/api';

// Interfaces para asistencias
export interface EstudianteAsistencia {
  student: {
    _id: string;
    nombre: string;
    apellido: string;
    email: string;
  };
  presente: boolean;
}

export interface Asistencia {
  _id: string;
  account: {
    _id: string;
    nombre: string;
  };
  division: {
    _id: string;
    nombre: string;
  };
  fecha: string;
  estudiantes: EstudianteAsistencia[];
  creadoPor: {
    _id: string;
    nombre: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface AsistenciaResponse {
  success: boolean;
  data: Asistencia[];
  pagination: PaginationInfo;
}

export interface AsistenciaFilters {
  accountId?: string;
  grupoId?: string;
  alumnoId?: string;
  fechaInicio?: string;
  fechaFin?: string;
  estado?: 'presente' | 'ausente' | 'justificado' | 'tardanza';
  search?: string;
}

export interface CreateAsistenciaRequest {
  alumnoId: string;
  accountId: string;
  grupoId?: string;
  fecha: string;
  estado: 'presente' | 'ausente' | 'justificado' | 'tardanza';
  horaLlegada?: string;
  horaSalida?: string;
  observaciones?: string;
}

export interface UpdateAsistenciaRequest {
  estado?: 'presente' | 'ausente' | 'justificado' | 'tardanza';
  horaLlegada?: string;
  horaSalida?: string;
  observaciones?: string;
}

export class AsistenciaService {
  // Obtener datos del calendario (solo fechas con asistencias)
  static async getCalendarData(params: {
    grupoId: string;
    fechaInicio: string;
    fechaFin: string;
  }): Promise<{ [fecha: string]: { fecha: string; totalEstudiantes: number; presentes: number; ausentes: number } }> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('grupoId', params.grupoId);
      queryParams.append('fechaInicio', params.fechaInicio);
      queryParams.append('fechaFin', params.fechaFin);

      const response = await apiClient.get<ApiResponse<{ [fecha: string]: any }>>(
        `/backoffice/asistencias/calendar?${queryParams.toString()}`
      );
      
      return response.data.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener datos del calendario');
    }
  }

  // Obtener asistencias detalladas para un día específico
  static async getDayAsistencias(fecha: string, grupoId: string): Promise<Asistencia[]> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('grupoId', grupoId);

      const response = await apiClient.get<ApiResponse<Asistencia[]>>(
        `/backoffice/asistencias/day/${fecha}?${queryParams.toString()}`
      );
      
      return response.data.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener asistencias del día');
    }
  }

  // Obtener asistencias del backoffice con paginación
  static async getBackofficeAsistencias(params?: {
    page?: number;
    limit?: number;
    accountId?: string;
    grupoId?: string;
    alumnoId?: string;
    fechaInicio?: string;
    fechaFin?: string;
    estado?: string;
    search?: string;
  }): Promise<{ asistencias: Asistencia[]; pagination: PaginationInfo }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.accountId) queryParams.append('accountId', params.accountId);
      if (params?.grupoId) queryParams.append('grupoId', params.grupoId);
      if (params?.alumnoId) queryParams.append('alumnoId', params.alumnoId);
      if (params?.fechaInicio) queryParams.append('fechaInicio', params.fechaInicio);
      if (params?.fechaFin) queryParams.append('fechaFin', params.fechaFin);
      if (params?.estado) queryParams.append('estado', params.estado);
      if (params?.search) queryParams.append('search', params.search);

      const response = await apiClient.get<AsistenciaResponse>(
        `/api/backoffice/asistencias?${queryParams.toString()}`
      );
      
      if (response.data.success && response.data.data) {
        return {
          asistencias: response.data.data,
          pagination: response.data.pagination
        };
      } else {
        throw new Error(response.data.message || 'Error al obtener asistencias');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener asistencias');
    }
  }

  // Crear nueva asistencia
  static async createAsistencia(data: CreateAsistenciaRequest): Promise<Asistencia> {
    try {
      const response = await apiClient.post<{ success: boolean; data: Asistencia; message?: string }>(
        '/api/backoffice/asistencias',
        data
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Error al crear asistencia');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al crear asistencia');
    }
  }

  // Actualizar asistencia
  static async updateAsistencia(asistenciaId: string, data: UpdateAsistenciaRequest): Promise<Asistencia> {
    try {
      const response = await apiClient.put<{ success: boolean; data: Asistencia; message?: string }>(
        `/api/backoffice/asistencias/${asistenciaId}`,
        data
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Error al actualizar asistencia');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al actualizar asistencia');
    }
  }

  // Eliminar asistencia
  static async deleteAsistencia(asistenciaId: string): Promise<void> {
    try {
      const response = await apiClient.delete<{ success: boolean; message?: string }>(
        `/api/backoffice/asistencias/${asistenciaId}`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al eliminar asistencia');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al eliminar asistencia');
    }
  }

  // Obtener estadísticas de asistencias
  static async getAsistenciasStats(accountId: string, fechaInicio?: string, fechaFin?: string): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('accountId', accountId);
      if (fechaInicio) queryParams.append('fechaInicio', fechaInicio);
      if (fechaFin) queryParams.append('fechaFin', fechaFin);

      const response = await apiClient.get<{ success: boolean; data: any; message?: string }>(
        `/api/backoffice/asistencias/stats?${queryParams.toString()}`
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Error al obtener estadísticas');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener estadísticas');
    }
  }

  // Exportar asistencias a CSV
  static async exportAsistencias(params?: {
    accountId?: string;
    grupoId?: string;
    fechaInicio?: string;
    fechaFin?: string;
    estado?: string;
  }): Promise<Blob> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.accountId) queryParams.append('accountId', params.accountId);
      if (params?.grupoId) queryParams.append('grupoId', params.grupoId);
      if (params?.fechaInicio) queryParams.append('fechaInicio', params.fechaInicio);
      if (params?.fechaFin) queryParams.append('fechaFin', params.fechaFin);
      if (params?.estado) queryParams.append('estado', params.estado);

      const response = await apiClient.get(
        `/api/backoffice/asistencias/export?${queryParams.toString()}`,
        {
          responseType: 'blob'
        }
      );
      
      return response.data;
    } catch (error: any) {
      throw new Error('Error al exportar asistencias');
    }
  }
}
