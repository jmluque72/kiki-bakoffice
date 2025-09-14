import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  Building2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useBackofficeAsistencias, AsistenciaFilters } from '../../hooks/useBackofficeAsistencias';
import { useAuth } from '../../hooks/useAuth';
import { useDivisions } from '../../hooks/useDivisions';
import { Notification } from '../Notification';
import { AttendanceCalendar } from '../AttendanceCalendar';
import { AttendanceDayModal } from '../AttendanceDayModal';
import { Asistencia } from '../../services/asistenciaService';

export const AsistenciasSection: React.FC = () => {
  const { user } = useAuth();
  const { divisions, loading: divisionsLoading, error: divisionsError } = useDivisions();

  console.log('📊 [ASISTENCIAS] Componente renderizado');
  console.log('📊 [ASISTENCIAS] User:', user);
  console.log('📊 [ASISTENCIAS] Divisions:', divisions);
  console.log('📊 [ASISTENCIAS] Divisions loading:', divisionsLoading);
  console.log('📊 [ASISTENCIAS] Divisions error:', divisionsError);
  
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedDayAsistencias, setSelectedDayAsistencias] = useState<Asistencia[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');

  // Manejar selección de división
  const handleDivisionChange = (divisionId: string) => {
    setSelectedDivision(divisionId);
  };

  // Manejar click en un día del calendario
  const handleDateClick = (date: string, asistencias: Asistencia[]) => {
    console.log('📊 [ASISTENCIAS] handleDateClick llamado');
    console.log('📊 [ASISTENCIAS] Fecha:', date);
    console.log('📊 [ASISTENCIAS] Asistencias recibidas:', asistencias);
    console.log('📊 [ASISTENCIAS] Cantidad de asistencias:', asistencias.length);
    
    setSelectedDate(date);
    setSelectedDayAsistencias(asistencias);
    setShowDayModal(true);
    
    console.log('📊 [ASISTENCIAS] Modal abierto:', true);
  };

  // Cerrar modal del día
  const handleCloseDayModal = () => {
    setShowDayModal(false);
    setSelectedDate('');
    setSelectedDayAsistencias([]);
  };

  // Cerrar notificación
  const handleCloseNotification = () => {
    setShowNotification(false);
  };

  // No seleccionar automáticamente, dejar que el usuario elija

  // Si no hay usuario, mostrar mensaje
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Cargando usuario...
          </h3>
          <p className="text-gray-500">
            Por favor espera mientras se carga la información.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Asistencias</h2>
            <p className="text-gray-600">Registro y consulta de asistencias por división</p>
          </div>
        </div>
      </div>

      {/* Error de divisiones */}
      {divisionsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">{divisionsError}</p>
          </div>
        </div>
      )}

      {/* Selector de División */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Building2 className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Seleccionar División</h3>
        </div>
        
        {divisionsLoading ? (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-gray-600">Cargando divisiones...</span>
          </div>
        ) : divisions.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              No hay divisiones disponibles
            </h4>
            <p className="text-gray-500">
              No se encontraron divisiones para tu institución.
            </p>
          </div>
        ) : (
          <div className="max-w-md">
            <label htmlFor="division-select" className="block text-sm font-medium text-gray-700 mb-2">
              División
            </label>
            <select
              id="division-select"
              value={selectedDivision}
              onChange={(e) => handleDivisionChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">Selecciona una división</option>
              {divisions.map((division) => (
                <option key={division._id} value={division._id}>
                  {division.nombre}
                </option>
              ))}
            </select>
            {selectedDivision && (
              <p className="mt-2 text-sm text-gray-600">
                División seleccionada: {divisions.find(d => d._id === selectedDivision)?.nombre}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Calendario de Asistencias */}
      {selectedDivision && (
        <AttendanceCalendar
          selectedDivision={selectedDivision}
          onDateClick={handleDateClick}
        />
      )}

      {/* Modal de Asistencias del Día */}
      <AttendanceDayModal
        isOpen={showDayModal}
        onClose={handleCloseDayModal}
        date={selectedDate}
        asistencias={selectedDayAsistencias}
      />

      {/* Notificación */}
      {showNotification && (
        <Notification
          message={notificationMessage}
          type={notificationType}
          onClose={handleCloseNotification}
        />
      )}
    </div>
  );
};