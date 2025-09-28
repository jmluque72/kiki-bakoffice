import { apiClient } from '../config/api';

export interface Grupo {
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

export interface GruposResponse {
  grupos: Grupo[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateGrupoRequest {
  nombre: string;
  descripcion?: string;
  cuentaId: string;
}

export interface UpdateGrupoRequest {
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
}

class GrupoService {

  async getGrupos(page: number = 1, limit: number = 10, search: string = '', cuentaId?: string): Promise<GruposResponse> {
    try {
      const params = new URLSearchParams();
      if (page) params.append('page', page.toString());
      if (limit) params.append('limit', limit.toString());
      if (search) params.append('search', search);
      if (cuentaId) params.append('cuentaId', cuentaId);

      const response = await apiClient.get(`/grupos?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching grupos:', error);
      throw error;
    }
  }

  async getGrupoById(id: string): Promise<Grupo> {
    try {
      const response = await apiClient.get(`/grupos/${id}`);
      return response.data.data.grupo;
    } catch (error) {
      console.error('Error fetching grupo:', error);
      throw error;
    }
  }

  async createGrupo(grupoData: CreateGrupoRequest): Promise<Grupo> {
    try {
      const response = await apiClient.post(`/grupos`, grupoData);
      return response.data.data.grupo;
    } catch (error) {
      console.error('Error creating grupo:', error);
      throw error;
    }
  }

  async updateGrupo(id: string, grupoData: UpdateGrupoRequest): Promise<Grupo> {
    try {
      const response = await apiClient.put(`/grupos/${id}`, grupoData);
      return response.data.data.grupo;
    } catch (error) {
      console.error('Error updating grupo:', error);
      throw error;
    }
  }

  async deleteGrupo(id: string): Promise<void> {
    try {
      await apiClient.delete(`/grupos/${id}`);
    } catch (error) {
      console.error('Error deleting grupo:', error);
      throw error;
    }
  }
}

export const grupoService = new GrupoService(); 