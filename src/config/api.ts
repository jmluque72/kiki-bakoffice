import axios from 'axios';
import { config } from './env';
import RefreshTokenService from '../services/refreshTokenService';

// Configuración base del API
const API_BASE_URL = config.getApiUrl();

// Crear instancia de axios con configuración base
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación y refrescar si es necesario
apiClient.interceptors.request.use(
  async (config) => {
    // Verificar si el token está próximo a expirar antes de hacer la request
    if (RefreshTokenService.hasValidTokens() && RefreshTokenService.isTokenExpiringSoon(2)) {
      console.log('🔄 [API] Token próximo a expirar, renovando antes de request...');
      try {
        const newToken = await RefreshTokenService.refreshAccessToken();
        if (newToken) {
          console.log('✅ [API] Token renovado antes de request');
        }
      } catch (error) {
        console.error('❌ [API] Error renovando token antes de request:', error);
      }
    }

    // Usar el access token del refresh token service
    const token = RefreshTokenService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // No sobrescribir Content-Type si es FormData
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta con refresh automático
apiClient.interceptors.response.use(
  (response) => {
    // Verificar si el servidor envió un nuevo token
    const newToken = response.headers['x-new-access-token'];
    if (newToken) {
      console.log('🔄 [API] Nuevo access token recibido del servidor');
      localStorage.setItem('kiki_access_token', newToken);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Solo manejar refresh automático para errores 401 en endpoints autenticados
    // No interferir con errores de login (que también devuelven 401)
    if (error.response?.status === 401 && 
        error.config?.url !== '/api/users/login' && 
        error.config?.url !== '/api/auth/refresh' && 
        !originalRequest._retry) {
      
      console.log('🔄 [API] Token expirado, intentando refresh automático...');
      
      try {
        // Marcar la request como retry para evitar loops
        originalRequest._retry = true;
        
        // Intentar refresh del token
        const newAccessToken = await RefreshTokenService.refreshAccessToken();
        
        if (newAccessToken) {
          console.log('✅ [API] Token renovado exitosamente');
          
          // Actualizar el token en la request original
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          
          // Reintentar la request original
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('❌ [API] Error en refresh automático:', refreshError);
      }
      
      // Si el refresh falla, hacer logout
      console.log('🔐 [API] Refresh falló - Redirigiendo al login');
      
      // Limpiar tokens
      RefreshTokenService.clearTokens();
      localStorage.removeItem('kiki_token');
      localStorage.removeItem('backoffice_user');
      
      // Redirigir al login
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Endpoints del API
export const API_ENDPOINTS = {
  // Autenticación
  AUTH: {
    LOGIN: '/api/users/login',
    REGISTER: '/api/users/register',
    PROFILE: '/users/profile',
  },
  
  // Usuarios
  USERS: {
    LIST: '/api/users',
    BY_ID: (id: string) => `/api/users/${id}`,
    UPDATE_STATUS: (id: string) => `/api/users/${id}/status`,
  },
  
  // Cuentas
  ACCOUNTS: {
    BASE: '/api/accounts',
    LIST: '/api/accounts',
    BY_ID: (id: string) => `/api/accounts/${id}`,
    CREATE: '/api/accounts',
    UPDATE: (id: string) => `/api/accounts/${id}`,
    DELETE: (id: string) => `/api/accounts/${id}`,
    STATS: '/api/accounts/stats',
  },
  
  // Grupos
  GROUPS: {
    LIST: '/api/groups',
    BY_ID: (id: string) => `/api/groups/${id}`,
    BY_ACCOUNT: (accountId: string) => `/api/groups/account/${accountId}`,
    CREATE: '/api/groups',
    UPDATE: (id: string) => `/api/groups/${id}`,
    DELETE: (id: string) => `/api/groups/${id}`,
    ADD_USER: (id: string) => `/api/groups/${id}/users`,
    REMOVE_USER: (id: string, userId: string) => `/api/groups/${id}/users/${userId}`,
    STATS: (accountId: string) => `/api/groups/account/${accountId}/stats`,
  },
  
  // Eventos
  EVENTS: {
    LIST: '/api/events',
    BY_ID: (id: string) => `/api/events/${id}`,
    CREATE: '/api/events',
    UPDATE: (id: string) => `/api/events/${id}`,
    DELETE: (id: string) => `/api/events/${id}`,
    UPCOMING: (accountId: string) => `/api/events/upcoming/${accountId}`,
    STATS: (accountId: string) => `/api/events/stats/${accountId}`,
    ADD_PARTICIPANT: (id: string) => `/api/events/${id}/participants`,
    REMOVE_PARTICIPANT: (id: string, userId: string) => `/api/events/${id}/participants/${userId}`,
    UPDATE_PARTICIPANT_STATUS: (id: string, userId: string) => `/api/events/${id}/participants/${userId}/status`,
  },
  

  
  // Roles
  ROLES: {
    LIST: '/api/roles',
    BY_ID: (id: string) => `/api/roles/${id}`,
    BY_NAME: (name: string) => `/api/roles/name/${name}`,
    HIERARCHY: '/api/roles/hierarchy',
    BY_LEVEL: (level: number) => `/api/roles/level/${level}`,
    PERMISSIONS: (id: string) => `/api/roles/${id}/permissions`,
    CREATE: '/api/roles',
    UPDATE: (id: string) => `/api/roles/${id}`,
    DELETE: (id: string) => `/api/roles/${id}`,
    INITIALIZE: '/api/roles/initialize',
  },
  
  // Asociaciones
  ASSOCIATIONS: {
    PENDING: '/api/users/pending-associations',
    APPROVE: (id: string) => `/api/users/approve-association/${id}`,
    REJECT: (id: string) => `/api/users/reject-association/${id}`,
  },
  ASISTENCIAS: {
    LIST: '/api/asistencias',
    CREATE: '/api/asistencias',
    UPDATE: (id: string) => `/api/asistencias/${id}`,
    DELETE: (id: string) => `/api/asistencias/${id}`,
  },
  ACTIVITIES: {
    LIST: '/api/activities',
    DELETE: (id: string) => `/backoffice/actividades/${id}`,
    CHANGE_STATUS: (id: string) => `/activities/${id}/estado`,
  },
  
  // Health check
  HEALTH: '/health',
};

// Tipos de respuesta del API
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Tipos de usuario
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
  account?: {
    _id: string;
    nombre: string;
    razonSocial: string;
  };
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

// Tipos de cuenta
export interface Account {
  _id: string;
  nombre: string;
  razonSocial: string;
  address: string;
  logo?: string;
  logoSignedUrl?: string;
  activo: boolean;
  usuarioAdministrador: {
    _id: string;
    name: string;
    email: string;
    status: string;
    role: {
      _id: string;
      nombre: string;
      descripcion: string;
      nivel: number;
    };
  };
  createdAt: string;
  updatedAt: string;
}

// Tipos de grupo
export interface Group {
  _id: string;
  nombre: string;
  descripcion?: string;
  account: string;
  creadoPor: string;
  usuarios: string[];
  permisos?: string[];
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

// Tipos de evento
export interface Event {
  _id: string;
  titulo: string;
  descripcion?: string;
  fecha: string;
  hora?: string;
  ubicacion?: string;
  account: string;
  creadoPor: string;
  participantes: string[];
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

// Tipos de rol
export interface Role {
  _id: string;
  nombre: string;
  descripcion: string;
  permisos: string[];
  nivel: number;
  activo: boolean;
  esRolSistema: boolean;
  createdAt: string;
  updatedAt: string;
}

// Tipos de asociación
export interface Association {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  account: {
    _id: string;
    nombre: string;
    razonSocial: string;
  };
  role: {
    _id: string;
    nombre: string;
  };
  division?: {
    _id: string;
    nombre: string;
    descripcion: string;
  };
  status: 'pending' | 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Asistencia {
  _id: string;
  alumno: {
    _id: string;
    name: string;
    email: string;
  };
  account: {
    _id: string;
    nombre: string;
    razonSocial: string;
  };
  grupo: {
    _id: string;
    nombre: string;
    descripcion: string;
  };
  fecha: string;
  estado: 'presente' | 'ausente' | 'justificado' | 'tardanza';
  horaLlegada?: string;
  horaSalida?: string;
  observaciones?: string;
  registradoPor: {
    _id: string;
    name: string;
    email: string;
  };
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  _id: string;
  usuario: {
    _id: string;
    name: string;
    email: string;
  };
  account: {
    _id: string;
    nombre: string;
    razonSocial: string;
  };
  tipo: 'login' | 'logout' | 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'register';
  entidad: 'user' | 'account' | 'group' | 'event' | 'asistencia' | 'association';
  entidadId?: string;
  descripcion: string;
  datos?: any;
  ip?: string;
  userAgent?: string;
  activo: boolean;
  estado: 'borrador' | 'publicada';
  createdAt: string;
  updatedAt: string;
}

// Tipo de respuesta de login
export interface LoginResponse {
  token: string;
  user: User;
  associations: Association[];
} 