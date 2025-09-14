import React, { useState, useEffect } from 'react';
import { Bell, Send, Eye, Trash2, Plus, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { NotificationService, Notification, CreateNotificationRequest, PaginationInfo } from '../../services/notificationService';
import { SendNotificationModal } from '../SendNotificationModal';
import { userService } from '../../services/userService';

export const NotificationsSection: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role?.nombre === 'superadmin';
  const canSendNotifications = !isSuperAdmin; // Solo superadmin no puede enviar
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'informacion' | 'comunicacion'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [userNames, setUserNames] = useState<{[key: string]: string}>({});

  // Función para obtener nombres de usuarios
  const loadUserNames = async (notification: Notification) => {
    console.log('🔍 [loadUserNames] Iniciando carga de nombres para notificación:', notification._id);
    console.log('🔍 [loadUserNames] readBy:', notification.readBy);
    
    if (!notification.readBy || notification.readBy.length === 0) {
      console.log('🔍 [loadUserNames] No hay usuarios que leyeron la notificación');
      return;
    }
    
    const userIds = notification.readBy
      .map(read => typeof read.user === 'string' ? read.user : read.user?._id)
      .filter(Boolean);
    
    console.log('🔍 [loadUserNames] User IDs extraídos:', userIds);
    
    if (userIds.length === 0) {
      console.log('🔍 [loadUserNames] No se encontraron IDs de usuario válidos');
      return;
    }
    
    try {
      const userPromises = userIds.map(async (userId) => {
        try {
          console.log('🔍 [loadUserNames] Cargando usuario:', userId);
          const user = await userService.getUserById(userId);
          console.log('🔍 [loadUserNames] Usuario cargado:', user.name);
          return { id: userId, name: user.name };
        } catch (error) {
          console.error(`Error loading user ${userId}:`, error);
          return { id: userId, name: `Usuario ${userId.substring(0, 8)}...` };
        }
      });
      
      const users = await Promise.all(userPromises);
      console.log('🔍 [loadUserNames] Usuarios cargados:', users);
      
      const nameMap = users.reduce((acc, user) => {
        acc[user.id] = user.name;
        return acc;
      }, {} as {[key: string]: string});
      
      console.log('🔍 [loadUserNames] Mapa de nombres:', nameMap);
      setUserNames(prev => ({ ...prev, ...nameMap }));
    } catch (error) {
      console.error('Error loading user names:', error);
    }
  };

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


  // Marcar como leída
  const markAsRead = async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      await loadNotifications(currentPage);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // Manejar click en notificación
  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Marcar como leída si no está leída
      if (notification.status !== 'read') {
        await markAsRead(notification._id);
      }
      
      // Abrir popup con detalles
      setSelectedNotification(notification);
      setShowDetailsModal(true);
      
      // Cargar nombres de usuarios que leyeron la notificación
      loadUserNames(notification);
    } catch (error) {
      console.error('Error handling notification click:', error);
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
        {canSendNotifications && (
          <button
            onClick={() => setShowSendModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Enviar Notificación
          </button>
        )}
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
              <div 
                key={notification._id} 
                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleNotificationClick(notification)}
              >
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
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification._id);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Marcar como leída"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification._id);
                      }}
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


      {/* Modal de detalles de notificación */}
      {showDetailsModal && selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Detalles de la Notificación</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Header con título y tipo */}
              <div className="border-b border-gray-200 pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-bold text-gray-900">{selectedNotification.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(selectedNotification.type)}`}>
                    {selectedNotification.type.toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-600 text-lg leading-relaxed">{selectedNotification.message}</p>
              </div>

              {/* Información del remitente y fecha */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Información del Envío</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Enviado por:</span>
                      <span className="ml-2 text-gray-900">{selectedNotification.sender.nombre}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Fecha:</span>
                      <span className="ml-2 text-gray-900">
                        {new Date(selectedNotification.sentAt).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Estado:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        selectedNotification.status === 'read' 
                          ? 'bg-green-100 text-green-800' 
                          : selectedNotification.status === 'delivered'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedNotification.status === 'read' ? 'Leída' : 
                         selectedNotification.status === 'delivered' ? 'Entregada' : 'Enviada'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Información de la Institución</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Cuenta:</span>
                      <span className="ml-2 text-gray-900">{selectedNotification.account.nombre}</span>
                    </div>
                    {selectedNotification.division && (
                      <div>
                        <span className="font-medium text-gray-600">División:</span>
                        <span className="ml-2 text-gray-900">{selectedNotification.division.nombre}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Destinatarios */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Destinatarios</h4>
                {selectedNotification.recipients && selectedNotification.recipients.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedNotification.recipients.map((recipient) => (
                      <div key={recipient._id} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-900">{recipient.nombre}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">Sin destinatarios específicos</p>
                )}
              </div>

              {/* Estadísticas de lectura */}
              {selectedNotification.recipients && selectedNotification.recipients.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Estadísticas de Lectura</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{selectedNotification.recipients.length}</div>
                      <div className="text-sm text-gray-600">Total destinatarios</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{selectedNotification.readBy?.length || 0}</div>
                      <div className="text-sm text-gray-600">Leídas</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">
                        {selectedNotification.recipients.length - (selectedNotification.readBy?.length || 0)}
                      </div>
                      <div className="text-sm text-gray-600">Pendientes</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Lista de lecturas */}
              {selectedNotification.readBy && selectedNotification.readBy.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Leída por</h4>
                  <div className="space-y-2">
                    {selectedNotification.readBy.map((read, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-gray-900">
                          {typeof read.user === 'string' 
                            ? (userNames[read.user] || `Usuario ${read.user.substring(0, 8)}...`)
                            : read.user?.name || 'Usuario desconocido'
                          }
                        </span>
                        <span className="text-gray-500">
                          {new Date(read.readAt).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para enviar notificaciones (todos excepto superadmin) */}
      {canSendNotifications && (
        <SendNotificationModal
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          onSuccess={() => {
            loadNotifications(1);
            setShowSendModal(false);
          }}
        />
      )}
    </div>
  );
};
