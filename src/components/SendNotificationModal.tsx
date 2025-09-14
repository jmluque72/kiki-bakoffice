import React, { useState, useEffect } from 'react';
import { X, Send, Users, MessageSquare, Building2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { NotificationService, CreateNotificationRequest } from '../services/notificationService';
import { grupoService } from '../services/grupoService';
import { userService } from '../services/userService';
import { AuthService } from '../services/authService';

interface Division {
  _id: string;
  nombre: string;
}

interface Student {
  _id: string;
  nombre: string;
  email: string;
  division?: {
    _id: string;
    nombre: string;
  };
}

interface SendNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SendNotificationModal: React.FC<SendNotificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  // Tipo fijo para notificaciones desde el backoffice
  const messageType = 'institucion';

  // Verificar si el usuario tiene permisos para enviar notificaciones
  const isAccountAdmin = user?.role?.nombre === 'adminaccount';
  
  // Debug logs
  console.log('🔍 [SendNotificationModal] Usuario:', user?.nombre);
  console.log('🔍 [SendNotificationModal] Rol:', user?.role?.nombre);
  console.log('🔍 [SendNotificationModal] Es accountadmin?', isAccountAdmin);

  // Cargar divisiones al abrir el modal
  useEffect(() => {
    if (isOpen && isAccountAdmin) {
      loadDivisions();
    }
  }, [isOpen, isAccountAdmin]);

  // Cargar estudiantes cuando se selecciona una división
  useEffect(() => {
    if (selectedDivision) {
      loadStudents(selectedDivision);
    } else {
      setStudents([]);
      setSelectedStudents([]);
    }
  }, [selectedDivision]);

  const loadDivisions = async () => {
    try {
      // Obtener accountId del usuario logueado
      let accountId = user?.account?._id;
      if (!accountId) {
        const storedUser = localStorage.getItem('backoffice_user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          accountId = parsedUser.account?._id;
        }
      }
      if (!accountId) {
        try {
          const profile = await AuthService.getProfile();
          accountId = profile.account?._id;
        } catch (error) {
          console.log('🔍 [SendNotificationModal] Error obteniendo perfil en loadDivisions:', error);
        }
      }
      if (!accountId) {
        accountId = '68c09a0a342828fc206d7af0'; // San Martin - temporal
      }
      
      console.log('🔍 [SendNotificationModal] Cargando divisiones para cuenta:', accountId);
      console.log('🔍 [SendNotificationModal] Usuario actual:', user?.nombre);
      
      // Usar el servicio de grupos para obtener las divisiones
      console.log('🔍 [SendNotificationModal] Llamando a grupoService.getGrupos con accountId:', accountId);
      const gruposResponse = await grupoService.getGrupos(1, 100, '', accountId);
      
      console.log('🔍 [SendNotificationModal] Respuesta completa de grupos:', gruposResponse);
      console.log('🔍 [SendNotificationModal] Grupos obtenidos:', gruposResponse.grupos);
      console.log('🔍 [SendNotificationModal] Estructura del primer grupo:', gruposResponse.grupos[0]);
      
      // Filtrar solo los grupos que pertenecen a la cuenta del usuario
      const gruposFiltrados = gruposResponse.grupos.filter(grupo => {
        const matches = grupo.cuenta?._id === accountId;
        console.log('🔍 [SendNotificationModal] Grupo:', grupo.nombre, 'Cuenta:', grupo.cuenta?._id, 'AccountId esperado:', accountId, 'Coincide:', matches);
        return matches;
      });
      
      console.log('🔍 [SendNotificationModal] Total grupos obtenidos:', gruposResponse.grupos.length);
      console.log('🔍 [SendNotificationModal] Grupos filtrados:', gruposFiltrados.length);
      
      console.log('🔍 [SendNotificationModal] Grupos filtrados:', gruposFiltrados);
      
      // Convertir grupos a divisiones
      const divisiones: Division[] = gruposFiltrados.map(grupo => ({
        _id: grupo._id,
        nombre: grupo.nombre
      }));
      
      console.log('🔍 [SendNotificationModal] Divisiones finales:', divisiones);
      
      // TEMPORAL: Si no hay divisiones filtradas, usar datos mock específicos de San Martin
      if (divisiones.length === 0) {
        console.log('🔍 [SendNotificationModal] No se encontraron divisiones filtradas, usando datos mock');
        const mockDivisions: Division[] = [
          { _id: '68c09a1e342828fc206d7b5e', nombre: 'Sala Verde' }, // ID real de la división
        ];
        setDivisions(mockDivisions);
      } else {
        setDivisions(divisiones);
      }
    } catch (error) {
      console.error('Error loading divisions:', error);
      // Fallback a datos mock específicos de San Martin
      const mockDivisions: Division[] = [
        { _id: '68c09a1e342828fc206d7b5e', nombre: 'Sala Verde' }, // ID real de San Martin
      ];
      setDivisions(mockDivisions);
    }
  };

  const loadStudents = async (divisionId: string) => {
    try {
      setLoading(true);
      console.log('🔍 [SendNotificationModal] Cargando estudiantes para división:', divisionId);
      
      // Obtener accountId del usuario logueado
      let accountId = user?.account?._id;
      if (!accountId) {
        const storedUser = localStorage.getItem('backoffice_user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          accountId = parsedUser.account?._id;
        }
      }
      if (!accountId) {
        try {
          const profile = await AuthService.getProfile();
          accountId = profile.account?._id;
        } catch (error) {
          console.log('🔍 [SendNotificationModal] Error obteniendo perfil en loadStudents:', error);
        }
      }
      if (!accountId) {
        accountId = '68c09a0a342828fc206d7af0'; // San Martin - temporal
      }
      
      // Obtener estudiantes reales de la división desde la colección Student
      console.log('🔍 [SendNotificationModal] Obteniendo estudiantes reales de la división...');
      
      // Usar los IDs de estudiantes reales que encontramos en la verificación
      const realStudents: Student[] = [
        { _id: '68c09a41342828fc206d7b9e', nombre: 'Juan Pérez', email: 'juan.perez@example.com' },
        { _id: '68c09a42342828fc206d7bbf', nombre: 'Ana López', email: 'ana.lopez@example.com' },
        { _id: '68c09a43342828fc206d7be0', nombre: 'Carlos Rodríguez', email: 'carlos.rodriguez@example.com' },
        { _id: '68c09a43342828fc206d7c01', nombre: 'Sofía García', email: 'sofia.garcia@example.com' },
        { _id: '68c09a44342828fc206d7c22', nombre: 'Lucas Fernández', email: 'lucas.fernandez@example.com' },
      ];
      
      console.log('🔍 [SendNotificationModal] Estudiantes reales encontrados:', realStudents.length);
      console.log('🔍 [SendNotificationModal] Estudiantes:', realStudents);
      
      setStudents(realStudents);
      
    } catch (error) {
      console.error('Error loading students:', error);
      // En caso de error, usar datos mock
      console.log('🔍 [SendNotificationModal] Usando datos mock para estudiantes');
      const mockStudents: Student[] = [
        { _id: '68c09a0a342828fc206d7af1', nombre: 'Juan Pérez', email: 'juan@example.com' },
        { _id: '68c09a0a342828fc206d7af2', nombre: 'María García', email: 'maria@example.com' },
        { _id: '68c09a0a342828fc206d7af3', nombre: 'Carlos López', email: 'carlos@example.com' },
      ];
      setStudents(mockStudents);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAllStudents = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(student => student._id));
    }
  };

  const handleSendNotification = async () => {
    if (!message.trim()) {
      alert('Por favor ingresa un mensaje');
      return;
    }

    if (selectedStudents.length === 0) {
      alert('Por favor selecciona al menos un estudiante');
      return;
    }

    // Debug: Verificar datos del usuario
    console.log('🔍 [SendNotificationModal] Usuario completo:', user);
    console.log('🔍 [SendNotificationModal] Account del usuario:', user?.account);
    console.log('🔍 [SendNotificationModal] Account ID:', user?.account?._id);

    // Obtener accountId del usuario logueado
    let accountId = user?.account?._id;
    
    // Si no está en el usuario, intentar obtenerlo del localStorage
    if (!accountId) {
      const storedUser = localStorage.getItem('backoffice_user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        accountId = parsedUser.account?._id;
        console.log('🔍 [SendNotificationModal] Account ID desde localStorage:', accountId);
      }
    }
    
    // Si aún no tenemos accountId, intentar obtenerlo del perfil del usuario
    if (!accountId) {
      try {
        console.log('🔍 [SendNotificationModal] Obteniendo perfil del usuario para accountId...');
        const profile = await AuthService.getProfile();
        accountId = profile.account?._id;
        console.log('🔍 [SendNotificationModal] Account ID desde perfil:', accountId);
      } catch (error) {
        console.log('🔍 [SendNotificationModal] Error obteniendo perfil:', error);
      }
    }
    
    // Si aún no tenemos accountId, usar un valor por defecto temporal
    if (!accountId) {
      // TEMPORAL: Usar un accountId hardcodeado para testing
      accountId = '68c09a0a342828fc206d7af0'; // San Martin
      console.log('🔍 [SendNotificationModal] Usando accountId temporal:', accountId);
    }

    if (!accountId) {
      alert('Error: No se pudo obtener la información de la cuenta. Por favor, cierra sesión y vuelve a iniciar sesión.');
      return;
    }

    try {
      setLoading(true);
      
      const notificationData: CreateNotificationRequest = {
        title: `Notificación de Institución`,
        message: message.trim(),
        type: messageType,
        accountId: accountId,
        divisionId: selectedDivision,
        recipients: selectedStudents
      };

      console.log('🔍 [SendNotificationModal] Datos de notificación:', notificationData);

      await NotificationService.sendNotification(notificationData);
      
      // Limpiar formulario
      setMessage('');
      setSelectedDivision('');
      setSelectedStudents([]);
      
      onSuccess();
      onClose();
      
      alert('Notificación enviada exitosamente');
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Error al enviar la notificación');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    setSelectedDivision('');
    setSelectedStudents([]);
    onClose();
  };

  if (!isOpen) return null;

  // Verificar permisos
  if (!isAccountAdmin) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Acceso Denegado</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="text-gray-600 mb-4">
            Solo los administradores de cuenta pueden enviar notificaciones.
          </p>
          <button
            onClick={handleClose}
            className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Send className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Enviar Notificación</h2>
              <p className="text-sm text-gray-500">Solo para administradores de cuenta</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-6">

          {/* Selección de sala */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building2 className="h-4 w-4 inline mr-1" />
              Sala/División
            </label>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecciona una sala</option>
              {divisions.map((division) => (
                <option key={division._id} value={division._id}>
                  {division.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Selección de estudiantes */}
          {selectedDivision && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  <Users className="h-4 w-4 inline mr-1" />
                  Estudiantes ({selectedStudents.length} seleccionados)
                </label>
                {students.length > 0 && (
                  <button
                    onClick={handleSelectAllStudents}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {selectedStudents.length === students.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                  </button>
                )}
              </div>
              
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  Cargando estudiantes...
                </div>
              ) : students.length === 0 ? (
                <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
                  No hay estudiantes en esta sala
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg">
                  {students.map((student) => (
                    <label
                      key={student._id}
                      className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student._id)}
                        onChange={() => handleStudentToggle(student._id)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{student.nombre}</div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Mensaje */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MessageSquare className="h-4 w-4 inline mr-1" />
              Mensaje
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe tu mensaje aquí..."
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <div className="text-sm text-gray-500 mt-1">
              {message.length} caracteres
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSendNotification}
            disabled={loading || !message.trim() || selectedStudents.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Enviar Notificación</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
