import React, { useState, useEffect } from 'react';
import { Bell, Send, Eye, Trash2, Plus, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { NotificationService, Notification, CreateNotificationRequest, PaginationInfo } from '../../services/notificationService';

export const NotificationsSection: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'informacion' | 'comunicacion'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Formulario para crear notificación
  const [formData, setFormData] = useState<CreateNotificationRequest>({
    title: '',
    message: '',
    type: 'informacion',
    accountId: user?.account?._id || '',
    divisionId: '',
    recipients: []
  });

  // Cargar notificaciones
  const loadNotifications = async (page: number = 1) => {
    try {
      setLoading(true);
      console.log('🔔 [BACKOFFICE] Cargando notificaciones...');
      console.log('🔔 [BACKOFFICE] Usuario:', user?.nombre);
      console.log('🔔 [BACKOFFICE] Rol:', user?.role?.nombre);
      console.log('🔔 [BACKOFFICE] Account ID:', user?.account?._id);
      
      const skip = (page - 1) * itemsPerPage;
      
      // Verificar si es usuario familyadmin/familyviewer
      if (user?.role?.nombre === 'familyadmin' || user?.role?.nombre === 'familyviewer') {
        console.log('🔔 [BACKOFFICE] Usuario es familyadmin/familyviewer - usando endpoint de usuario');
        
        // Para usuarios familyadmin/familyviewer, necesitamos obtener las asociaciones
        // Por ahora, vamos a usar los parámetros que sabemos que funcionan
        const params = {
          limit: itemsPerPage,
          skip,
          accountId: '68b2eef1c9d2e9a7e5742fed', // San Martin - hardcoded por ahora
          divisionId: '68b2ef3fc9d2e9a7e57430f1'  // Sala Verde - hardcoded por ahora
        };
        
        console.log('🔔 [BACKOFFICE] Parámetros para usuario:', params);
        
        const userNotifications = await NotificationService.getUserNotifications(params);
        
        console.log('🔔 [BACKOFFICE] Notificaciones de usuario recibidas:', userNotifications);
        console.log('🔔 [BACKOFFICE] Cantidad:', userNotifications?.length || 0);
        
        setNotifications(userNotifications);
        setPagination(null); // No hay paginación para usuarios
        setCurrentPage(page);
      } else {
        // Para superadmin y adminaccount, usar el endpoint de backoffice
        const params: any = {
          limit: itemsPerPage,
          skip,
          type: filterType === 'all' ? undefined : filterType,
          search: searchTerm || undefined
        };
        
        // Para superadmin, permitir filtrar por cuenta específica
        if (user?.role?.nombre === 'superadmin') {
          params.accountId = user?.account?._id;
        }
        
        console.log('🔔 [BACKOFFICE] Parámetros de búsqueda:', params);
        
        const result = await NotificationService.getBackofficeNotifications(params);
        
        console.log('🔔 [BACKOFFICE] Notificaciones recibidas:', result);
        console.log('🔔 [BACKOFFICE] Cantidad:', result.notifications?.length || 0);
        console.log('🔔 [BACKOFFICE] Paginación:', result.pagination);
        
        setNotifications(result.notifications);
        setPagination(result.pagination);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Enviar notificación
  const sendNotification = async () => {
    try {
      setLoading(true);
      await NotificationService.sendNotification(formData);
      
      setShowCreateModal(false);
      setFormData({
        title: '',
        message: '',
        type: 'informacion',
        accountId: user?.account?._id || '',
        divisionId: '',
        recipients: []
      });
      await loadNotifications(1);
    } catch (error) {
      console.error('Error sending notification:', error);
    } finally {
      setLoading(false);
    }
  };

  // Marcar como leída
  const markAsRead = async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      await loadNotifications(currentPage);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // Eliminar notificación
  const deleteNotification = async (notificationId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta notificación?')) {
      return;
    }

    try {
      await NotificationService.deleteNotification(notificationId);
      await loadNotifications(currentPage);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Filtrar notificaciones
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || notification.type === filterType;
    return matchesSearch && matchesType;
  });

  // Funciones de paginación
  const handlePageChange = (page: number) => {
    loadNotifications(page);
  };

  const handleNextPage = () => {
    if (pagination?.hasNextPage) {
      handlePageChange(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (pagination?.hasPrevPage) {
      handlePageChange(currentPage - 1);
    }
  };

  useEffect(() => {
    loadNotifications(1);
  }, [filterType, searchTerm]); // Recargar cuando cambien los filtros

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'comunicacion': return 'bg-orange-100 text-orange-800';
      case 'informacion': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
          <p className="text-gray-600">Gestiona las notificaciones de la institución</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva Notificación
        </button>
      </div>

      {/* Título de la sección según el rol */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {user?.role?.nombre === 'superadmin' ? 'Todas las Notificaciones' : 'Notificaciones de la Institución'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {user?.role?.nombre === 'superadmin' 
            ? 'Gestiona todas las notificaciones del sistema' 
            : 'Gestiona las notificaciones de tu institución'
          }
        </p>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar notificaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Todos los tipos</option>
          <option value="informacion">Información</option>
          <option value="comunicacion">Comunicación</option>
        </select>
      </div>

      {/* Lista de notificaciones */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando notificaciones...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay notificaciones</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map((notification) => (
              <div key={notification._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{notification.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}>
                        {notification.type}
                      </span>

                    </div>
                    <p className="text-gray-600 mb-3">{notification.message}</p>
                                         <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                       <span>De: {notification.sender.nombre}</span>
                       <span>•</span>
                       <span>Cuenta: {notification.account.nombre}</span>
                       {notification.division && (
                         <>
                           <span>•</span>
                           <span>División: {notification.division.nombre}</span>
                         </>
                       )}
                       <span>•</span>
                       <span>{new Date(notification.sentAt).toLocaleDateString('es-ES')}</span>
                     </div>
                     
                     {/* Destinatarios */}
                     <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                       <span className="font-medium">Destinatarios:</span>
                       {notification.recipients && notification.recipients.length > 0 ? (
                         <div className="flex flex-wrap gap-1">
                           {notification.recipients.map((recipient, index) => (
                             <span
                               key={recipient._id}
                               className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                             >
                               {recipient.nombre}
                               {index < notification.recipients.length - 1 && ','}
                             </span>
                           ))}
                         </div>
                       ) : (
                         <span className="text-gray-400 italic">Sin destinatarios específicos</span>
                       )}
                     </div>
                     
                     {/* Estado de lectura */}
                     <div className="flex items-center gap-2 text-sm text-gray-600">
                       <span className="font-medium">Estado:</span>
                       <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                         notification.status === 'read' 
                           ? 'bg-green-100 text-green-800' 
                           : notification.status === 'delivered'
                           ? 'bg-yellow-100 text-yellow-800'
                           : 'bg-gray-100 text-gray-800'
                       }`}>
                         {notification.status === 'read' ? 'Leída' : 
                          notification.status === 'delivered' ? 'Entregada' : 'Enviada'}
                       </span>
                       {notification.recipients && notification.recipients.length > 0 && (
                         <span className="text-gray-500">
                           ({notification.readBy?.length || 0} de {notification.recipients.length} leída{notification.readBy?.length !== 1 ? 's' : ''})
                         </span>
                       )}
                     </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => markAsRead(notification._id)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Marcar como leída"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteNotification(notification._id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Paginación */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-6 py-4 border-t border-gray-200 rounded-b-lg">
          <div className="text-sm text-gray-700">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, pagination.totalItems)} de {pagination.totalItems} notificaciones
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={!pagination.hasPrevPage}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={handleNextPage}
              disabled={!pagination.hasNextPage}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Página siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal para crear notificación */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Nueva Notificación</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Título de la notificación"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Mensaje de la notificación"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="informacion">Información</option>
                  <option value="comunicacion">Comunicación</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={sendNotification}
                disabled={!formData.title || !formData.message || loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
