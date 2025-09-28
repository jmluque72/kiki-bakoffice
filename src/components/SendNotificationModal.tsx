import React, { useState, useEffect } from 'react';
import { X, Send, Users, MessageSquare, Building2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useDivisions } from '../hooks/useDivisions';
import { NotificationService, CreateNotificationRequest } from '../services/notificationService';
import { apiClient } from '../config/api';
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
  const { divisions, loading: loadingDivisions, error: errorDivisions } = useDivisions();
  const [loading, setLoading] = useState(false);
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
  console.log('🔍 [SendNotificationModal] Divisiones cargadas:', divisions.length);
  console.log('🔍 [SendNotificationModal] Divisiones:', divisions);

  // Cargar estudiantes cuando se selecciona una división
  useEffect(() => {
    if (selectedDivision) {
      loadStudents(selectedDivision);
    } else {
      setStudents([]);
      setSelectedStudents([]);
    }
  }, [selectedDivision]);


  const loadStudents = async (divisionId: string) => {
    try {
      setLoading(true);
      console.log('🔍 [SendNotificationModal] Cargando estudiantes para división:', divisionId);
      
      // Usar el endpoint correcto para obtener estudiantes de una división
      const response = await apiClient.get(`/students/division/${divisionId}`);
      console.log('🔍 [SendNotificationModal] Respuesta de estudiantes:', response.data);
      
      if (response.data.success && response.data.data) {
        const students = response.data.data.map((student: any) => ({
          _id: student._id,
          nombre: student.nombre || student.name,
          email: student.email,
          division: student.division
        }));
        
        console.log('🔍 [SendNotificationModal] Estudiantes encontrados:', students.length);
        setStudents(students);
      } else {
        console.log('🔍 [SendNotificationModal] No se encontraron estudiantes');
        setStudents([]);
      }
      
    } catch (error) {
      console.error('Error loading students:', error);
      console.log('🔍 [SendNotificationModal] Error cargando estudiantes, usando lista vacía');
      setStudents([]);
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
    console.log('🔍 [SendNotificationModal] Account ID desde user.account:', accountId);
    
    // Si no está en el usuario, intentar obtenerlo del localStorage
    if (!accountId) {
      const storedUser = localStorage.getItem('backoffice_user');
      console.log('🔍 [SendNotificationModal] Stored user desde localStorage:', storedUser);
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
        console.log('🔍 [SendNotificationModal] Perfil completo:', profile);
        accountId = profile.account?._id;
        console.log('🔍 [SendNotificationModal] Account ID desde perfil:', accountId);
      } catch (error) {
        console.log('🔍 [SendNotificationModal] Error obteniendo perfil:', error);
        console.log('🔍 [SendNotificationModal] Error details:', error.response?.data);
      }
    }
    
    // Si aún no tenemos accountId, obtenerlo desde las asociaciones del usuario
    if (!accountId) {
      try {
        console.log('🔍 [SendNotificationModal] Obteniendo cuenta desde asociaciones del usuario...');
        const response = await apiClient.get('/shared/user');
        console.log('🔍 [SendNotificationModal] Respuesta completa de /shared/user:', response.data);
        
        if (response.data.success && response.data.data) {
          const associations = response.data.data;
          console.log('🔍 [SendNotificationModal] Asociaciones del usuario:', associations);
          
          // Buscar la asociación activa del usuario
          if (associations && associations.length > 0) {
            const activeAssociation = associations.find(assoc => assoc.status === 'active');
            console.log('🔍 [SendNotificationModal] Asociación activa encontrada:', activeAssociation);
            if (activeAssociation && activeAssociation.account) {
              accountId = activeAssociation.account._id;
              console.log('🔍 [SendNotificationModal] Account ID desde asociación activa:', accountId);
            }
          } else {
            console.log('🔍 [SendNotificationModal] No se encontraron asociaciones');
          }
        } else {
          console.log('🔍 [SendNotificationModal] Respuesta no exitosa:', response.data);
        }
      } catch (error) {
        console.log('🔍 [SendNotificationModal] Error obteniendo asociaciones:', error);
        console.log('🔍 [SendNotificationModal] Error details:', error.response?.data);
      }
    }
    
    // Si aún no tenemos accountId, mostrar error con información de debug
    if (!accountId) {
      console.log('🔍 [SendNotificationModal] DEBUG - No se pudo obtener accountId');
      console.log('🔍 [SendNotificationModal] Usuario completo:', user);
      console.log('🔍 [SendNotificationModal] Email del usuario:', user?.email);
      console.log('🔍 [SendNotificationModal] Account del usuario:', user?.account);
      
      alert(`Error: No se pudo obtener la información de la cuenta.\n\nDebug info:\n- Email: ${user?.email}\n- Account: ${JSON.stringify(user?.account)}\n\nPor favor, cierra sesión y vuelve a iniciar sesión.`);
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
              División
            </label>
            {loadingDivisions ? (
              <div className="p-3 border border-gray-300 rounded-lg bg-gray-50">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                  Cargando divisiones...
                </div>
              </div>
            ) : errorDivisions ? (
              <div className="p-3 border border-red-300 rounded-lg bg-red-50 text-red-600">
                Error cargando divisiones: {errorDivisions}
              </div>
            ) : (
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecciona una división</option>
                {divisions.map((division) => (
                  <option key={division._id} value={division._id}>
                    {division.nombre}
                  </option>
                ))}
              </select>
            )}
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
