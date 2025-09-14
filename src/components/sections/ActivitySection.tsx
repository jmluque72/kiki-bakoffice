import React, { useState } from 'react';
import {
  Search,
  Filter,
  Activity as ActivityIcon,
  Clock,
  User,
  FileText,
  Calendar,
  Download,
  Eye,
  Trash2
} from 'lucide-react';
import { useActivities, ActivitiesFilters } from '../../hooks/useActivities';
import { Activity } from '../../config/api';
import { Notification } from '../Notification';
import { ConfirmationDialog } from '../ConfirmationDialog';
import { useAuth } from '../../hooks/useAuth';

export const ActivitySection: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role?.nombre === 'superadmin';
  
  const {
    activities,
    loading,
    error,
    total,
    page,
    limit,
    fetchActivities,
    deleteActivity
  } = useActivities();

  const [filters, setFilters] = useState<ActivitiesFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null);

  const handleFilterChange = (key: keyof ActivitiesFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    fetchActivities(filters);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchTerm('');
    fetchActivities();
  };

  const handleDeleteActivity = async (id: string) => {
    const success = await deleteActivity(id);
    if (success) {
      setNotificationMessage('Actividad eliminada correctamente');
      setNotificationType('success');
      setShowNotification(true);
    } else {
      setNotificationMessage('Error al eliminar la actividad');
      setNotificationType('error');
      setShowNotification(true);
    }
  };

  const handleDeleteClick = (activity: Activity) => {
    // Si es superadmin, no permitir eliminar
    if (isSuperAdmin) {
      return;
    }
    setActivityToDelete(activity);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    // Si es superadmin, no permitir eliminar
    if (isSuperAdmin) {
      return;
    }
    if (activityToDelete) {
      handleDeleteActivity(activityToDelete._id);
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'login': return <User className="w-4 h-4" />;
      case 'logout': return <User className="w-4 h-4" />;
      case 'create': return <FileText className="w-4 h-4" />;
      case 'update': return <ActivityIcon className="w-4 h-4" />;
      case 'delete': return <FileText className="w-4 h-4" />;
      case 'approve': return <FileText className="w-4 h-4" />;
      case 'reject': return <FileText className="w-4 h-4" />;
      case 'register': return <User className="w-4 h-4" />;
      default: return <ActivityIcon className="w-4 h-4" />;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'login': return 'bg-blue-100 text-blue-600';
      case 'logout': return 'bg-gray-100 text-gray-600';
      case 'create': return 'bg-green-100 text-green-600';
      case 'update': return 'bg-yellow-100 text-yellow-600';
      case 'delete': return 'bg-red-100 text-red-600';
      case 'approve': return 'bg-purple-100 text-purple-600';
      case 'reject': return 'bg-orange-100 text-orange-600';
      case 'register': return 'bg-indigo-100 text-indigo-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredActivities = activities.filter(activity =>
    (activity.usuario?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (activity.usuario?.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (activity.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (activity.account?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  );

  const todayActivities = activities.filter(activity => {
    const today = new Date().toDateString();
    return new Date(activity.createdAt).toDateString() === today;
  }).length;

  const uniqueUsers = new Set(activities.map(activity => activity.usuario?._id).filter(Boolean)).size;

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
          <ActivityIcon className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Actividades</h2>
            <p className="text-gray-600">Registro de actividades del sistema</p>
          </div>
        </div>
        <div className="flex space-x-3">
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
              <p className="text-2xl font-bold text-gray-900">{total}</p>
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
              Tipo
            </label>
            <select
              value={filters.tipo || ''}
              onChange={(e) => handleFilterChange('tipo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los tipos</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="create">Crear</option>
              <option value="update">Actualizar</option>
              <option value="delete">Eliminar</option>
              <option value="approve">Aprobar</option>
              <option value="reject">Rechazar</option>
              <option value="register">Registrar</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={filters.fechaInicio || ''}
              onChange={(e) => handleFilterChange('fechaInicio', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Fin
            </label>
            <input
              type="date"
              value={filters.fechaFin || ''}
              onChange={(e) => handleFilterChange('fechaFin', e.target.value)}
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
              placeholder="Buscar actividades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Actividades ({total} registros)
          </h3>
        </div>

        {error && (
          <div className="px-6 py-4 bg-red-50 border-b border-red-200">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="p-6">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <ActivityIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-500">No se encontraron actividades</p>
              <p className="text-sm text-gray-400">Intenta ajustar los filtros</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map((activity) => (
                <div key={activity._id} className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className={`p-2 rounded-lg ${getTipoColor(activity.tipo)}`}>
                    {getTipoIcon(activity.tipo)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        <span className="font-semibold">{activity.usuario?.name || 'Usuario desconocido'}</span> {activity.descripcion}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-500">
                          {formatDate(activity.createdAt)}
                        </p>
                        {!isSuperAdmin && (
                          <button
                            onClick={() => handleDeleteClick(activity)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                            title="Eliminar actividad"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-sm text-gray-600">{activity.account?.nombre || 'Institución desconocida'}</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTipoColor(activity.tipo)}`}>
                        {activity.tipo}
                      </span>
                      {activity.entidad && (
                        <span className="text-xs text-gray-500">
                          Entidad: {activity.entidad}
                        </span>
                      )}
                    </div>
                    {activity.ip && (
                      <p className="text-xs text-gray-400 mt-1">
                        IP: {activity.ip}
                      </p>
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
                  onClick={() => fetchActivities({ ...filters, page: page - 1 })}
                  disabled={page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Anterior
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  Página {page} de {Math.ceil(total / limit)}
                </span>
                <button
                  onClick={() => fetchActivities({ ...filters, page: page + 1 })}
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

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar actividad"
        message={`¿Estás seguro de que quieres eliminar esta actividad? Esta acción no se puede deshacer.`}
        type="danger"
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </div>
  );
};