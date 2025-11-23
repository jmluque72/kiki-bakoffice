import { apiClient, API_ENDPOINTS, ApiResponse, User } from '../config/api';
import RefreshTokenService from './refreshTokenService';

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
  accessToken: string;
  refreshToken: string;
  user: User;
  activeAssociation?: any;
  associations?: any[];
  tokenExpiresIn: number;
}

export class AuthService {
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      console.log('🔍 [AUTH SERVICE] Iniciando login con MongoDB...');
      console.log('🔍 [AUTH SERVICE] Endpoint:', '/users/login');
      console.log('🔍 [AUTH SERVICE] Email:', credentials.email);
      console.log('🔍 [AUTH SERVICE] API Base URL:', apiClient.defaults.baseURL);
      
      // Usar endpoint de login para backoffice (MongoDB)
      // NOTA: Usamos /users/login que es el endpoint correcto para MongoDB (sin Cognito)
      const response = await apiClient.post<ApiResponse<LoginResponse>>(
        '/users/login', // Endpoint de login para backoffice usando MongoDB
        credentials
      );
      
      console.log('📦 [AUTH SERVICE] Respuesta recibida:', {
        success: response.data.success,
        hasData: !!response.data.data,
        hasToken: !!response.data.data?.accessToken
      });
      
      if (response.data.success) {
        console.log('✅ [AUTH SERVICE] Login exitoso con MongoDB');
        
        // Guardar tokens usando el refresh token service
        RefreshTokenService.saveTokens({
          accessToken: response.data.data!.accessToken,
          refreshToken: response.data.data!.refreshToken,
          tokenExpiresIn: response.data.data!.tokenExpiresIn
        });
        
        // Mantener compatibilidad con el sistema anterior
        localStorage.setItem('kiki_token', response.data.data!.accessToken);
        localStorage.setItem('backoffice_user', JSON.stringify(response.data.data!.user));
        localStorage.setItem('auth_source', 'mongodb'); // Marcar como autenticación con MongoDB
        
        console.log('✅ [AUTH SERVICE] Tokens guardados correctamente');
      }
      
      return response.data.data!;
    } catch (error: any) {
      console.error('❌ [AUTH SERVICE] Error en login:', error);
      console.error('❌ [AUTH SERVICE] Error response:', error.response?.data);
      console.error('❌ [AUTH SERVICE] Error status:', error.response?.status);
      console.error('❌ [AUTH SERVICE] Error URL:', error.config?.url);
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
      console.log('🔍 [AuthService] Obteniendo perfil...');
      const response = await apiClient.get<ApiResponse<User>>(
        API_ENDPOINTS.AUTH.PROFILE
      );
      
      console.log('✅ [AuthService] Perfil obtenido:', response.data);
      return response.data.data!;
    } catch (error: any) {
      console.error('❌ [AuthService] Error en getProfile:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener perfil');
    }
  }

  static async logout(): Promise<void> {
    console.log('🔍 [AuthService] Cerrando sesión...');
    
    try {
      // Revocar refresh token en el servidor
      await RefreshTokenService.revokeRefreshToken();
    } catch (error) {
      console.error('❌ [AuthService] Error revocando refresh token:', error);
    }
    
    // Limpiar todos los tokens
    RefreshTokenService.clearTokens();
    localStorage.removeItem('kiki_token');
    localStorage.removeItem('backoffice_user');
    localStorage.removeItem('auth_source');
    console.log('✅ [AuthService] Sesión cerrada');
  }

  static isAuthenticated(): boolean {
    return RefreshTokenService.hasValidTokens();
  }

  static getToken(): string | null {
    return RefreshTokenService.getAccessToken();
  }

  static getCurrentUser(): User | null {
    const userStr = localStorage.getItem('backoffice_user');
    return userStr ? JSON.parse(userStr) : null;
  }
} 