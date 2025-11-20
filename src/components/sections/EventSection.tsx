import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock,
  Building2,
  AlertCircle,
  Loader2,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { useDivisions } from '../../hooks/useDivisions';
import { useEvents } from '../../hooks/useEvents';
import { useAuth } from '../../hooks/useAuth';
import { Notification } from '../Notification';
import { CreateEventModal } from '../CreateEventModal';
import { Event } from '../../services/eventService';

export const EventSection: React.FC = () => {
  const { user } = useAuth();
  const { divisions, loading: divisionsLoading, error: divisionsError } = useDivisions();
  const { 
    events, 
    loading: eventsLoading, 
    error: eventsError, 
    pagination,
    loadEvents, 
    deleteEvent,
    refreshEvents 
  } = useEvents();

  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);

  // Load events when division changes
  useEffect(() => {
    if (selectedDivision) {
      loadEvents({
        division: selectedDivision,
        page: 1,
        limit: 10
      });
    }
  }, [selectedDivision, loadEvents]);

  // Handle division change
  const handleDivisionChange = (divisionId: string) => {
    setSelectedDivision(divisionId);
    setSearchTerm('');
    setStatusFilter('');
  };

  // Handle search
  const handleSearch = () => {
    loadEvents({
      division: selectedDivision,
      search: searchTerm,
      estado: statusFilter,
      page: 1,
      limit: 10
    });
  };

  // Handle create event
  const handleCreateEvent = () => {
    setShowCreateModal(true);
  };

  // Handle event created
  const handleEventCreated = () => {
    refreshEvents();
    setShowNotification(true);
    setNotificationMessage('Evento creado exitosamente');
    setNotificationType('success');
  };

  // Handle delete event
  const handleDeleteEvent = async (event: Event) => {
    setEventToDelete(event);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (eventToDelete) {
      const success = await deleteEvent(eventToDelete._id);
      if (success) {
        setShowNotification(true);
        setNotificationMessage('Evento eliminado exitosamente');
        setNotificationType('success');
      } else {
        setShowNotification(true);
        setNotificationMessage('Error al eliminar el evento');
        setNotificationType('error');
      }
      setEventToDelete(null);
    }
  };

  // Get status color
  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'activo':
        return 'bg-green-100 text-green-800';
      case 'finalizado':
        return 'bg-blue-100 text-blue-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status icon
  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'activo':
        return <CheckCircle className="h-4 w-4" />;
      case 'finalizado':
        return <Clock className="h-4 w-4" />;
      case 'cancelado':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Close notification
  const handleCloseNotification = () => {
    setShowNotification(false);
  };

  // If no user, show loading
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
            <p className="text-gray-600">Gestión de eventos por división</p>
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

      {/* Filtros y Búsqueda */}
      {selectedDivision && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Filter className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filtros y Búsqueda</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Buscar eventos..."
                />
              </div>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Todos los estados</option>
                <option value="activo">Activo</option>
                <option value="finalizado">Finalizado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleSearch}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Search className="h-4 w-4" />
                <span>Buscar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Eventos */}
      {selectedDivision && (
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Eventos</h3>
              <span className="text-sm text-gray-500">
                {pagination.totalItems} evento{pagination.totalItems !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {eventsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Cargando eventos...</p>
              </div>
            </div>
          ) : eventsError ? (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <p className="text-red-700">{eventsError}</p>
                </div>
              </div>
            </div>
          ) : events.length === 0 ? (
            <div className="p-6 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                No hay eventos
              </h4>
              <p className="text-gray-500 mb-4">
                No se encontraron eventos para esta división.
              </p>
              <button
                onClick={handleCreateEvent}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                <span>Crear Primer Evento</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {events.map((event) => (
                <div key={event._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{event.titulo}</h4>
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(event.estado)}`}>
                          {getStatusIcon(event.estado)}
                          <span className="ml-1">{event.estado}</span>
                        </span>
                        {event.requiereAutorizacion && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Requiere autorización
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-600 mb-3">{event.descripcion}</p>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(event.fecha)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span>{event.hora}</span>
                        </div>
                        {event.lugar && (
                          <div className="flex items-center space-x-2">
                            <Building2 className="h-4 w-4" />
                            <span>{event.lugar}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                        title="Editar evento"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Eliminar evento"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de Crear Evento */}
      <CreateEventModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onEventCreated={handleEventCreated}
        selectedDivision={selectedDivision}
      />

      {/* Modal de Confirmación de Eliminación */}
      {eventToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">Confirmar Eliminación</h3>
              </div>
              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que quieres eliminar el evento "{eventToDelete.titulo}"? Esta acción no se puede deshacer.
              </p>
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setEventToDelete(null)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
