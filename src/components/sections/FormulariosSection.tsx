import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Link as LinkIcon,
  Eye,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { formRequestService, FormRequest } from '../../services/formRequestService';
import { FormRequestWizard } from '../FormRequestWizard';
import { AssociateFormToDivisionModal } from '../AssociateFormToDivisionModal';
import { FormResponsesView } from '../FormResponsesView';

interface FormulariosSectionProps {
  isReadonly?: boolean;
}

export const FormulariosSection: React.FC<FormulariosSectionProps> = ({ isReadonly = false }) => {
  const { user } = useAuth();
  const [formRequests, setFormRequests] = useState<FormRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [showAssociateModal, setShowAssociateModal] = useState(false);
  const [showResponsesView, setShowResponsesView] = useState(false);
  const [selectedForm, setSelectedForm] = useState<FormRequest | null>(null);
  const [editingForm, setEditingForm] = useState<FormRequest | null>(null);

  // Obtener accountId según el rol
  const getAccountId = (): string | null => {
    if (user?.role?.nombre === 'superadmin') {
      // Superadmin puede ver todas las instituciones, pero necesitamos un accountId
      // Por ahora, retornamos null y manejamos esto en el loadFormRequests
      return null;
    }
    if (user?.role?.nombre === 'adminaccount' && user?.associations?.length > 0) {
      return user.associations[0].account._id;
    }
    return user?.account?._id || null;
  };

  const loadFormRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const accountId = getAccountId();
      if (!accountId) {
        setError('No se pudo determinar la institución');
        setLoading(false);
        return;
      }

      const forms = await formRequestService.getFormRequestsByAccount(accountId);
      setFormRequests(forms);
    } catch (err: any) {
      console.error('Error cargando formularios:', err);
      setError(err.message || 'Error al cargar formularios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadFormRequests();
    }
  }, [user]);

  const handleCreateForm = () => {
    setEditingForm(null);
    setShowWizard(true);
  };

  const handleEditForm = (form: FormRequest) => {
    setEditingForm(form);
    setShowWizard(true);
  };

  const handleDeleteForm = async (formId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este formulario? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await formRequestService.deleteFormRequest(formId);
      await loadFormRequests();
    } catch (err: any) {
      alert('Error al eliminar formulario: ' + (err.message || 'Error desconocido'));
    }
  };

  const handleAssociateForm = (form: FormRequest) => {
    setSelectedForm(form);
    setShowAssociateModal(true);
  };

  const handleViewResponses = (form: FormRequest) => {
    setSelectedForm(form);
    setShowResponsesView(true);
  };

  const handleWizardClose = () => {
    setShowWizard(false);
    setEditingForm(null);
    loadFormRequests();
  };

  const handleAssociateClose = () => {
    setShowAssociateModal(false);
    setSelectedForm(null);
    loadFormRequests();
  };

  const handleResponsesClose = () => {
    setShowResponsesView(false);
    setSelectedForm(null);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'publicado') {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          Publicado
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
        Borrador
      </span>
    );
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Cargando usuario...
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileText className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Formularios</h2>
            <p className="text-gray-600">Gestiona los formularios para tutores</p>
          </div>
        </div>
        {!isReadonly && (
          <button
            onClick={handleCreateForm}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Formulario</span>
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Tabla de formularios */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Cargando formularios...</span>
          </div>
        ) : formRequests.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay formularios
            </h3>
            <p className="text-gray-500 mb-4">
              Crea tu primer formulario para comenzar
            </p>
            {!isReadonly && (
              <button
                onClick={handleCreateForm}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Crear Formulario
              </button>
            )}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preguntas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Divisiones
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {formRequests.map((form) => (
                <tr key={form._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{form.nombre}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 max-w-md truncate">
                      {form.descripcion || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(form.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{form.preguntas.length}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {form.divisions?.length || 0} división(es)
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleViewResponses(form)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Ver respuestas"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {!isReadonly && (
                        <>
                          <button
                            onClick={() => handleAssociateForm(form)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Asociar a división"
                          >
                            <LinkIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditForm(form)}
                            className="text-indigo-600 hover:text-indigo-900 p-1"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteForm(form._id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Wizard Modal */}
      {showWizard && (
        <FormRequestWizard
          form={editingForm}
          onClose={handleWizardClose}
        />
      )}

      {/* Associate Modal */}
      {showAssociateModal && selectedForm && (
        <AssociateFormToDivisionModal
          formRequest={selectedForm}
          onClose={handleAssociateClose}
        />
      )}

      {/* Responses View */}
      {showResponsesView && selectedForm && (
        <FormResponsesView
          formRequest={selectedForm}
          onClose={handleResponsesClose}
        />
      )}
    </div>
  );
};

