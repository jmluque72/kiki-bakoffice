import { apiClient } from '../config/api';

export interface Document {
  _id: string;
  titulo: string;
  tipo: string;
  fileUrl: string;
  institucion: {
    _id: string;
    nombre: string;
  };
  subidoPor: {
    _id: string;
    nombre: string;
    email: string;
  };
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentType {
  value: string;
  label: string;
}

export interface CreateDocumentData {
  titulo: string;
  file: File;
}

class DocumentService {
  /**
   * Obtener todos los documentos de una institución
   */
  async getDocuments(institucionId: string): Promise<Document[]> {
    try {
      const params = new URLSearchParams({ institucionId });

      const response = await apiClient.get(`/api/documents?${params.toString()}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Error al obtener documentos');
      }
    } catch (error: any) {
      console.error('Error al obtener documentos:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener documentos');
    }
  }

  /**
   * Obtener tipos de documentos disponibles
   */
  async getDocumentTypes(): Promise<DocumentType[]> {
    try {
      const response = await apiClient.get('/api/documents/types');
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Error al obtener tipos de documentos');
      }
    } catch (error: any) {
      console.error('Error al obtener tipos de documentos:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener tipos de documentos');
    }
  }

  /**
   * Crear un nuevo documento
   */
  async createDocument(data: CreateDocumentData, institucionId: string): Promise<Document> {
    try {
      const formData = new FormData();
      formData.append('titulo', data.titulo);
      formData.append('tipo', 'terminos_condiciones'); // Tipo fijo
      formData.append('institucionId', institucionId);
      formData.append('archivo', data.file);

      const response = await apiClient.post('/api/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Error al crear documento');
      }
    } catch (error: any) {
      console.error('Error al crear documento:', error);
      throw new Error(error.response?.data?.message || 'Error al crear documento');
    }
  }

  /**
   * Actualizar un documento
   */
  async updateDocument(id: string, data: Partial<CreateDocumentData>): Promise<Document> {
    try {
      const formData = new FormData();
      
      if (data.titulo) formData.append('titulo', data.titulo);
      if (data.file) formData.append('file', data.file);

      const response = await apiClient.put(`/documents/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Error al actualizar documento');
      }
    } catch (error: any) {
      console.error('Error al actualizar documento:', error);
      throw new Error(error.response?.data?.message || 'Error al actualizar documento');
    }
  }

  /**
   * Eliminar un documento
   */
  async deleteDocument(id: string): Promise<void> {
    try {
      const response = await apiClient.delete(`/documents/${id}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al eliminar documento');
      }
    } catch (error: any) {
      console.error('Error al eliminar documento:', error);
      throw new Error(error.response?.data?.message || 'Error al eliminar documento');
    }
  }

  /**
   * Activar/desactivar un documento
   */
  async toggleDocumentStatus(id: string, activo: boolean): Promise<Document> {
    try {
      const response = await apiClient.patch(`/documents/${id}/status`, { activo });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Error al actualizar estado del documento');
      }
    } catch (error: any) {
      console.error('Error al actualizar estado del documento:', error);
      throw new Error(error.response?.data?.message || 'Error al actualizar estado del documento');
    }
  }
}

const documentService = new DocumentService();
export default documentService;
export { DocumentService };
