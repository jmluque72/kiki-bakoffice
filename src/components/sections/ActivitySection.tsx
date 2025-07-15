import React, { useState } from 'react';
import { Search, Filter, Activity as ActivityIcon, Clock, User, FileText } from 'lucide-react';
import { Activity } from '../../types';

export const ActivitySection: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const activities: Activity[] = [
    {
      id: '1',
      user: 'Juan Pérez',
      action: 'Creó nueva cuenta',
      timestamp: '2024-01-20T10:30:00Z',
      type: 'create',
      details: 'Cuenta empresarial para Tech Solutions Ltd.'
    },
    {
      id: '2',
      user: 'María García',
      action: 'Aprobó solicitud',
      timestamp: '2024-01-20T09:15:00Z',
      type: 'approval',
      details: 'Solicitud de evento corporativo #EV-2024-001'
    },
    {
      id: '3',
      user: 'Carlos López',
      action: 'Actualizó perfil de usuario',
      timestamp: '2024-01-20T08:45:00Z',
      type: 'update',
      details: 'Cambió información de contacto'
    },
    {
      id: '4',
      user: 'Ana Martínez',
      action: 'Eliminó división',
      timestamp: '2024-01-19T16:20:00Z',
      type: 'delete',
      details: 'División de Marketing Digital'
    },
    {
      id: '5',
      user: 'Roberto Silva',
      action: 'Inició sesión',
      timestamp: '2024-01-19T15:30:00Z',
      type: 'login',
      details: 'Acceso desde IP: 192.168.1.100'
    },
    {
      id: '6',
      user: 'Juan Pérez',
      action: 'Creó nuevo evento',
      timestamp: '2024-01-19T14:15:00Z',
      type: 'create',
      details: 'Conferencia Anual de Tecnología 2024'
    },
    {
      id: '7',
      user: 'María García',
      action: 'Rechazó solicitud',
      timestamp: '2024-01-19T13:00:00Z',
      type: 'approval',
      details: 'Solicitud de presupuesto adicional'
    },
    {
      id: '8',
      user: 'Carlos López',
      action: 'Actualizó configuración',
      timestamp: '2024-01-19T11:45:00Z',
      type: 'update',
      details: 'Configuración de notificaciones'
    }
  ];

  const getTypeIcon = (type: Activity['type']) => {
    switch (type) {
      case 'login': return <User className="w-4 h-4" />;
      case 'create': return <FileText className="w-4 h-4" />;
      case 'update': return <ActivityIcon className="w-4 h-4" />;
      case 'delete': return <FileText className="w-4 h-4" />;
      case 'approval': return <FileText className="w-4 h-4" />;
      default: return <ActivityIcon className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: Activity['type']) => {
    switch (type) {
      case 'login': return 'bg-blue-100 text-blue-600';
      case 'create': return 'bg-green-100 text-green-600';
      case 'update': return 'bg-yellow-100 text-yellow-600';
      case 'delete': return 'bg-red-100 text-red-600';
      case 'approval': return 'bg-purple-100 text-purple-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || activity.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const todayActivities = activities.filter(activity => {
    const today = new Date().toDateString();
    return new Date(activity.timestamp).toDateString() === today;
  }).length;

  const totalActivities = activities.length;
  const uniqueUsers = new Set(activities.map(activity => activity.user)).size;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Actividades Hoy</p>
              <p className="text-2xl font-bold text-gray-900">{todayActivities}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Actividades</p>
              <p className="text-2xl font-bold text-gray-900">{totalActivities}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <ActivityIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Usuarios Activos</p>
              <p className="text-2xl font-bold text-gray-900">{uniqueUsers}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <User className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Registro de Actividades</h2>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar actividades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los tipos</option>
                <option value="login">Login</option>
                <option value="create">Crear</option>
                <option value="update">Actualizar</option>
                <option value="delete">Eliminar</option>
                <option value="approval">Aprobación</option>
              </select>
            </div>
          </div>
        </div>

        {/* Activity List */}
        <div className="p-6">
          <div className="space-y-4">
            {filteredActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
                <div className={`p-2 rounded-lg ${getTypeColor(activity.type)}`}>
                  {getTypeIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      <span className="font-semibold">{activity.user}</span> {activity.action}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{activity.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};