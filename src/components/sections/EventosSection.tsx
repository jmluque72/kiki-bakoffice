import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock,
  Building2,
  AlertCircle,
  Loader2,
  Plus
} from 'lucide-react';
import { useEvents, Event } from '../../hooks/useEvents';
import { Notification } from '../Notification';
import { useAuth } from '../../hooks/useAuth';
import { useDivisions } from '../../hooks/useDivisions';
import { EventsCalendar } from '../EventsCalendar';
import { EventDayModal } from '../EventDayModal';
import { CreateEventModal } from '../CreateEventModal';

export const EventosSection: React.FC = () => {
  const { user } = useAuth();
  const { divisions, loading: divisionsLoading, error: divisionsError } = useDivisions();

  console.log('📅 [EVENTOS] Componente renderizado');
  console.log('📅 [EVENTOS] User:', user);
  console.log('📅 [EVENTOS] Divisions:', divisions);
  console.log('📅 [EVENTOS] Divisions loading:', divisionsLoading);
  console.log('📅 [EVENTOS] Divisions error:', divisionsError);
  
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedDateEvents, setSelectedDateEvents] = useState<Event[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const [refreshKey, setRefreshKey] = useState(0);

  // Manejar selección de división
  const handleDivisionChange = (divisionId: string) => {
    setSelectedDivision(divisionId);
  };

  // Manejar click en un día del calendario
  const handleDateClick = (date: string, events: Event[]) => {
    console.log('📅 [EVENTOS] handleDateClick llamado');
    console.log('📅 [EVENTOS] Fecha:', date);
    console.log('📅 [EVENTOS] Eventos recibidos:', events);
    console.log('📅 [EVENTOS] Cantidad de eventos:', events.length);
    
    setSelectedDate(date);
    setSelectedDateEvents(events);
    setShowEventModal(true);
    
    console.log('📅 [EVENTOS] Modal abierto:', true);
  };

  // Cerrar modal del día
  const handleCloseEventModal = () => {
    setShowEventModal(false);
    setSelectedDate('');
    setSelectedDateEvents([]);
  };

  // Manejar creación de evento
  const handleCreateEvent = () => {
    setShowCreateModal(true);
  };

  // Manejar evento creado
  const handleEventCreated = () => {
    setShowNotification(true);
    setNotificationMessage('Evento creado exitosamente');
    setNotificationType('success');
    // Refrescar el calendario para mostrar el nuevo evento
    setRefreshKey(prev => prev + 1);
  };

  // Cerrar notificación
  const handleCloseNotification = () => {
    setShowNotification(false);
  };

  // Si no hay usuario, mostrar mensaje
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Cargando usuario...
          </h3>
          <p className="text-gray-500">
            Por favor espera mientras se carga la información.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calendar className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Eventos</h2>
            <p className="text-gray-600">Consulta y gestión de eventos por división</p>
          </div>
        </div>
        <button
          onClick={handleCreateEvent}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Crear Evento</span>
        </button>
      </div>

      {/* Error de divisiones */}
      {divisionsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">{divisionsError}</p>
          </div>
        </div>
      )}

      {/* Selector de División */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Building2 className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Seleccionar División</h3>
        </div>
        
        {divisionsLoading ? (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-gray-600">Cargando divisiones...</span>
          </div>
        ) : divisions.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              No hay divisiones disponibles
            </h4>
            <p className="text-gray-500">
              No se encontraron divisiones para tu institución.
            </p>
          </div>
        ) : (
          <div className="max-w-md">
            <label htmlFor="division-select" className="block text-sm font-medium text-gray-700 mb-2">
              División
            </label>
            <select
              id="division-select"
              value={selectedDivision}
              onChange={(e) => handleDivisionChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">Selecciona una división</option>
              {divisions.map((division) => (
                <option key={division._id} value={division._id}>
                  {division.nombre}
                </option>
              ))}
            </select>
            {selectedDivision && (
              <p className="mt-2 text-sm text-gray-600">
                División seleccionada: {divisions.find(d => d._id === selectedDivision)?.nombre}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Calendario de Eventos */}
      {selectedDivision && (
        <>
          {console.log('📅 [EVENTOS_SECTION] Renderizando EventsCalendar con división:', selectedDivision)}
          <EventsCalendar
            key={refreshKey}
            selectedDivision={selectedDivision}
            onDateClick={handleDateClick}
          />
        </>
      )}

      {/* Modal de Eventos del Día */}
      <EventDayModal
        isOpen={showEventModal}
        onClose={handleCloseEventModal}
        date={selectedDate}
        events={selectedDateEvents}
      />

      {/* Modal de Crear Evento */}
      <CreateEventModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onEventCreated={handleEventCreated}
      />

      {/* Notificación */}
      {showNotification && (
        <Notification
          message={notificationMessage}
          type={notificationType}
          onClose={handleCloseNotification}
        />
      )}
    </div>
  );
};