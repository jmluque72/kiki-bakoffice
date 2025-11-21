import { apiClient } from '../config/api';

export interface FormQuestion {
  _id?: string;
  tipo: 'texto' | 'opcion_multiple' | 'checkbox' | 'imagen' | 'archivo';
  texto: string;
  requerido: boolean;
  opciones?: string[];
  orden: number;
}

export interface FormRequest {
  _id: string;
  nombre: string;
  descripcion?: string;
  account: {
    _id: string;
    nombre: string;
    razonSocial: string;
  };
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  status: 'borrador' | 'publicado';
  preguntas: FormQuestion[];
  divisions?: Array<{
    _id: string;
    nombre: string;
    requerido: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface FormResponse {
  _id: string;
  formRequest: {
    _id: string;
    nombre: string;
    descripcion?: string;
  };
  student: {
    _id: string;
    nombre: string;
    apellido: string;
    dni: string;
  };
  tutor: {
    _id: string;
    name: string;
    email: string;
  };
  division: {
    _id: string;
    nombre: string;
  };
  respuestas: Array<{
    preguntaId: string;
    valor: string | string[];
  }>;
  completado: boolean;
  estado: 'en_progreso' | 'completado' | 'aprobado' | 'rechazado';
  fechaCompletado?: string;
  fechaAprobacion?: string;
  aprobadoPor?: {
    _id: string;
    name: string;
    email: string;
  };
  motivoRechazo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FormDivisionAssociation {
  _id: string;
  formRequest: {
    _id: string;
    nombre: string;
    descripcion?: string;
  };
  division: {
    _id: string;
    nombre: string;
  };
  account: {
    _id: string;
    nombre: string;
    razonSocial: string;
  };
  requerido: boolean;
  createdAt: string;
}

export interface CreateFormRequestData {
  nombre: string;
  descripcion?: string;
  status?: 'borrador' | 'publicado';
  preguntas: FormQuestion[];
}

export interface UpdateFormRequestData {
  nombre?: string;
  descripcion?: string;
  status?: 'borrador' | 'publicado';
  preguntas?: FormQuestion[];
}

export interface AssociateFormData {
  divisionId: string;
  requerido: boolean;
}

export const formRequestService = {
  // Obtener formularios de una cuenta
  async getFormRequestsByAccount(accountId: string, status?: string): Promise<FormRequest[]> {
    const params = status ? `?status=${status}` : '';
    const response = await apiClient.get(`/api/form-requests/account/${accountId}${params}`);
    return response.data.data;
  },

  // Obtener formulario por ID
  async getFormRequestById(formId: string): Promise<FormRequest> {
    const response = await apiClient.get(`/api/form-requests/${formId}`);
    return response.data.data;
  },

  // Crear formulario
  async createFormRequest(data: CreateFormRequestData): Promise<FormRequest> {
    const response = await apiClient.post('/api/form-requests', data);
    return response.data.data;
  },

  // Actualizar formulario
  async updateFormRequest(formId: string, data: UpdateFormRequestData): Promise<FormRequest> {
    const response = await apiClient.put(`/api/form-requests/${formId}`, data);
    return response.data.data;
  },

  // Eliminar formulario
  async deleteFormRequest(formId: string): Promise<void> {
    await apiClient.delete(`/api/form-requests/${formId}`);
  },

  // Asociar formulario a división
  async associateFormToDivision(formId: string, data: AssociateFormData): Promise<FormDivisionAssociation> {
    const response = await apiClient.post(`/api/form-requests/${formId}/associate-division`, data);
    return response.data.data;
  },

  // Obtener respuestas de un formulario
  async getFormResponses(formId: string, divisionId?: string): Promise<FormResponse[]> {
    const params = divisionId ? `?divisionId=${divisionId}` : '';
    const response = await apiClient.get(`/api/form-requests/${formId}/responses${params}`);
    return response.data.data;
  },

  // Obtener todas las respuestas de una división
  async getFormResponsesByDivision(divisionId: string): Promise<FormResponse[]> {
    const response = await apiClient.get(`/api/form-requests/responses/division/${divisionId}`);
    return response.data.data;
  },

  // Aprobar respuesta
  async approveFormResponse(responseId: string): Promise<FormResponse> {
    const response = await apiClient.put(`/api/form-requests/responses/${responseId}/approve`);
    return response.data.data;
  },

  // Rechazar respuesta
  async rejectFormResponse(responseId: string, motivoRechazo?: string): Promise<FormResponse> {
    const response = await apiClient.put(`/api/form-requests/responses/${responseId}/reject`, {
      motivoRechazo
    });
    return response.data.data;
  }
};

