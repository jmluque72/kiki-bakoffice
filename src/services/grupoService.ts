import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

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
  private getAuthHeaders() {
    const token = localStorage.getItem('kiki_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async getGrupos(page: number = 1, limit: number = 10, search: string = '', cuentaId?: string): Promise<GruposResponse> {
    try {
      const params = new URLSearchParams();
      if (page) params.append('page', page.toString());
      if (limit) params.append('limit', limit.toString());
      if (search) params.append('search', search);
      if (cuentaId) params.append('cuentaId', cuentaId);

      const response = await axios.get(`${API_BASE_URL}/grupos?${params.toString()}`, {
        headers: this.getAuthHeaders()
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching grupos:', error);
      throw error;
    }
  }

  async getGrupoById(id: string): Promise<Grupo> {
    try {
      const response = await axios.get(`${API_BASE_URL}/grupos/${id}`, {
        headers: this.getAuthHeaders()
      });
      return response.data.data.grupo;
    } catch (error) {
      console.error('Error fetching grupo:', error);
      throw error;
    }
  }

  async createGrupo(grupoData: CreateGrupoRequest): Promise<Grupo> {
    try {
      const response = await axios.post(`${API_BASE_URL}/grupos`, grupoData, {
        headers: this.getAuthHeaders()
      });
      return response.data.data.grupo;
    } catch (error) {
      console.error('Error creating grupo:', error);
      throw error;
    }
  }

  async updateGrupo(id: string, grupoData: UpdateGrupoRequest): Promise<Grupo> {
    try {
      const response = await axios.put(`${API_BASE_URL}/grupos/${id}`, grupoData, {
        headers: this.getAuthHeaders()
      });
      return response.data.data.grupo;
    } catch (error) {
      console.error('Error updating grupo:', error);
      throw error;
    }
  }

  async deleteGrupo(id: string): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/grupos/${id}`, {
        headers: this.getAuthHeaders()
      });
    } catch (error) {
      console.error('Error deleting grupo:', error);
      throw error;
    }
  }
}

export const grupoService = new GrupoService(); 