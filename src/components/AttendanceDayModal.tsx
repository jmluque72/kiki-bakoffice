import React from 'react';
import { 
  X, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Calendar,
  User
} from 'lucide-react';
import { Asistencia } from '../services/asistenciaService';

interface AttendanceDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  asistencias: Asistencia[];
}

export const AttendanceDayModal: React.FC<AttendanceDayModalProps> = ({
  isOpen,
  onClose,
  date,
  asistencias
}) => {
  console.log('📋 [MODAL] AttendanceDayModal renderizado');
  console.log('📋 [MODAL] isOpen:', isOpen);
  console.log('📋 [MODAL] date:', date);
  console.log('📋 [MODAL] asistencias:', asistencias);
  console.log('📋 [MODAL] cantidad asistencias:', asistencias.length);
  
  if (asistencias.length > 0) {
    console.log('📋 [MODAL] Primera asistencia completa:', JSON.stringify(asistencias[0], null, 2));
    if (asistencias[0].estudiantes && asistencias[0].estudiantes.length > 0) {
      console.log('📋 [MODAL] Primer estudiante completo:', JSON.stringify(asistencias[0].estudiantes[0], null, 2));
    }
  }

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'No registrado';
    const time = new Date(timeString);
    return time.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtener estadísticas del día
  const getDayStats = () => {
    let totalStudents = 0;
    let presentStudents = 0;
    let absentStudents = 0;
    let lateStudents = 0;

    asistencias.forEach(asistencia => {
      asistencia.estudiantes.forEach(estudiante => {
        totalStudents++;
        if (estudiante.presente) {
          presentStudents++;
        } else {
          absentStudents++;
        }
      });
    });

    return {
      totalStudents,
      presentStudents,
      absentStudents,
      lateStudents,
      attendanceRate: totalStudents > 0 ? Math.round((presentStudents / totalStudents) * 100) : 0
    };
  };

  const stats = getDayStats();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Calendar className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Asistencias del día
              </h2>
              <p className="text-gray-600 capitalize">
                {formatDate(date)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Estadísticas del día */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalStudents}</div>
              <div className="text-sm text-gray-600">Total alumnos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.presentStudents}</div>
              <div className="text-sm text-gray-600">Presentes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.absentStudents}</div>
              <div className="text-sm text-gray-600">Ausentes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.attendanceRate}%</div>
              <div className="text-sm text-gray-600">Asistencia</div>
            </div>
          </div>
        </div>

        {/* Lista de asistencias */}
        <div className="p-6 overflow-y-auto max-h-96">
          {asistencias.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay registros de asistencia
              </h3>
              <p className="text-gray-500">
                No se encontraron registros de asistencia para este día.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {asistencias.map((asistencia) => (
                <div key={asistencia._id} className="border border-gray-200 rounded-lg p-4">
                  {/* Información de la asistencia */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-gray-900">
                        {asistencia.division?.nombre || 'División desconocida'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Registrado por: {asistencia.creadoPor?.nombre || 'Usuario desconocido'}
                    </div>
                  </div>

                  {/* Lista de estudiantes */}
                  <div className="space-y-2">
                    {asistencia.estudiantes.map((estudiante, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          {estudiante.student?.avatar?.url ? (
                            <img 
                              src={estudiante.student.avatar.url} 
                              alt={`${estudiante.student.nombre} ${estudiante.student.apellido}`}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-blue-600" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">
                              {estudiante.student?.nombre || 'Nombre'} {estudiante.student?.apellido || 'Apellido'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {estudiante.student?.email || 'Email no disponible'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {estudiante.presente ? (
                            <div className="flex items-center space-x-1 text-green-600">
                              <CheckCircle className="h-5 w-5" />
                              <span className="text-sm font-medium">Presente</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1 text-red-600">
                              <XCircle className="h-5 w-5" />
                              <span className="text-sm font-medium">Ausente</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Información adicional */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>
                        Creado: {new Date(asistencia.createdAt).toLocaleString('es-ES')}
                      </span>
                      <span>
                        ID: {asistencia._id.slice(-8)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {asistencias.length} registro{asistencias.length !== 1 ? 's' : ''} encontrado{asistencias.length !== 1 ? 's' : ''}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
