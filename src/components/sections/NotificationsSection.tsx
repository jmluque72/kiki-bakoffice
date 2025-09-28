import React, { useState, useEffect } from 'react';
import { Bell, Send, Plus, Calendar, List } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { useDivisions } from '../../hooks/useDivisions';
import { Notification } from '../../services/notificationService';
import { SendNotificationModal } from '../SendNotificationModal';
import { NotificationsCalendar } from '../NotificationsCalendar';
import { NotificationDayModal } from '../NotificationDayModal';

export const NotificationsSection: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role?.nombre === 'superadmin';
  const canSendNotifications = !isSuperAdmin; // Solo superadmin no puede enviar
  
  // Estados para vista de calendario
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedDateNotifications, setSelectedDateNotifications] = useState<Notification[]>([]);
  const [showSendModal, setShowSendModal] = useState(false);

  // Hook personalizado para notificaciones
  const {
    notifications,
    loading,
    error,
    calendarData,
    selectedDivision,
    loadNotifications,
    loadCalendarData,
    setSelectedDivision,
    clearError
  } = useNotifications();

  // Hook para divisiones
  const { divisions, loading: divisionsLoading } = useDivisions();

  // Cargar datos iniciales
  useEffect(() => {
    if (selectedDivision) {
      loadCalendarData(selectedDivision);
    }
  }, [selectedDivision, loadCalendarData]);

  // Manejar cambio de división
  const handleDivisionChange = (divisionId: string | null) => {
    console.log('📅 [NOTIFICATIONS] Cambiando división:', divisionId);
    setSelectedDivision(divisionId);
    if (divisionId) {
      loadCalendarData(divisionId);
    }
  };

  // Manejar click en día del calendario
  const handleDateClick = (date: string, notifications: Notification[]) => {
    console.log('📅 [NOTIFICATIONS] Click en fecha:', date);
    console.log('📅 [NOTIFICATIONS] Notificaciones del día:', notifications.length);
    setSelectedDate(date);
    setSelectedDateNotifications(notifications);
    setShowNotificationModal(true);
  };

  // Cerrar modal de notificaciones del día
  const handleCloseNotificationModal = () => {
    setShowNotificationModal(false);
    setSelectedDate('');
    setSelectedDateNotifications([]);
  };

  // Manejar envío de notificación
  const handleNotificationSent = () => {
    setShowSendModal(false);
    // Recargar datos del calendario
    if (selectedDivision) {
      loadCalendarData(selectedDivision);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bell className="w-8 h-8 text-orange-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
            <p className="text-gray-600">Gestiona las notificaciones por división</p>
          </div>
        </div>
        
        {canSendNotifications && (
          <button
            onClick={() => setShowSendModal(true)}
            className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>Enviar Notificación</span>
          </button>
        )}
      </div>

      {/* Selector de división */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtrar por División</h2>
        <div className="flex items-center space-x-4">
          <select
            value={selectedDivision || ''}
            onChange={(e) => handleDivisionChange(e.target.value || null)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            disabled={divisionsLoading}
          >
            <option value="">Todas las divisiones</option>
            {divisions.map((division) => (
              <option key={division._id} value={division._id}>
                {division.nombre}
              </option>
            ))}
          </select>
          
          {divisionsLoading && (
            <div className="text-sm text-gray-500">Cargando divisiones...</div>
          )}
        </div>
      </div>

      {/* Selector de vista */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Vista de Notificaciones</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Calendario</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Lista</span>
            </button>
          </div>
        </div>

        {/* Contenido según la vista seleccionada */}
        {viewMode === 'calendar' ? (
          <div>
            {!selectedDivision ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">Selecciona una división para ver el calendario</p>
                <p className="text-gray-400 text-sm">El calendario mostrará las notificaciones de la división seleccionada</p>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                <span className="ml-3 text-gray-600">Cargando calendario...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-500 mb-2">Error al cargar el calendario</div>
                <div className="text-gray-600 mb-4">{error}</div>
                <button
                  onClick={() => {
                    clearError();
                    if (selectedDivision) {
                      loadCalendarData(selectedDivision);
                    }
                  }}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Reintentar
                </button>
              </div>
            ) : (
              <NotificationsCalendar
                calendarData={calendarData}
                onDateClick={handleDateClick}
                selectedDivision={selectedDivision}
              />
            )}
          </div>
        ) : (
          <div>
            {!selectedDivision ? (
              <div className="text-center py-12">
                <List className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">Selecciona una división para ver las notificaciones</p>
                <p className="text-gray-400 text-sm">La lista mostrará las notificaciones de la división seleccionada</p>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                <span className="ml-3 text-gray-600">Cargando notificaciones...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-500 mb-2">Error al cargar las notificaciones</div>
                <div className="text-gray-600 mb-4">{error}</div>
                <button
                  onClick={() => {
                    clearError();
                    loadNotifications();
                  }}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Reintentar
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No hay notificaciones disponibles</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div key={notification._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {notification.title}
                          </h3>
                          <p className="text-gray-700 text-sm leading-relaxed mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="font-medium">Tipo:</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              notification.type === 'informacion' ? 'bg-blue-100 text-blue-800' :
                              notification.type === 'comunicacion' ? 'bg-green-100 text-green-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {notification.type}
                            </span>
                            <span className="font-medium">Prioridad:</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              notification.priority === 'high' ? 'bg-red-100 text-red-800' :
                              notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {notification.priority}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500 ml-4">
                          {new Date(notification.sentAt).toLocaleDateString('es-ES')}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal para enviar notificación */}
      {showSendModal && (
        <SendNotificationModal
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          onNotificationSent={handleNotificationSent}
        />
      )}

      {/* Modal para mostrar notificaciones del día */}
      <NotificationDayModal
        isOpen={showNotificationModal}
        onClose={handleCloseNotificationModal}
        date={selectedDate}
        notifications={selectedDateNotifications}
      />
    </div>
  );
};