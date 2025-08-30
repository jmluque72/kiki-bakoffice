import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  Calendar, 
  MapPin, 
  Users, 
  Clock,
  Download,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { useEvents, EventsFilters, Event } from '../../hooks/useEvents';
import { Notification } from '../Notification';

export const EventosSection: React.FC = () => {
  const {
    events,
    loading,
    error,
    total,
    page,
    limit,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent
  } = useEvents();

  const [filters, setFilters] = useState<EventsFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');

  const handleFilterChange = (key: keyof EventsFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    fetchEvents(filters);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchTerm('');
    fetchEvents();
  };

  const handleCreateEvent = async (eventData: any) => {
    const result = await createEvent(eventData);
    setNotificationType(result.success ? 'success' : 'error');
    setNotificationMessage(result.message);
    setShowNotification(true);
  };

  const handleUpdateEvent = async (eventId: string, updateData: any) => {
    const result = await updateEvent(eventId, updateData);
    setNotificationType(result.success ? 'success' : 'error');
    setNotificationMessage(result.message);
    setShowNotification(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      const result = await deleteEvent(eventId);
      setNotificationType(result.success ? 'success' : 'error');
      setNotificationMessage(result.message);
      setShowNotification(true);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'borrador': return 'bg-gray-100 text-gray-800';
      case 'publicado': return 'bg-blue-100 text-blue-800';
      case 'en_curso': return 'bg-green-100 text-green-800';
      case 'finalizado': return 'bg-purple-100 text-purple-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoText = (estado: string) => {
    switch (estado) {
      case 'borrador': return 'Borrador';
      case 'publicado': return 'Publicado';
      case 'en_curso': return 'En Curso';
      case 'finalizado': return 'Finalizado';
      case 'cancelado': return 'Cancelado';
      default: return estado;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredEvents = events.filter(event =>
    event.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.ubicacion.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.organizador.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalEvents = events.length;
  const publishedEvents = events.filter(event => event.estado === 'publicado').length;
  const ongoingEvents = events.filter(event => event.estado === 'en_curso').length;

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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calendar className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Eventos</h2>
            <p className="text-gray-600">Gestiona los eventos de la institución</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="h-4 w-4" />
            <span>Nuevo Evento</span>
          </button>
          <button className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
            <Download className="h-4 w-4" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Eventos</p>
              <p className="text-2xl font-bold text-gray-900">{totalEvents}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Publicados</p>
              <p className="text-2xl font-bold text-gray-900">{publishedEvents}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En Curso</p>
              <p className="text-2xl font-bold text-gray-900">{ongoingEvents}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cuenta
            </label>
            <select
              value={filters.accountId || ''}
              onChange={(e) => handleFilterChange('accountId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las cuentas</option>
              {/* Aquí se cargarían las cuentas disponibles */}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría
            </label>
            <select
              value={filters.categoria || ''}
              onChange={(e) => handleFilterChange('categoria', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las categorías</option>
              <option value="conferencia">Conferencia</option>
              <option value="taller">Taller</option>
              <option value="seminario">Seminario</option>
              <option value="reunion">Reunión</option>
              <option value="webinar">Webinar</option>
              <option value="curso">Curso</option>
              <option value="actividad_social">Actividad Social</option>
              <option value="deportivo">Deportivo</option>
              <option value="cultural">Cultural</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={filters.estado || ''}
              onChange={(e) => handleFilterChange('estado', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="borrador">Borrador</option>
              <option value="publicado">Publicado</option>
              <option value="en_curso">En Curso</option>
              <option value="finalizado">Finalizado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Búsqueda
            </label>
            <input
              type="text"
              placeholder="Buscar eventos..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <div className="flex space-x-3">
            <button
              onClick={handleApplyFilters}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Filter className="h-4 w-4" />
              <span>Aplicar Filtros</span>
            </button>
            <button
              onClick={handleClearFilters}
              className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <span>Limpiar</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar eventos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Eventos ({total} registros)
          </h3>
        </div>
        
        {error && (
          <div className="px-6 py-4 bg-red-50 border-b border-red-200">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        
        <div className="p-6">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-500">No se encontraron eventos</p>
              <p className="text-sm text-gray-400">Intenta ajustar los filtros o crear nuevos eventos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <div key={event._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{event.nombre}</h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {/* Implementar vista detallada */}}
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {/* Implementar edición */}}
                        className="text-green-600 hover:text-green-900"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.descripcion}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(event.fechaInicio)} - {formatTime(event.fechaInicio)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{event.ubicacion.nombre}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{event.participantes.length}/{event.capacidadMaxima || '∞'} participantes</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>Organizado por: {event.organizador.name}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(event.estado)}`}>
                      {getEstadoText(event.estado)}
                    </span>
                    {event.capacidadMaxima && (
                      <div className="w-full max-w-20 bg-gray-200 rounded-full h-2 ml-4">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(event.participantes.length / event.capacidadMaxima) * 100}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Paginación */}
        {total > limit && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando {((page - 1) * limit) + 1} a {Math.min(page * limit, total)} de {total} resultados
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => fetchEvents({ ...filters, page: page - 1 })}
                  disabled={page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Anterior
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  Página {page} de {Math.ceil(total / limit)}
                </span>
                <button
                  onClick={() => fetchEvents({ ...filters, page: page + 1 })}
                  disabled={page >= Math.ceil(total / limit)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notificación */}
      <Notification
        type={notificationType}
        message={notificationMessage}
        isVisible={showNotification}
        onClose={() => setShowNotification(false)}
      />
    </div>
  );
};