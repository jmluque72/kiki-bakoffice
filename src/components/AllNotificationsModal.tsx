import React, { useState, useEffect } from 'react';
import { X, Bell, ChevronLeft, ChevronRight, CheckCircle, XCircle, Eye, Clock } from 'lucide-react';
import { AllNotificationsService } from '../services/allNotificationsService';
import { Notification, PaginationInfo, NotificationService } from '../services/notificationService';
import { pendingNotificationsService } from '../services/pendingNotificationsService';

interface AllNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AllNotificationsModal: React.FC<AllNotificationsModalProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [notificationDetails, setNotificationDetails] = useState<Notification | null>(null);

  // Cargar notificaciones
  const loadNotifications = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await AllNotificationsService.getAllInstitutionNotifications({
        limit: 20,
        skip: (page - 1) * 20
      });
      
      setNotifications(result.notifications);
      setPagination(result.pagination);
    } catch (err: any) {
      console.error('Error loading notifications:', err);
      setError(err.message || 'Error al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  };

  // Cargar notificaciones cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadNotifications(currentPage);
    }
  }, [isOpen, currentPage]);

  // Resetear página cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setCurrentPage(1);
      setNotifications([]);
      setError(null);
      setSelectedNotification(null);
      setShowDetailModal(false);
      setShowRejectDialog(false);
      setRejectionReason('');
      setNotificationDetails(null);
    }
  }, [isOpen]);

  const handleApprove = async (notification: Notification) => {
    if (!notification._id) return;
    
    setProcessing(notification._id);
    try {
      await pendingNotificationsService.approveNotification(notification._id);
      await loadNotifications(currentPage);
      setSelectedNotification(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al aprobar notificación');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!selectedNotification?._id) return;
    
    setProcessing(selectedNotification._id);
    try {
      await pendingNotificationsService.rejectNotification(selectedNotification._id, rejectionReason);
      await loadNotifications(currentPage);
      setShowRejectDialog(false);
      setSelectedNotification(null);
      setRejectionReason('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al rechazar notificación');
    } finally {
      setProcessing(null);
    }
  };

  const openRejectDialog = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowRejectDialog(true);
    setRejectionReason('');
  };

  const handleViewDetails = async (notification: Notification) => {
    setLoadingDetails(true);
    setError(null);
    try {
      // Cargar detalles completos de la notificación con recipients poblados
      const details = await NotificationService.getNotificationDetails(notification._id);
      setNotificationDetails(details);
      setSelectedNotification(details);
      setShowDetailModal(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar detalles de la notificación');
    } finally {
      setLoadingDetails(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pendiente
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Rechazada
          </span>
        );
      case 'sent':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Enviada
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Bell className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-bold text-gray-900">Todas las Notificaciones</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              <span className="ml-3 text-gray-600">Cargando notificaciones...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 mb-2">Error al cargar las notificaciones</div>
              <div className="text-gray-600 mb-4">{error}</div>
              <button
                onClick={() => loadNotifications(currentPage)}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No hay notificaciones disponibles</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div key={notification._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {notification.title}
                      </h3>
                      <p className="text-gray-700 text-sm leading-relaxed mb-3">
                        {notification.message}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 flex-wrap gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Estado:</span>
                          {getStatusBadge(notification.status)}
                        </div>
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
                            <span className="text-gray-700">{notification.sender.name || notification.sender.nombre || notification.sender.email}</span>
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
                    <div className="flex flex-col items-end gap-2 ml-4">
                      <div className="text-sm text-gray-500 text-right">
                        <div className="font-medium">{new Date(notification.sentAt || notification.createdAt).toLocaleDateString('es-ES', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(notification.sentAt || notification.createdAt).toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                      {/* Botones de acción */}
                      <div className="flex items-center gap-2 mt-2">
                        {/* Botón Ver detalles para todas las notificaciones */}
                        <button
                          onClick={() => handleViewDetails(notification)}
                          disabled={loadingDetails}
                          className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Eye className="w-3 h-3" />
                          {loadingDetails ? 'Cargando...' : 'Ver detalles'}
                        </button>
                        {/* Botones de aprobar/rechazar solo para notificaciones pending de tipo coordinador */}
                        {notification.status === 'pending' && notification.type === 'coordinador' && (
                          <>
                            <button
                              onClick={() => handleApprove(notification)}
                              disabled={processing === notification._id}
                              className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <CheckCircle className="w-3 h-3" />
                              {processing === notification._id ? 'Aprobando...' : 'Aprobar'}
                            </button>
                            <button
                              onClick={() => openRejectDialog(notification)}
                              disabled={processing === notification._id}
                              className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <XCircle className="w-3 h-3" />
                              Rechazar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer con paginación */}
        {!loading && !error && notifications.length > 0 && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
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
                    ? 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
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
                    ? 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                }`}
              >
                <span>Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Modal de detalles */}
        {showDetailModal && (selectedNotification || notificationDetails) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Detalles de la Notificación</h3>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedNotification(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {loadingDetails ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                    <span className="ml-3 text-gray-600">Cargando detalles...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Título</h4>
                      <p className="text-gray-700">{(selectedNotification || notificationDetails)?.title}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Mensaje</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{(selectedNotification || notificationDetails)?.message}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Tipo</h4>
                        <p className="text-gray-700">{(selectedNotification || notificationDetails)?.type}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Estado</h4>
                        {getStatusBadge((selectedNotification || notificationDetails)?.status || 'sent')}
                      </div>
                      {(selectedNotification || notificationDetails)?.division && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">División</h4>
                          <p className="text-gray-700">{(selectedNotification || notificationDetails)?.division?.nombre}</p>
                        </div>
                      )}
                      {(selectedNotification || notificationDetails)?.sender && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">Enviado por</h4>
                          <p className="text-gray-700">
                            {(selectedNotification || notificationDetails)?.sender?.name || 
                             (selectedNotification || notificationDetails)?.sender?.nombre || 
                             (selectedNotification || notificationDetails)?.sender?.email}
                          </p>
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Participantes ({(selectedNotification || notificationDetails)?.recipients?.length || (selectedNotification || notificationDetails)?.recipientsCount || 0})
                      </h4>
                      {(selectedNotification || notificationDetails)?.recipients && (selectedNotification || notificationDetails)?.recipients!.length > 0 ? (
                        <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                          <ul className="space-y-2">
                            {(selectedNotification || notificationDetails)?.recipients!.map((recipient, index) => (
                              <li key={index} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                                <div>
                                  <p className="font-medium text-gray-900">{recipient.nombre || 'Sin nombre'}</p>
                                  {recipient.email && (
                                    <p className="text-sm text-gray-600">{recipient.email}</p>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No hay participantes disponibles</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end gap-2 p-6 border-t border-gray-200">
                {(selectedNotification || notificationDetails) && (selectedNotification || notificationDetails)!.status === 'pending' && (selectedNotification || notificationDetails)!.type === 'coordinador' && (
                  <>
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        openRejectDialog((selectedNotification || notificationDetails)!);
                      }}
                      className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Rechazar
                    </button>
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        handleApprove((selectedNotification || notificationDetails)!);
                      }}
                      disabled={processing === (selectedNotification || notificationDetails)!._id}
                      className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {processing === (selectedNotification || notificationDetails)!._id ? 'Aprobando...' : 'Aprobar'}
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedNotification(null);
                    setNotificationDetails(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dialog de rechazo */}
        {showRejectDialog && selectedNotification && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Rechazar Notificación</h3>
                <button
                  onClick={() => {
                    setShowRejectDialog(false);
                    setSelectedNotification(null);
                    setRejectionReason('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    ¿Estás seguro de que quieres rechazar esta notificación?
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="font-medium text-gray-900">{selectedNotification.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{selectedNotification.message}</p>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Razón del rechazo (opcional)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    rows={3}
                    placeholder="Explica por qué se rechaza esta notificación..."
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 p-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowRejectDialog(false);
                    setSelectedNotification(null);
                    setRejectionReason('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReject}
                  disabled={processing === selectedNotification._id}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing === selectedNotification._id ? 'Rechazando...' : 'Rechazar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
