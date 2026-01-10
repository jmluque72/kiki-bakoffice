import React, { useState, useEffect } from 'react';
import { Bell, Send, Plus, Calendar, List, Database, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { useDivisions } from '../../hooks/useDivisions';
import { Notification, NotificationService, PaginationInfo } from '../../services/notificationService';
import { SendNotificationModal } from '../SendNotificationModal';
import { NotificationsCalendar } from '../NotificationsCalendar';
import { NotificationDayModal } from '../NotificationDayModal';

interface NotificationsSectionProps {
  isReadonly?: boolean;
}

export const NotificationsSection: React.FC<NotificationsSectionProps> = ({ isReadonly = false }) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role?.nombre === 'superadmin';
  const canSendNotifications = !isSuperAdmin && !isReadonly; // Solo superadmin no puede enviar, o si está en modo readonly
  
  // Estados para vista de calendario
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'all'>('all');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedDateNotifications, setSelectedDateNotifications] = useState<Notification[]>([]);
  const [showSendModal, setShowSendModal] = useState(false);
  
  // Estados para la vista de todas las notificaciones
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [allNotificationsLoading, setAllNotificationsLoading] = useState(false);
  const [allNotificationsError, setAllNotificationsError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [currentPage, setCurrentPage] = useState(1);

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

  // Cargar todas las notificaciones de la institución
  const loadAllNotifications = async (page: number = 1) => {
    try {
      setAllNotificationsLoading(true);
      setAllNotificationsError(null);
      
      const result = await NotificationService.getBackofficeNotifications({
        limit: 20,
        skip: (page - 1) * 20
      });
      
      setAllNotifications(result.notifications);
      setPagination(result.pagination);
    } catch (err: any) {
      console.error('Error loading all notifications:', err);
      setAllNotificationsError(err.message || 'Error al cargar notificaciones');
    } finally {
      setAllNotificationsLoading(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    if (selectedDivision) {
      loadCalendarData(selectedDivision);
    }
  }, [selectedDivision, loadCalendarData]);

  // Cargar todas las notificaciones cuando se cambia a la vista "all"
  useEffect(() => {
    if (viewMode === 'all') {
      loadAllNotifications(currentPage);
    }
  }, [viewMode, currentPage]);

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
            <p className="text-gray-600">Gestiona las notificaciones de la institución</p>
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

      {/* Selector de división - Solo mostrar en vistas calendar y list */}
      {viewMode !== 'all' && (
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
      )}

      {/* Selector de vista */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Vista de Notificaciones</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('all')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'all'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Todas</span>
            </button>
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
        {viewMode === 'all' ? (
          <div>
            {allNotificationsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                <span className="ml-3 text-gray-600">Cargando notificaciones...</span>
              </div>
            ) : allNotificationsError ? (
              <div className="text-center py-12">
                <div className="text-red-500 mb-2">Error al cargar las notificaciones</div>
                <div className="text-gray-600 mb-4">{allNotificationsError}</div>
                <button
                  onClick={() => loadAllNotifications(currentPage)}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Reintentar
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {allNotifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No hay notificaciones disponibles</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {allNotifications.map((notification) => (
                        <div key={notification._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                {notification.title}
                              </h3>
                              <p className="text-gray-700 text-sm leading-relaxed mb-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center space-x-4 text-sm text-gray-600 flex-wrap gap-2">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">Tipo:</span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    notification.type === 'informacion' ? 'bg-blue-100 text-blue-800' :
                                    notification.type === 'comunicacion' ? 'bg-green-100 text-green-800' :
                                    notification.type === 'institucion' ? 'bg-purple-100 text-purple-800' :
                                    notification.type === 'coordinador' ? 'bg-orange-100 text-orange-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {notification.type}
                                  </span>
                                </div>
                                {notification.division && (
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium">División:</span>
                                    <span className="text-gray-700">{notification.division.nombre}</span>
                                  </div>
                                )}
                                {notification.sender && (
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium">Enviado por:</span>
                                    <span className="text-gray-700">{notification.sender.name || notification.sender.email}</span>
                                  </div>
                                )}
                                <div className="flex items-center space-x-2">
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
                            </div>
                            <div className="text-sm text-gray-500 ml-4 text-right">
                              <div>{new Date(notification.sentAt).toLocaleDateString('es-ES', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}</div>
                              <div className="text-xs text-gray-400 mt-1">
                                {new Date(notification.sentAt).toLocaleTimeString('es-ES', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Controles de paginación */}
                    {pagination.totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-600">
                          Mostrando {((currentPage - 1) * pagination.itemsPerPage) + 1} - {Math.min(currentPage * pagination.itemsPerPage, pagination.totalItems)} de {pagination.totalItems} notificaciones
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              const newPage = currentPage - 1;
                              setCurrentPage(newPage);
                            }}
                            disabled={!pagination.hasPrevPage}
                            className={`flex items-center space-x-1 px-4 py-2 rounded-lg transition-colors ${
                              pagination.hasPrevPage
                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            <ChevronLeft className="w-4 h-4" />
                            <span>Anterior</span>
                          </button>
                          <div className="text-sm text-gray-600 px-4">
                            Página {pagination.currentPage} de {pagination.totalPages}
                          </div>
                          <button
                            onClick={() => {
                              const newPage = currentPage + 1;
                              setCurrentPage(newPage);
                            }}
                            disabled={!pagination.hasNextPage}
                            className={`flex items-center space-x-1 px-4 py-2 rounded-lg transition-colors ${
                              pagination.hasNextPage
                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            <span>Siguiente</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ) : viewMode === 'calendar' ? (
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