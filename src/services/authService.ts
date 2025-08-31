import { apiClient, API_ENDPOINTS, ApiResponse, User } from '../config/api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nombre: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

export class AuthService {
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<ApiResponse<LoginResponse>>(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials
      );
      
      if (response.data.success) {
        // Guardar token en localStorage
        localStorage.setItem('kiki_token', response.data.data!.token);
        localStorage.setItem('backoffice_user', JSON.stringify(response.data.data!.user));
      }
      
      return response.data.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al iniciar sesión');
    }
  }

  static async register(userData: RegisterRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<ApiResponse<LoginResponse>>(
        API_ENDPOINTS.AUTH.REGISTER,
        userData
      );
      
      if (response.data.success) {
        // Guardar token en localStorage
        localStorage.setItem('kiki_token', response.data.data!.token);
        localStorage.setItem('backoffice_user', JSON.stringify(response.data.data!.user));
      }
      
      return response.data.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al registrar usuario');
    }
  }

  static async getProfile(): Promise<User> {
    try {
      const response = await apiClient.get<ApiResponse<User>>(
        API_ENDPOINTS.AUTH.PROFILE
      );
      
      return response.data.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener perfil');
    }
  }

  static logout(): void {
    localStorage.removeItem('kiki_token');
    localStorage.removeItem('backoffice_user');
  }

  static isAuthenticated(): boolean {
    return !!localStorage.getItem('kiki_token');
  }

  static getToken(): string | null {
    return localStorage.getItem('kiki_token');
  }

  static getCurrentUser(): User | null {
    const userStr = localStorage.getItem('backoffice_user');
    return userStr ? JSON.parse(userStr) : null;
  }
} 