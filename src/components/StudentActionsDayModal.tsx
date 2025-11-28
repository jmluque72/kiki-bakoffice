import React from 'react';
import { 
  X, 
  Clock, 
  User,
  Calendar,
  MessageSquare,
  Image as ImageIcon
} from 'lucide-react';
import { StudentActionLog } from '../services/studentActionService';

interface StudentActionsDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  actions: StudentActionLog[];
}

export const StudentActionsDayModal: React.FC<StudentActionsDayModalProps> = ({
  isOpen,
  onClose,
  date,
  actions
}) => {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Acciones del {formatDate(date)}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {actions.length} {actions.length === 1 ? 'acción registrada' : 'acciones registradas'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {actions.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">No hay acciones registradas para este día</p>
            </div>
          ) : (
            <div className="space-y-4">
              {actions.map((action) => (
                <div
                  key={action._id}
                  className="border-l-4 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  style={{ borderLeftColor: action.accion.color || '#0E5FCE' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg text-gray-900">
                          {action.accion.nombre}
                        </h3>
                        {action.valor && (
                          <span
                            className="px-2 py-1 text-xs font-medium rounded-full"
                            style={{
                              backgroundColor: `${action.accion.color}20`,
                              color: action.accion.color
                            }}
                          >
                            {action.valor}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>
                            {action.estudiante.nombre} {action.estudiante.apellido}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(action.fechaAccion)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>Registrado por: {action.registradoPor.name}</span>
                        </div>
                      </div>

                      {action.comentarios && (
                        <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                            <p className="text-sm text-gray-700">{action.comentarios}</p>
                          </div>
                        </div>
                      )}

                      {action.imagenes && action.imagenes.length > 0 && (
                        <div className="mt-2 flex items-center gap-1 text-sm text-gray-600">
                          <ImageIcon className="w-4 h-4" />
                          <span>{action.imagenes.length} imagen(es)</span>
                        </div>
                      )}

                      <div className="mt-2 flex items-center gap-2">
                        <span
                          className="px-2 py-1 text-xs font-medium rounded"
                          style={{
                            backgroundColor: action.estado === 'registrado' ? '#E3F2FD' : 
                                            action.estado === 'confirmado' ? '#E8F5E9' : '#FFEBEE',
                            color: action.estado === 'registrado' ? '#1976D2' : 
                                  action.estado === 'confirmado' ? '#388E3C' : '#D32F2F'
                          }}
                        >
                          {action.estado === 'registrado' ? 'Registrado' : 
                           action.estado === 'confirmado' ? 'Confirmado' : 'Rechazado'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

