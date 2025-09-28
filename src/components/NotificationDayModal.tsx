import React, { useState, useEffect } from 'react';
import { X, Bell, Clock, User, Mail } from 'lucide-react';
import { apiClient } from '../config/api';
import { Notification } from '../services/notificationService';

interface NotificationDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  notifications: Notification[];
}

export const NotificationDayModal: React.FC<NotificationDayModalProps> = ({
  isOpen,
  onClose,
  date,
  notifications
}) => {
  const [studentsData, setStudentsData] = useState<{[key: string]: any}>({});
  const [loadingStudents, setLoadingStudents] = useState(false);
  console.log('📅 [NOTIFICATION_DAY_MODAL] Modal abierto con fecha:', date);
  console.log('📅 [NOTIFICATION_DAY_MODAL] Fecha original:', date);
  console.log('📅 [NOTIFICATION_DAY_MODAL] Notificaciones recibidas:', notifications.length);
  console.log('📅 [NOTIFICATION_DAY_MODAL] Cache bust - v2');
  
  // Debug de datos de notificaciones
  notifications.forEach((notification, index) => {
    console.log(`📅 [NOTIFICATION_DAY_MODAL] Notificación ${index + 1}:`, {
      id: notification._id,
      title: notification.title,
      recipients: notification.recipients,
      readBy: notification.readBy,
      recipientsLength: notification.recipients?.length || 0,
      readByLength: notification.readBy?.length || 0
    });
    
    // Debug detallado de recipients
    if (notification.recipients && notification.recipients.length > 0) {
      console.log(`📅 [NOTIFICATION_DAY_MODAL] Recipients detallados:`, notification.recipients.map((r, i) => ({
        index: i,
        recipient: r,
        hasNombre: !!r.nombre,
        hasEmail: !!r.email,
        nombre: r.nombre,
        email: r.email
      })));
    }
    
    // Debug detallado de readBy
    if (notification.readBy && notification.readBy.length > 0) {
      console.log(`📅 [NOTIFICATION_DAY_MODAL] ReadBy detallado:`, notification.readBy.map((r, i) => ({
        index: i,
        reader: r,
        hasNombre: !!r.nombre,
        hasEmail: !!r.email,
        nombre: r.nombre,
        email: r.email
      })));
    }
  });
  
  // Función para cargar datos de estudiantes
  const loadStudentsData = async () => {
    if (loadingStudents) return;
    
    setLoadingStudents(true);
    try {
      // Recopilar todos los IDs únicos de estudiantes
      const allStudentIds = new Set<string>();
      notifications.forEach(notification => {
        if (notification.recipients && Array.isArray(notification.recipients)) {
          notification.recipients.forEach(recipient => {
            if (typeof recipient === 'string') {
              allStudentIds.add(recipient);
            }
          });
        }
      });

      if (allStudentIds.size === 0) {
        setLoadingStudents(false);
        return;
      }

      console.log('📅 [NOTIFICATION_DAY_MODAL] Cargando datos de estudiantes:', Array.from(allStudentIds));

      // Hacer llamadas para obtener datos de cada estudiante
      const studentsPromises = Array.from(allStudentIds).map(async (studentId) => {
        try {
          const response = await apiClient.get(`/students/${studentId}`);
          console.log(`📅 [NOTIFICATION_DAY_MODAL] Respuesta para estudiante ${studentId}:`, response.data);
          return { id: studentId, data: response.data.data }; // Acceder a response.data.data
        } catch (error) {
          console.error(`Error cargando estudiante ${studentId}:`, error);
          return { id: studentId, data: null };
        }
      });

      const studentsResults = await Promise.all(studentsPromises);
      const studentsMap: {[key: string]: any} = {};
      
      studentsResults.forEach(result => {
        if (result.data) {
          studentsMap[result.id] = result.data;
        }
      });

             console.log('📅 [NOTIFICATION_DAY_MODAL] Datos de estudiantes cargados:', studentsMap);
             
             // Debug: mostrar estructura de cada estudiante
             Object.entries(studentsMap).forEach(([id, data]) => {
               console.log(`📅 [NOTIFICATION_DAY_MODAL] Estudiante ${id}:`, {
                 nombre: data.nombre,
                 apellido: data.apellido,
                 email: data.email,
                 nombreCompleto: data.nombre && data.apellido ? `${data.nombre} ${data.apellido}` : data.nombre
               });
             });
             
             setStudentsData(studentsMap);
    } catch (error) {
      console.error('Error cargando datos de estudiantes:', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Cargar datos de estudiantes cuando se abra el modal
  useEffect(() => {
    if (isOpen && notifications.length > 0) {
      loadStudentsData();
    }
  }, [isOpen, notifications]);

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    console.log('📅 [NOTIFICATION_DAY_MODAL] formatDate - Input:', dateString);
    const date = new Date(dateString);
    console.log('📅 [NOTIFICATION_DAY_MODAL] formatDate - Date object:', date);
    console.log('📅 [NOTIFICATION_DAY_MODAL] formatDate - Date ISO:', date.toISOString());
    console.log('📅 [NOTIFICATION_DAY_MODAL] formatDate - Date local:', date.toLocaleDateString());
    
    const formatted = date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    console.log('📅 [NOTIFICATION_DAY_MODAL] formatDate - Formatted:', formatted);
    return formatted;
  };

  // Log de la fecha formateada después de definir la función
  console.log('📅 [NOTIFICATION_DAY_MODAL] Fecha formateada:', formatDate(date));

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'informacion':
        return 'bg-blue-100 text-blue-800';
      case 'comunicacion':
        return 'bg-green-100 text-green-800';
      case 'institucion':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Bell className="w-6 h-6 text-orange-500" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Notificaciones del {formatDate(date)}
              </h2>
              <p className="text-sm text-gray-500">
                {notifications.length} notificación{notifications.length !== 1 ? 'es' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay notificaciones para este día</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div key={notification._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  {/* Header de la notificación */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {notification.title}
                      </h3>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {notification.message}
                      </p>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}>
                        {notification.type}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                        {notification.priority}
                      </span>
                    </div>
                  </div>

                  {/* Información del remitente */}
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>{notification.sender.nombre}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Mail className="w-4 h-4" />
                      <span>{notification.sender.email}</span>
                    </div>
                  </div>

                  {/* Información de la institución */}
                  <div className="text-sm text-gray-600 mb-3">
                    <span className="font-medium">Institución:</span> {notification.account.nombre}
                    {notification.division && (
                      <span className="ml-2">
                        <span className="font-medium">División:</span> {notification.division.nombre}
                      </span>
                    )}
                  </div>

                  {/* Destinatarios - Estudiantes que recibieron la notificación */}
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <User className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-gray-700">
                        Estudiantes que recibieron la notificación ({notification.recipients?.length || 0})
                      </span>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      {notification.recipients && notification.recipients.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {notification.recipients.map((recipient, index) => {
                            let displayName = `Estudiante ${index + 1}`;
                            let hasEmail = false;
                            let isRead = false;
                            
                            // Verificar si este estudiante leyó la notificación
                            if (notification.readBy && notification.readBy.length > 0) {
                              isRead = notification.readBy.some(reader => {
                                // Si el reader tiene un campo que identifica al estudiante
                                return reader.studentId === recipient || 
                                       (typeof recipient === 'string' && reader._id === recipient) ||
                                       (typeof recipient === 'object' && reader._id === recipient._id);
                              });
                            }
                            
                            // Si el recipient es un string (ID), buscar en studentsData
                            if (typeof recipient === 'string') {
                              const studentData = studentsData[recipient];
                              if (studentData) {
                                // Construir nombre completo: nombre + apellido
                                const nombreCompleto = studentData.nombre && studentData.apellido 
                                  ? `${studentData.nombre} ${studentData.apellido}`
                                  : studentData.nombre || studentData.name || studentData.email || displayName;
                                displayName = nombreCompleto;
                                hasEmail = !!(studentData.email && studentData.nombre);
                              }
                            } else {
                              // Si es un objeto, usar la lógica anterior
                              displayName = recipient.nombre || recipient.name || recipient.email || displayName;
                              hasEmail = !!(recipient.email && recipient.nombre);
                            }
                            
                            return (
                              <div key={index} className={`flex items-center space-x-2 text-sm p-2 rounded-lg ${isRead ? 'bg-green-100' : 'bg-orange-100'}`}>
                                <div className={`w-2 h-2 rounded-full ${isRead ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                                <span className={`font-medium ${isRead ? 'text-green-800' : 'text-orange-800'}`}>
                                  {displayName}
                                </span>
                                {hasEmail && (
                                  <span className="text-gray-500 text-xs">({typeof recipient === 'string' ? studentsData[recipient]?.email : recipient.email})</span>
                                )}
                                <span className={`text-xs font-medium ${isRead ? 'text-green-600' : 'text-orange-600'}`}>
                                  {isRead ? '✓ Leída' : '⏳ Pendiente'}
                                </span>
                                {loadingStudents && (
                                  <span className="text-gray-400 text-xs">(cargando...)</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-2 text-gray-500 text-sm">
                          No hay información de destinatarios disponible
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Estado de lectura - Tutores que leyeron la notificación */}
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Mail className="w-4 h-4 text-green-500" />
                      <span className="font-medium text-gray-700">
                        Tutores que leyeron la notificación ({notification.readBy?.length || 0})
                      </span>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      {notification.readBy && notification.readBy.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {notification.readBy.map((reader, index) => {
                            const displayName = reader.nombre || reader.name || reader.email || `Tutor ${index + 1}`;
                            const hasEmail = reader.email && reader.nombre;
                            return (
                              <div key={index} className="flex items-center space-x-2 text-sm p-2 rounded-lg bg-green-100">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="font-medium text-green-800">{displayName}</span>
                                {hasEmail && (
                                  <span className="text-gray-500 text-xs">({reader.email})</span>
                                )}
                                <span className="text-xs font-medium text-green-600">✓ Leída</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-2 text-gray-500 text-sm">
                          Ningún tutor ha leído esta notificación aún
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Estadísticas de lectura */}
                  <div className="mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-blue-600">{notification.recipients?.length || 0}</div>
                          <div className="text-gray-600">Enviadas</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-green-600">{notification.readBy?.length || 0}</div>
                          <div className="text-gray-600">Leídas</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-orange-600">
                            {notification.recipients?.length ? 
                              Math.round(((notification.readBy?.length || 0) / notification.recipients.length) * 100) : 0}%
                          </div>
                          <div className="text-gray-600">Tasa de lectura</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-600">
                            {(notification.recipients?.length || 0) - (notification.readBy?.length || 0)}
                          </div>
                          <div className="text-gray-600">Pendientes</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Estado general */}
                  <div className="text-sm text-gray-600 mb-3">
                    <span className="font-medium">Estado:</span> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      notification.status === 'sent' ? 'bg-green-100 text-green-800' :
                      notification.status === 'delivered' ? 'bg-blue-100 text-blue-800' :
                      notification.status === 'read' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {notification.status}
                    </span>
                  </div>

                  {/* Fechas */}
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>Enviada: {formatTime(notification.sentAt)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>Creada: {formatTime(notification.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
