import { apiClient, API_ENDPOINTS, ApiResponse } from '../config/api';

export interface DashboardStats {
  institucionesActivas: number;
  usuariosActivos: number;
  alumnosActivos: number;
  totalActividades: number;
}

export interface RecentActivity {
  id: string;
  descripcion: string;
  institucion: string;
  division: string;
  fecha: string;
}

export class DashboardService {
  static async getStats(): Promise<DashboardStats> {
    try {
      const response = await apiClient.get<ApiResponse<DashboardStats>>('/dashboard/stats');
      return response.data.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener estadísticas del dashboard');
    }
  }

  static async getRecentActivities(): Promise<RecentActivity[]> {
    try {
      const response = await apiClient.get<ApiResponse<RecentActivity[]>>('/dashboard/recent-activities');
      return response.data.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener actividades recientes');
    }
  }
}
