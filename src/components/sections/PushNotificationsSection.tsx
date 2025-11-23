import React, { useState, useEffect } from 'react';
import { Bell, Send, List, Loader2, CheckCircle, XCircle, AlertCircle, Users, Building, UserCheck } from 'lucide-react';
import { pushNotificationService, CreatePushNotificationRequest, PushNotification } from '../../services/pushNotificationService';
import { useDivisions } from '../../hooks/useDivisions';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/userService';

interface PushNotificationsSectionProps {
  isReadonly?: boolean;
}

export const PushNotificationsSection: React.FC<PushNotificationsSectionProps> = ({ isReadonly = false }) => {
  const { user } = useAuth();
  const { divisions, loading: divisionsLoading } = useDivisions();
  const [viewMode, setViewMode] = useState<'form' | 'history'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Formulario
  const [formData, setFormData] = useState<CreatePushNotificationRequest>({
    title: '',
    body: '',
    targetType: 'institution',
    filters: {}
  });
  
  // Historial
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Cargar usuarios de una división
  const loadUsersForDivision = async (divisionId: string) => {
    try {
      setLoadingUsers(true);
      setError(null);
      const response = await pushNotificationService.getUsersByDivision(divisionId);
      setAvailableUsers(response.data || []);
    } catch (error: any) {
      console.error('Error loading users:', error);
      setError(error.response?.data?.message || 'Error al cargar usuarios de la división');
      setAvailableUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Cargar historial
  const loadHistory = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await pushNotificationService.getPushNotifications(page, 20);
      setNotifications(response.data);
      setTotalPages(response.pagination.pages);
      setCurrentPage(page);
    } catch (error: any) {
      setError(error.message || 'Error al cargar historial');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'history') {
      loadHistory();
    }
  }, [viewMode]);

  // Cargar usuarios cuando se selecciona una división
  useEffect(() => {
    if (formData.filters?.divisionId && formData.targetType === 'users') {
      loadUsersForDivision(formData.filters.divisionId);
    }
  }, [formData.filters?.divisionId, formData.targetType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.title || !formData.body) {
      setError('El título y el cuerpo son requeridos');
      return;
    }

    try {
      setLoading(true);
      
      const requestData: CreatePushNotificationRequest = {
        ...formData,
        filters: {
          ...formData.filters,
          userIds: formData.targetType === 'users' ? selectedUsers : undefined
        }
      };

      const response = await pushNotificationService.createPushNotification(requestData);
      
      setSuccess(`Notificación creada exitosamente. ${response.data.stats.queued} notificaciones enviadas a la cola.`);
      
      // Resetear formulario
      setFormData({
        title: '',
        body: '',
        targetType: 'institution',
        filters: {}
      });
      setSelectedUsers([]);
      
      // Recargar historial
      if (viewMode === 'history') {
        loadHistory();
      }
    } catch (error: any) {
      setError(error.response?.data?.message || error.message || 'Error al crear notificación');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="w-4 h-4" />;
      case 'processing': return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'partial': return <AlertCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Push Notifications</h2>
            <p className="text-sm text-gray-500">Enviar notificaciones push a usuarios</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('form')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'form'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Send className="w-4 h-4 inline mr-2" />
            Nueva Notificación
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'history'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <List className="w-4 h-4 inline mr-2" />
            Historial
          </button>
        </div>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <XCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}

      {/* Formulario */}
      {viewMode === 'form' && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Título de la notificación"
              maxLength={100}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cuerpo del mensaje *
            </label>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Mensaje de la notificación"
              rows={4}
              maxLength={500}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Destinatarios *
            </label>
            <select
              value={formData.targetType}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  targetType: e.target.value as any,
                  filters: {}
                });
                setSelectedUsers([]);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="institution">Toda la institución (tutores, familyview, coordinadores)</option>
              <option value="division">Tutores y familyview de una división</option>
              <option value="users">Usuarios específicos de una división</option>
              <option value="coordinators">Coordinadores</option>
            </select>
          </div>

          {/* Filtros según el tipo */}
          {formData.targetType === 'division' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                División *
              </label>
              <select
                value={formData.filters?.divisionId || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  filters: {
                    ...formData.filters,
                    divisionId: e.target.value,
                    roles: ['familyadmin', 'familyviewer']
                  }
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Seleccionar división</option>
                {divisions.map((div) => (
                  <option key={div._id} value={div._id}>
                    {div.nombre}
                  </option>
                ))}
              </select>
              <div className="mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.filters?.includeCoordinators || false}
                    onChange={(e) => setFormData({
                      ...formData,
                      filters: {
                        ...formData.filters,
                        includeCoordinators: e.target.checked
                      }
                    })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Incluir coordinadores de esta división</span>
                </label>
              </div>
            </div>
          )}

          {formData.targetType === 'users' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  División *
                </label>
                <select
                  value={formData.filters?.divisionId || ''}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      filters: {
                        ...formData.filters,
                        divisionId: e.target.value
                      }
                    });
                    setSelectedUsers([]);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Seleccionar división</option>
                  {divisions.map((div) => (
                    <option key={div._id} value={div._id}>
                      {div.nombre}
                    </option>
                  ))}
                </select>
              </div>
              {formData.filters?.divisionId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar usuarios *
                  </label>
                  <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto">
                    {loadingUsers ? (
                      <div className="text-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {availableUsers.length === 0 ? (
                          <p className="text-sm text-gray-500 py-4 text-center">
                            No se encontraron usuarios en esta división
                          </p>
                        ) : (
                          availableUsers.map((user) => (
                            <label key={user._id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedUsers.includes(user._id.toString())}
                                onChange={(e) => {
                                  const userId = user._id.toString();
                                  if (e.target.checked) {
                                    setSelectedUsers([...selectedUsers, userId]);
                                  } else {
                                    setSelectedUsers(selectedUsers.filter(id => id !== userId));
                                  }
                                }}
                                className="rounded border-gray-300"
                              />
                              <div className="flex-1">
                                <span className="text-sm font-medium">{user.name} ({user.email})</span>
                                {user.roles && user.roles.length > 0 && (
                                  <span className="text-xs text-gray-500 ml-2">
                                    - {user.roles.join(', ')}
                                  </span>
                                )}
                              </div>
                            </label>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  {selectedUsers.length > 0 && (
                    <p className="mt-2 text-sm text-gray-500">
                      {selectedUsers.length} usuario(s) seleccionado(s)
                    </p>
                  )}
                </div>
              )}
              <div className="mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.filters?.includeCoordinators || false}
                    onChange={(e) => setFormData({
                      ...formData,
                      filters: {
                        ...formData.filters,
                        includeCoordinators: e.target.checked
                      }
                    })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Incluir coordinadores de esta división</span>
                </label>
              </div>
            </>
          )}

          {formData.targetType === 'coordinators' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                División (opcional)
              </label>
              <select
                value={formData.filters?.divisionId || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  filters: {
                    ...formData.filters,
                    divisionId: e.target.value || undefined
                  }
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas las divisiones</option>
                {divisions.map((div) => (
                  <option key={div._id} value={div._id}>
                    {div.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                setFormData({
                  title: '',
                  body: '',
                  targetType: 'institution',
                  filters: {}
                });
                setSelectedUsers([]);
                setError(null);
                setSuccess(null);
              }}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Limpiar
            </button>
            <button
              type="submit"
              disabled={loading || isReadonly}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar Notificación
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Historial */}
      {viewMode === 'history' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Historial de Notificaciones</h3>
          </div>
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No hay notificaciones enviadas
            </div>
          ) : (
            <>
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div key={notification._id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{notification.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(notification.status)}`}>
                            {getStatusIcon(notification.status)}
                            {notification.status}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{notification.body}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <span>
                            <Users className="w-4 h-4 inline mr-1" />
                            {notification.stats.totalRecipients} destinatarios
                          </span>
                          <span>
                            <Bell className="w-4 h-4 inline mr-1" />
                            {notification.stats.totalDevices} dispositivos
                          </span>
                          <span className="text-green-600">
                            ✓ {notification.stats.sent} enviados
                          </span>
                          {notification.stats.failed > 0 && (
                            <span className="text-red-600">
                              ✗ {notification.stats.failed} fallidos
                            </span>
                          )}
                          <span>
                            {new Date(notification.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="p-4 border-t flex justify-center gap-2">
                  <button
                    onClick={() => loadHistory(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span className="px-4 py-2">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() => loadHistory(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

