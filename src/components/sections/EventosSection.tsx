import React, { useState } from 'react';
import { Search, Filter, Plus, MoreVertical, Calendar, MapPin, Users, Clock } from 'lucide-react';
import { Event } from '../../types';

export const EventosSection: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const events: Event[] = [
    {
      id: '1',
      title: 'Conferencia Anual de Tecnología',
      description: 'Evento principal del año con las últimas tendencias tecnológicas',
      date: '2024-03-15',
      time: '09:00',
      location: 'Centro de Convenciones',
      status: 'scheduled',
      attendees: 245,
      maxAttendees: 300
    },
    {
      id: '2',
      title: 'Workshop de Desarrollo Web',
      description: 'Taller práctico sobre las últimas tecnologías web',
      date: '2024-02-20',
      time: '14:00',
      location: 'Sala de Capacitación A',
      status: 'ongoing',
      attendees: 45,
      maxAttendees: 50
    },
    {
      id: '3',
      title: 'Reunión Mensual de Equipos',
      description: 'Reunión de seguimiento y planificación mensual',
      date: '2024-01-25',
      time: '10:00',
      location: 'Sala de Juntas Principal',
      status: 'completed',
      attendees: 25,
      maxAttendees: 30
    },
    {
      id: '4',
      title: 'Seminario de Marketing Digital',
      description: 'Estrategias avanzadas de marketing en la era digital',
      date: '2024-04-10',
      time: '16:00',
      location: 'Auditorio Central',
      status: 'cancelled',
      attendees: 0,
      maxAttendees: 150
    },
    {
      id: '5',
      title: 'Hackathon Innovación 2024',
      description: 'Competencia de desarrollo de soluciones innovadoras',
      date: '2024-05-05',
      time: '08:00',
      location: 'Laboratorio de Innovación',
      status: 'scheduled',
      attendees: 89,
      maxAttendees: 100
    }
  ];

  const getStatusColor = (status: Event['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Event['status']) => {
    switch (status) {
      case 'scheduled': return 'Programado';
      case 'ongoing': return 'En Curso';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || event.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalEvents = events.length;
  const scheduledEvents = events.filter(event => event.status === 'scheduled').length;
  const ongoingEvents = events.filter(event => event.status === 'ongoing').length;

  return (
    <div className="space-y-6">
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
              <p className="text-sm text-gray-600">Programados</p>
              <p className="text-2xl font-bold text-gray-900">{scheduledEvents}</p>
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

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Gestión de Eventos</h2>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Evento
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar eventos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los estados</option>
                <option value="scheduled">Programado</option>
                <option value="ongoing">En Curso</option>
                <option value="completed">Completado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div key={event.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{event.title}</h3>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(event.date).toLocaleDateString()} - {event.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{event.attendees}/{event.maxAttendees} asistentes</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(event.status)}`}>
                    {getStatusText(event.status)}
                  </span>
                  <div className="w-full max-w-20 bg-gray-200 rounded-full h-2 ml-4">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(event.attendees / event.maxAttendees) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};