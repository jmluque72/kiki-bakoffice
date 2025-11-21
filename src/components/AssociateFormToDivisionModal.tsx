import React, { useState, useEffect } from 'react';
import { X, Link as LinkIcon, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { formRequestService, FormRequest } from '../services/formRequestService';
import { apiClient } from '../config/api';

interface AssociateFormToDivisionModalProps {
  formRequest: FormRequest;
  onClose: () => void;
}

interface Division {
  _id: string;
  nombre: string;
}

export const AssociateFormToDivisionModal: React.FC<AssociateFormToDivisionModalProps> = ({
  formRequest,
  onClose
}) => {
  const { user } = useAuth();
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [selectedDivisions, setSelectedDivisions] = useState<string[]>([]);
  const [requerido, setRequerido] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingDivisions, setLoadingDivisions] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDivisions();
    // Cargar divisiones ya asociadas
    if (formRequest.divisions) {
      setSelectedDivisions(formRequest.divisions.map(d => d._id));
    }
  }, [formRequest]);

  const getAccountId = (): string | null => {
    if (user?.role?.nombre === 'superadmin') {
      return formRequest.account._id;
    }
    if (user?.role?.nombre === 'adminaccount' && user?.associations?.length > 0) {
      return user.associations[0].account._id;
    }
    return user?.account?._id || null;
  };

  const loadDivisions = async () => {
    try {
      setLoadingDivisions(true);
      const accountId = getAccountId();
      if (!accountId) {
        setError('No se pudo determinar la institución');
        return;
      }

      const response = await apiClient.get(`/divisions/account/${accountId}`);
      if (response.data.success) {
        setDivisions(response.data.data);
      }
    } catch (err: any) {
      console.error('Error cargando divisiones:', err);
      setError('Error al cargar divisiones');
    } finally {
      setLoadingDivisions(false);
    }
  };

  const handleToggleDivision = (divisionId: string) => {
    setSelectedDivisions(prev => {
      if (prev.includes(divisionId)) {
        return prev.filter(id => id !== divisionId);
      } else {
        return [...prev, divisionId];
      }
    });
  };

  const handleSubmit = async () => {
    if (selectedDivisions.length === 0) {
      setError('Debes seleccionar al menos una división');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Asociar a cada división seleccionada
      for (const divisionId of selectedDivisions) {
        await formRequestService.associateFormToDivision(formRequest._id, {
          divisionId,
          requerido
        });
      }

      onClose();
    } catch (err: any) {
      // Extraer el mensaje del servidor si está disponible
      const errorMessage = err.response?.data?.message || err.message || 'Error al asociar formulario';
      setError(errorMessage);
      console.error('Error al asociar formulario:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <LinkIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">
              Asociar Formulario a División
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {formRequest.nombre}
            </h3>
            {formRequest.descripcion && (
              <p className="text-sm text-gray-600">{formRequest.descripcion}</p>
            )}
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {loadingDivisions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Cargando divisiones...</span>
            </div>
          ) : divisions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No hay divisiones disponibles</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Divisiones
                </label>
                <div className="border border-gray-200 rounded-md max-h-64 overflow-y-auto">
                  {divisions.map((division) => (
                    <label
                      key={division._id}
                      className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDivisions.includes(division._id)}
                        onChange={() => handleToggleDivision(division._id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-3 text-sm text-gray-900">
                        {division.nombre}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requerido"
                  checked={requerido}
                  onChange={(e) => setRequerido(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="requerido" className="ml-2 text-sm text-gray-700">
                  Marcar como requerido
                </label>
              </div>
              <p className="text-xs text-gray-500">
                Los formularios requeridos deben ser completados antes de que el tutor pueda realizar otras acciones
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || selectedDivisions.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Asociando...</span>
              </>
            ) : (
              <span>Asociar</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

