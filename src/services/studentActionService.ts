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
  valores?: string[]; // Valores posibles que puede tomar la acción (ej: ["1 vez", "2 veces", "3 veces"] para "hizo caca")
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
  valores?: number[]; // Valores posibles que puede tomar la acción
}

export interface UpdateStudentActionRequest {
  nombre?: string;
  descripcion?: string;
  categoria?: 'alimentacion' | 'sueño' | 'higiene' | 'juego' | 'aprendizaje' | 'social' | 'otro';
  icono?: string;
  color?: string;
  orden?: number;
  activo?: boolean;
  valores?: number[]; // Valores posibles que puede tomar la acción
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
  valor?: string;
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
  },

  // Obtener acciones por división (para coordinadores)
  async getDivisionActions(divisionId: string, fecha?: string, fechaInicio?: string, fechaFin?: string): Promise<StudentActionLog[]> {
    try {
      const params: any = {};
      if (fecha) params.fecha = fecha;
      if (fechaInicio) params.fechaInicio = fechaInicio;
      if (fechaFin) params.fechaFin = fechaFin;
      
      console.log('🔍 [STUDENT ACTION SERVICE] Obteniendo acciones por división:', {
        divisionId,
        fecha,
        fechaInicio,
        fechaFin,
        params
      });
      
      const response = await apiClient.get(`/api/student-actions/log/division/${divisionId}`, { params });
      
      console.log('✅ [STUDENT ACTION SERVICE] Respuesta recibida:', {
        success: response.data.success,
        dataLength: response.data.data?.length || 0,
        data: response.data.data
      });
      
      return response.data.data || [];
    } catch (error: any) {
      console.error('❌ [STUDENT ACTION SERVICE] Error obteniendo acciones por división:', error);
      console.error('❌ [STUDENT ACTION SERVICE] Error response:', error.response?.data);
      console.error('❌ [STUDENT ACTION SERVICE] Error status:', error.response?.status);
      throw error;
    }
  },

  // Obtener datos del calendario para un mes (acciones agrupadas por fecha)
  async getCalendarData(divisionId: string, fechaInicio: string, fechaFin: string): Promise<{ [fecha: string]: number }> {
    try {
      console.log('📅 [STUDENT ACTION SERVICE] Obteniendo datos del calendario:', {
        divisionId,
        fechaInicio,
        fechaFin
      });
      
      const actions = await this.getDivisionActions(divisionId, undefined, fechaInicio, fechaFin);
      
      console.log('📊 [STUDENT ACTION SERVICE] Acciones obtenidas para calendario:', actions.length);
      
      // Agrupar por fecha (normalizando a fecha local)
      const calendarData: { [fecha: string]: number } = {};
      actions.forEach(action => {
        // Convertir a fecha local para evitar problemas de timezone
        const actionDate = new Date(action.fechaAccion);
        const year = actionDate.getFullYear();
        const month = String(actionDate.getMonth() + 1).padStart(2, '0');
        const day = String(actionDate.getDate()).padStart(2, '0');
        const fecha = `${year}-${month}-${day}`;
        calendarData[fecha] = (calendarData[fecha] || 0) + 1;
      });
      
      console.log('📊 [STUDENT ACTION SERVICE] Datos del calendario agrupados:', Object.keys(calendarData).length, 'días con acciones');
      console.log('📊 [STUDENT ACTION SERVICE] Desglose:', calendarData);
      
      return calendarData;
    } catch (error) {
      console.error('❌ [STUDENT ACTION SERVICE] Error obteniendo datos del calendario:', error);
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
