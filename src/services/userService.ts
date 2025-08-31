import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export interface User {
  _id: string;
  email: string;
  nombre: string;
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
  private getAuthHeaders() {
    const token = localStorage.getItem('kiki_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async getUsers(page: number = 1, limit: number = 10, search: string = ''): Promise<UsersResponse> {
    try {
      const params = new URLSearchParams();
      if (page) params.append('page', page.toString());
      if (limit) params.append('limit', limit.toString());
      if (search) params.append('search', search);

      const response = await axios.get(`${API_BASE_URL}/users?${params.toString()}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async createUser(userData: UserFormData): Promise<CreateUserResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/users`, userData, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(userId: string, userData: Partial<UserFormData>): Promise<UpdateUserResponse> {
    try {
      const response = await axios.put(`${API_BASE_URL}/users/${userId}`, userData, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<DeleteUserResponse> {
    try {
      const response = await axios.delete(`${API_BASE_URL}/users/${userId}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async getUserById(userId: string): Promise<User> {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/${userId}`, {
        headers: this.getAuthHeaders()
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }
}

export const userService = new UserService(); 