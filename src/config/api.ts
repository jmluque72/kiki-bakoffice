import axios from 'axios';

// Configuración base del API
const API_BASE_URL = 'http://192.168.68.106:3000';

// Crear instancia de axios con configuración base
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kiki_token');
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

// Interceptor para manejar errores de respuesta
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido - solo limpiar localStorage
      // No recargar la página automáticamente
      localStorage.removeItem('kiki_token');
      localStorage.removeItem('backoffice_user');
      console.log('Token expirado o inválido - limpiando localStorage');
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
    PROFILE: '/api/users/profile',
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
    DELETE: (id: string) => `/api/activities/${id}`,
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
  createdAt: string;
  updatedAt: string;
}

// Tipo de respuesta de login
export interface LoginResponse {
  token: string;
  user: User;
  associations: Association[];
} 