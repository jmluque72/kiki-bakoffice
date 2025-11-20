import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Users, CheckSquare, AlertCircle, Loader2 } from 'lucide-react';
import { useEvents } from '../hooks/useEvents';
import { useAuth } from '../hooks/useAuth';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: () => void;
  selectedDivision?: string; // División seleccionada desde el calendario
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose, onEventCreated, selectedDivision }) => {
  const { user } = useAuth();
  const { createEvent, loading: createLoading, error: createError, clearError } = useEvents();

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('09:00');
  const [lugar, setLugar] = useState('');
  const [requiereAutorizacion, setRequiereAutorizacion] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setTitulo('');
      setDescripcion('');
      setFecha(new Date().toISOString().split('T')[0]); // Default to today
      setHora('09:00');
      setLugar('');
      setRequiereAutorizacion(false);
      setFormError(null);
      clearError();
    }
  }, [isOpen, clearError]);

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push(timeString);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('🚀 [CREATE_EVENT] handleSubmit llamado');
    e.preventDefault();
    setFormError(null);
    clearError();

    console.log('🚀 [CREATE_EVENT] Datos del formulario:', {
      titulo,
      descripcion,
      fecha,
      hora,
      lugar,
      selectedDivision,
      requiereAutorizacion,
      userAccount: user?.account?._id
    });

    if (!titulo || !descripcion || !fecha || !hora) {
      console.log('❌ [CREATE_EVENT] Campos obligatorios faltantes');
      setFormError('Por favor, completa todos los campos obligatorios (Título, Descripción, Fecha, Hora).');
      return;
    }

    if (!selectedDivision) {
      console.log('❌ [CREATE_EVENT] No hay división seleccionada');
      setFormError('Por favor, selecciona una división en el calendario antes de crear un evento.');
      return;
    }

    // Para adminaccount, usar la cuenta del usuario, para otros roles usar una cuenta por defecto
    let institucionId = user?.account?._id;
    
    if (!institucionId) {
      // Si no hay account en el usuario, usar una cuenta por defecto
      // Esto puede pasar con roles como superadmin
      console.log('⚠️ [CREATE_EVENT] Usuario sin account, usando cuenta por defecto');
      institucionId = '68d47433390104381d43c0ca'; // ID de cuenta por defecto
    }

    try {
      console.log('🚀 [CREATE_EVENT] Llamando a createEvent...');
      const success = await createEvent({
        titulo,
        descripcion,
        fecha,
        hora,
        lugar,
        institutionId: institucionId,
        divisionId: selectedDivision,
        requiereAutorizacion,
      });

      console.log('🚀 [CREATE_EVENT] Resultado de createEvent:', success);

      if (success) {
        console.log('✅ [CREATE_EVENT] Evento creado exitosamente');
        onEventCreated();
        onClose();
      } else {
        console.log('❌ [CREATE_EVENT] Error al crear evento:', createError);
        setFormError(createError || 'Error al crear el evento. Intenta de nuevo.');
      }
    } catch (err: any) {
      console.log('❌ [CREATE_EVENT] Error inesperado:', err);
      setFormError(err.message || 'Error inesperado al crear el evento.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Calendar className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Crear Nuevo Evento</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
          {!selectedDivision && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 px-4 py-3 rounded-lg mb-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
                <p className="text-sm text-yellow-700">
                  Por favor, selecciona una división en el calendario antes de crear un evento.
                </p>
              </div>
            </div>
          )}
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span className="block sm:inline">{formError}</span>
              </div>
            </div>
          )}

          {createError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span className="block sm:inline">{createError}</span>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Título */}
            <div>
              <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-2">
                Título del Evento *
              </label>
              <input
                type="text"
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ingresa el título del evento"
                required
              />
            </div>

            {/* Descripción */}
            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
                Descripción *
              </label>
              <textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe el evento..."
                required
              />
            </div>

            {/* Fecha y Hora */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha *
                </label>
                <input
                  type="date"
                  id="fecha"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="hora" className="block text-sm font-medium text-gray-700 mb-2">
                  Hora *
                </label>
                <select
                  id="hora"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {timeOptions.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lugar */}
            <div>
              <label htmlFor="lugar" className="block text-sm font-medium text-gray-700 mb-2">
                Lugar
              </label>
              <input
                type="text"
                id="lugar"
                value={lugar}
                onChange={(e) => setLugar(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ubicación del evento (opcional)"
              />
            </div>

            {/* Requiere Autorización */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="requiereAutorizacion"
                checked={requiereAutorizacion}
                onChange={(e) => setRequiereAutorizacion(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="requiereAutorizacion" className="text-sm font-medium text-gray-700">
                Requiere autorización de los padres
              </label>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={(e) => {
              console.log('🚀 [CREATE_EVENT] Botón clickeado');
              handleSubmit(e);
            }}
            disabled={createLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {createLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creando...</span>
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4" />
                <span>Crear Evento</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
