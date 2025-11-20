import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  FileText, 
  Download, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Upload,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Document } from '../../services/documentService';
import documentService from '../../services/documentService';
import { useAuth } from '../../hooks/useAuth';

interface DocumentsSectionProps {
  isReadonly?: boolean;
}

export const DocumentsSection: React.FC<DocumentsSectionProps> = ({ isReadonly = false }) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  
  // Debug: verificar si el usuario se está cargando
  console.log('🔍 [DocumentsSection] User from useAuth:', user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);

  // Estados para el formulario
  const [formData, setFormData] = useState({
    titulo: '',
    file: null as File | null
  });

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Debug: ver qué datos tiene el usuario
      console.log('User data:', user);
      console.log('User account:', user?.account);
      
      // Solo adminaccount puede gestionar documentos
      if (user?.role?.nombre !== 'adminaccount') {
        throw new Error('No tienes permisos para gestionar documentos');
      }
      
      if (!user?.account?._id) {
        throw new Error('No se encontró institución');
      }

      const docs = await documentService.getDocuments(user.account._id);
      setDocuments(docs);
    } catch (err: any) {
      console.error('Error al cargar documentos:', err);
      setError(err.message || 'Error al cargar documentos');
    } finally {
      setLoading(false);
    }
  };


  const handleCreateDocument = async () => {
    try {
      console.log('Creating document with user:', user);
      console.log('User account:', user?.account);
      
      if (!user?.account?._id) {
        throw new Error('No se encontró institución');
      }

      if (!formData.titulo || !formData.file) {
        throw new Error('Todos los campos son obligatorios');
      }

      await documentService.createDocument(formData, user.account._id);
      
      setFormData({ titulo: '', file: null });
      setShowCreateModal(false);
      await loadDocuments();
    } catch (err: any) {
      console.error('Error al crear documento:', err);
      setError(err.message || 'Error al crear documento');
    }
  };

  const handleEditDocument = async () => {
    try {
      if (!editingDocument) return;

      const updateData: any = {};
      if (formData.titulo) updateData.titulo = formData.titulo;
      if (formData.file) updateData.file = formData.file;

      await documentService.updateDocument(editingDocument._id, updateData);
      
      setFormData({ titulo: '', file: null });
      setEditingDocument(null);
      setShowEditModal(false);
      await loadDocuments();
    } catch (err: any) {
      console.error('Error al actualizar documento:', err);
      setError(err.message || 'Error al actualizar documento');
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este documento?')) return;

    try {
      await documentService.deleteDocument(id);
      await loadDocuments();
    } catch (err: any) {
      console.error('Error al eliminar documento:', err);
      setError(err.message || 'Error al eliminar documento');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await documentService.toggleDocumentStatus(id, !currentStatus);
      await loadDocuments();
    } catch (err: any) {
      console.error('Error al cambiar estado del documento:', err);
      setError(err.message || 'Error al cambiar estado del documento');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, file });
    }
  };

  const openEditModal = (document: Document) => {
    setEditingDocument(document);
    setFormData({
      titulo: document.titulo,
      file: null
    });
    setShowEditModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  // Verificar permisos
  if (user?.role?.nombre !== 'adminaccount') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Acceso denegado</h3>
          <p className="text-gray-600">Solo los administradores de institución pueden gestionar documentos</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
          <p className="text-gray-600">Gestiona los documentos de tu institución</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Documento
        </button>
      </div>


      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Lista de documentos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay documentos</h3>
            <p className="text-gray-600">Comienza subiendo tu primer documento</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subido por
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((doc) => (
                  <tr key={doc._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-blue-600 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{doc.titulo}</div>
                          <div className="text-sm text-gray-500">PDF</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(doc._id, doc.activo)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          doc.activo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {doc.activo ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Activo
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Inactivo
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {doc.subidoPor.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(doc.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => openEditModal(doc)}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(doc._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de crear documento */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Nuevo Documento</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Términos y Condiciones 2024"
                />
              </div>


              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Archivo PDF
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateDocument}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de editar documento */}
      {showEditModal && editingDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Editar Documento</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>


              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nuevo archivo (opcional)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Deja vacío para mantener el archivo actual
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditDocument}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
