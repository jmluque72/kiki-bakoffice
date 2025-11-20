import { apiClient } from '../config/api';

export interface User {
  _id: string;
  email: string;
  name: string;
  role: {
    _id: string;
    nombre: string;
    descripcion: string;
    nivel: number;
  };
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserFormData {
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  avatar?: string;
}

export interface UsersResponse {
  success: boolean;
  data: {
    users: User[];
    total: number;
    page: number;
    limit: number;
    stats?: {
      total: number;
      active: number;
      inactive: number;
      coordinadores: number;
      familiares: number;
      tutores: number;
      familyadmin: number;
    };
  };
}

export interface CreateUserResponse {
  success: boolean;
  message: string;
  data: User;
}

export interface UpdateUserResponse {
  success: boolean;
  message: string;
  data: User;
}

export interface DeleteUserResponse {
  success: boolean;
  message: string;
}

class UserService {

  async getUsers(page: number = 1, limit: number = 10, search: string = ''): Promise<UsersResponse> {
    try {
      const params = new URLSearchParams();
      if (page) params.append('page', page.toString());
      if (limit) params.append('limit', limit.toString());
      if (search) params.append('search', search);

      const url = `/api/users?${params.toString()}`;
      console.log('🌐 [SERVICE] Llamando a:', url);
      console.log('🌐 [SERVICE] URL completa será:', apiClient.defaults.baseURL + url);
      const response = await apiClient.get(url);
      console.log('✅ [SERVICE] Respuesta recibida:', response);
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async createUser(userData: UserFormData): Promise<CreateUserResponse> {
    try {
      const response = await apiClient.post(`/api/users`, userData);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(userId: string, userData: Partial<UserFormData>): Promise<UpdateUserResponse> {
    try {
      const response = await apiClient.put(`/api/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<DeleteUserResponse> {
    try {
      const response = await apiClient.delete(`/api/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async getUserById(userId: string): Promise<User> {
    try {
      const response = await apiClient.get(`/api/users/${userId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  // Obtener todos los usuarios para exportar (sin paginación)
  async getAllUsersForExport(): Promise<User[]> {
    try {
      // Obtener todos los usuarios con un límite muy alto
      const response = await apiClient.get(`/api/users?page=1&limit=10000`);
      return response.data.data.users;
    } catch (error) {
      console.error('Error fetching all users for export:', error);
      throw error;
    }
  }
}

export const userService = new UserService(); 