import { apiClient } from '../config/api';

export interface StudentAction {
  _id: string;
  nombre: string;
  descripcion?: string;
  division: {
    _id: string;
    nombre: string;
  };
  account: {
    _id: string;
    nombre: string;
  };
  categoria: 'alimentacion' | 'sueño' | 'higiene' | 'juego' | 'aprendizaje' | 'social' | 'otro';
  icono: string;
  color: string;
  activo: boolean;
  orden: number;
  creadoPor: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudentActionRequest {
  nombre: string;
  descripcion?: string;
  division: string;
  categoria: 'alimentacion' | 'sueño' | 'higiene' | 'juego' | 'aprendizaje' | 'social' | 'otro';
  icono?: string;
  color?: string;
  orden?: number;
}

export interface UpdateStudentActionRequest {
  nombre?: string;
  descripcion?: string;
  categoria?: 'alimentacion' | 'sueño' | 'higiene' | 'juego' | 'aprendizaje' | 'social' | 'otro';
  icono?: string;
  color?: string;
  orden?: number;
  activo?: boolean;
}

export interface StudentActionLog {
  _id: string;
  estudiante: {
    _id: string;
    nombre: string;
    apellido: string;
  };
  accion: {
    _id: string;
    nombre: string;
    descripcion?: string;
    categoria: string;
    icono: string;
    color: string;
  };
  registradoPor: {
    _id: string;
    name: string;
    email: string;
  };
  fechaAccion: string;
  comentarios?: string;
  imagenes: string[];
  estado: 'registrado' | 'confirmado' | 'rechazado';
  createdAt: string;
  updatedAt: string;
}

export const studentActionService = {
  // Obtener todas las acciones
  async getAllActions(): Promise<StudentAction[]> {
    try {
      const response = await apiClient.get('/api/student-actions');
      return response.data.data;
    } catch (error) {
      console.error('Error obteniendo todas las acciones:', error);
      throw error;
    }
  },

  // Obtener acciones por división
  async getActionsByDivision(divisionId: string): Promise<StudentAction[]> {
    try {
      const response = await apiClient.get(`/api/student-actions/division/${divisionId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error obteniendo acciones por división:', error);
      throw error;
    }
  },

  // Crear nueva acción
  async createAction(actionData: CreateStudentActionRequest): Promise<StudentAction> {
    try {
      const response = await apiClient.post('/api/student-actions', actionData);
      return response.data.data;
    } catch (error) {
      console.error('Error creando acción:', error);
      throw error;
    }
  },

  // Actualizar acción
  async updateAction(actionId: string, actionData: UpdateStudentActionRequest): Promise<StudentAction> {
    try {
      const response = await apiClient.put(`/api/student-actions/${actionId}`, actionData);
      return response.data.data;
    } catch (error) {
      console.error('Error actualizando acción:', error);
      throw error;
    }
  },

  // Eliminar acción
  async deleteAction(actionId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/student-actions/${actionId}`);
    } catch (error) {
      console.error('Error eliminando acción:', error);
      throw error;
    }
  },

  // Registrar acción diaria
  async logAction(logData: {
    estudiante: string;
    accion: string;
    comentarios?: string;
    imagenes?: string[];
  }): Promise<StudentActionLog> {
    try {
      const response = await apiClient.post('/api/student-actions/log', logData);
      return response.data.data;
    } catch (error) {
      console.error('Error registrando acción:', error);
      throw error;
    }
  },

  // Obtener acciones de un estudiante
  async getStudentActions(studentId: string, fecha?: string): Promise<StudentActionLog[]> {
    try {
      const params = fecha ? { fecha } : {};
      const response = await apiClient.get(`/api/student-actions/log/student/${studentId}`, { params });
      return response.data.data;
    } catch (error) {
      console.error('Error obteniendo acciones del estudiante:', error);
      throw error;
    }
  }
};

// Categorías predefinidas con iconos y colores
export const ACTION_CATEGORIES = {
  alimentacion: {
    label: 'Alimentación',
    icon: '🍽️',
    color: '#FF6B6B',
    examples: ['Comió todo', 'No quiso comer', 'Bebió agua', 'Comió fruta']
  },
  sueño: {
    label: 'Sueño',
    icon: '😴',
    color: '#4ECDC4',
    examples: ['Se durmió', 'Se despertó', 'Durmió la siesta', 'No quiso dormir']
  },
  higiene: {
    label: 'Higiene',
    icon: '🧼',
    color: '#45B7D1',
    examples: ['Se hizo caca', 'Se lavó las manos', 'Se cambió de ropa', 'Se cepilló los dientes']
  },
  juego: {
    label: 'Juego',
    icon: '🧸',
    color: '#96CEB4',
    examples: ['Jugó con bloques', 'Pintó', 'Jugó con pelota', 'Armó rompecabezas']
  },
  aprendizaje: {
    label: 'Aprendizaje',
    icon: '📚',
    color: '#FFEAA7',
    examples: ['Aprendió una canción', 'Reconoció colores', 'Contó hasta 5', 'Dijo una palabra nueva']
  },
  social: {
    label: 'Social',
    icon: '👥',
    color: '#DDA0DD',
    examples: ['Jugó con compañeros', 'Ayudó a un amigo', 'Compartió juguetes', 'Dio un abrazo']
  },
  otro: {
    label: 'Otro',
    icon: '📝',
    color: '#95A5A6',
    examples: ['Acción personalizada', 'Comportamiento especial', 'Nota importante']
  }
};

// Iconos disponibles
export const AVAILABLE_ICONS = [
  '🍽️', '😴', '🧼', '🧸', '📚', '👥', '👶', '🎨', '🏃', '🎵',
  '💩', '🚽', '🧴', '🦷', '🛁', '👕', '👖', '🧦', '👟', '🎪',
  '🎭', '🎨', '🖍️', '✏️', '📝', '📖', '🎲', '🧩', '🎯', '🏆',
  '❤️', '🤗', '👏', '👍', '😊', '😢', '😴', '🤒', '🤧', '🤕'
];
