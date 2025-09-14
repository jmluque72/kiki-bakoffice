import React from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  User, 
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download
} from 'lucide-react';
import { Event } from '../services/eventService';


interface EventDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  events: Event[];
}

export const EventDayModal: React.FC<EventDayModalProps> = ({
  isOpen,
  onClose,
  date,
  events
}) => {
  if (!isOpen) return null;

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

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case 'reunion': return 'bg-blue-100 text-blue-800';
      case 'taller': return 'bg-green-100 text-green-800';
      case 'conferencia': return 'bg-purple-100 text-purple-800';
      case 'seminario': return 'bg-yellow-100 text-yellow-800';
      case 'webinar': return 'bg-indigo-100 text-indigo-800';
      case 'curso': return 'bg-pink-100 text-pink-800';
      case 'actividad_social': return 'bg-orange-100 text-orange-800';
      case 'deportivo': return 'bg-red-100 text-red-800';
      case 'cultural': return 'bg-teal-100 text-teal-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoriaText = (categoria: string) => {
    switch (categoria) {
      case 'reunion': return 'Reunión';
      case 'taller': return 'Taller';
      case 'conferencia': return 'Conferencia';
      case 'seminario': return 'Seminario';
      case 'webinar': return 'Webinar';
      case 'curso': return 'Curso';
      case 'actividad_social': return 'Actividad Social';
      case 'deportivo': return 'Deportivo';
      case 'cultural': return 'Cultural';
      default: return categoria;
    }
  };

  const displayDate = formatDate(date);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Calendar className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Eventos del {displayDate}</h2>
              <p className="text-gray-600">{events.length} evento{events.length !== 1 ? 's' : ''} programado{events.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {events.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-500">No hay eventos programados</p>
              <p className="text-sm text-gray-400">No se encontraron eventos para esta fecha</p>
            </div>
          ) : (
            <div className="space-y-6">
              {events.map((event) => (
                <div key={event._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  {/* Event Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{event.nombre}</h3>
                      <div className="flex items-center space-x-4 mb-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(event.estado)}`}>
                          {getEstadoText(event.estado)}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoriaColor(event.categoria)}`}>
                          {getCategoriaText(event.categoria)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Exportar">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Event Description */}
                  <p className="text-gray-600 mb-4">{event.descripcion}</p>

                  {/* Event Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Fecha y Hora</p>
                          <p className="text-sm text-gray-600">
                            {formatDate(event.fechaInicio)} - {formatTime(event.fechaInicio)}
                          </p>
                          {event.fechaFin && event.fechaFin !== event.fechaInicio && (
                            <p className="text-sm text-gray-600">
                              Hasta: {formatTime(event.fechaFin)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <MapPin className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Ubicación</p>
                          <p className="text-sm text-gray-600">{event.ubicacion.nombre}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <User className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Organizador</p>
                          <p className="text-sm text-gray-600">{event.organizador.name}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Users className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Participantes</p>
                          <p className="text-sm text-gray-600">
                            {event.participantes.length}
                            {event.capacidadMaxima && ` / ${event.capacidadMaxima}`}
                          </p>
                          {event.capacidadMaxima && (
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${(event.participantes.length / event.capacidadMaxima) * 100}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Clock className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Duración</p>
                          <p className="text-sm text-gray-600">
                            {event.fechaFin ? 
                              `${Math.round((new Date(event.fechaFin).getTime() - new Date(event.fechaInicio).getTime()) / (1000 * 60 * 60))} horas` :
                              'Sin duración definida'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Autorizaciones */}
                  {event.autorizaciones && event.autorizaciones.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <h4 className="text-sm font-medium text-gray-900">Autorizaciones</h4>
                      </div>
                      <div className="space-y-2">
                        {event.autorizaciones.map((auth, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              {auth.estado === 'aprobada' ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : auth.estado === 'rechazada' ? (
                                <XCircle className="h-5 w-5 text-red-600" />
                              ) : (
                                <AlertCircle className="h-5 w-5 text-yellow-600" />
                              )}
                              <div>
                                <p className="text-sm font-medium text-gray-900">{auth.tipo}</p>
                                <p className="text-xs text-gray-600">
                                  {auth.estudiante?.nombre || 'Estudiante no especificado'}
                                </p>
                              </div>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              auth.estado === 'aprobada' ? 'bg-green-100 text-green-800' :
                              auth.estado === 'rechazada' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {auth.estado === 'aprobada' ? 'Aprobada' :
                               auth.estado === 'rechazada' ? 'Rechazada' : 'Pendiente'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Participantes */}
                  {event.participantes && event.participantes.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <Users className="h-5 w-5 text-gray-400" />
                        <h4 className="text-sm font-medium text-gray-900">Participantes</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {event.participantes.map((participant, index) => (
                          <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-blue-600">
                                {participant.nombre?.charAt(0) || '?'}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{participant.nombre}</p>
                              <p className="text-xs text-gray-600">{participant.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
          {events.length > 0 && (
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Exportar Eventos
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
