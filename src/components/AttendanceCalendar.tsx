import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { AsistenciaService, Asistencia } from '../services/asistenciaService';

interface AttendanceCalendarProps {
  selectedDivision: string;
  onDateClick: (date: string, asistencias: Asistencia[]) => void;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  asistencias: Asistencia[];
  hasAttendance: boolean;
}

export const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({
  selectedDivision,
  onDateClick
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Cargar datos del calendario para el mes actual
  const loadMonthAttendances = async (date: Date) => {
    if (!selectedDivision) return;

    try {
      setLoading(true);
      setError(null);

      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const params = {
        grupoId: selectedDivision,
        fechaInicio: startDate.toISOString().split('T')[0],
        fechaFin: endDate.toISOString().split('T')[0]
      };

      console.log('📅 [CALENDAR] Cargando datos del calendario para:', params);

      const calendarData = await AsistenciaService.getCalendarData(params);
      
      console.log('📅 [CALENDAR] Datos del calendario recibidos:', calendarData);

      // Generar días del calendario con los datos del calendario
      generateCalendarDays(date, calendarData);

    } catch (err: any) {
      console.error('Error loading month attendances:', err);
      setError(err.message || 'Error al cargar datos del calendario');
    } finally {
      setLoading(false);
    }
  };

  // Generar días del calendario
  const generateCalendarDays = (date: Date, calendarData: { [fecha: string]: { fecha: string; totalEstudiantes: number; presentes: number; ausentes: number } }) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const today = new Date();

    // Primer día del mes
    const firstDay = new Date(year, month, 1);
    // Último día del mes
    const lastDay = new Date(year, month + 1, 0);
    
    // Días del mes anterior para completar la primera semana
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: CalendarDay[] = [];
    const currentDate = new Date(startDate);

    // Generar 42 días (6 semanas)
    for (let i = 0; i < 42; i++) {
      const dateKey = currentDate.toISOString().split('T')[0];
      const dayData = calendarData[dateKey];
      
      days.push({
        date: new Date(currentDate),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: currentDate.toDateString() === today.toDateString(),
        asistencias: [], // Vacío por ahora, se cargará cuando se haga click
        hasAttendance: dayData ? dayData.totalEstudiantes > 0 : false
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    setCalendarDays(days);
  };

  // Navegar al mes anterior
  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  // Navegar al mes siguiente
  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  // Manejar click en un día
  const handleDayClick = async (day: CalendarDay) => {
    console.log('📅 [CALENDAR] Click en día:', day.date.toISOString().split('T')[0]);
    console.log('📅 [CALENDAR] Tiene asistencias:', day.hasAttendance);
    
    if (day.hasAttendance) {
      try {
        console.log('📅 [CALENDAR] Cargando asistencias detalladas para:', day.date.toISOString().split('T')[0]);
        const asistencias = await AsistenciaService.getDayAsistencias(
          day.date.toISOString().split('T')[0], 
          selectedDivision
        );
        console.log('📅 [CALENDAR] Asistencias detalladas cargadas:', asistencias);
        onDateClick(day.date.toISOString().split('T')[0], asistencias);
      } catch (error) {
        console.error('📅 [CALENDAR] Error cargando asistencias del día:', error);
      }
    } else {
      console.log('📅 [CALENDAR] No hay asistencias para este día');
    }
  };

  // Cargar asistencias cuando cambie el mes o la división
  useEffect(() => {
    if (selectedDivision) {
      loadMonthAttendances(currentDate);
    }
  }, [currentDate, selectedDivision]);

  // Obtener estadísticas del mes
  const getMonthStats = () => {
    const currentMonthDays = calendarDays.filter(day => day.isCurrentMonth);
    const daysWithAttendance = currentMonthDays.filter(day => day.hasAttendance).length;
    const totalAsistencias = currentMonthDays.reduce((total, day) => total + day.asistencias.length, 0);
    
    return {
      daysWithAttendance,
      totalDays: currentMonthDays.length,
      totalAsistencias
    };
  };

  const stats = getMonthStats();

  return (
    <div className="bg-white rounded-xl shadow-sm border">
      {/* Header del calendario */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <CalendarIcon className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Estadísticas del mes */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.daysWithAttendance}</div>
            <div className="text-sm text-gray-600">Días con registro</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.totalAsistencias}</div>
            <div className="text-sm text-gray-600">Total registros</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.totalDays}</div>
            <div className="text-sm text-gray-600">Días del mes</div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Calendario */}
      <div className="p-6">
        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Días del mes */}
        <div className="grid grid-cols-7 gap-1">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 42 }).map((_, index) => (
              <div key={index} className="h-12 bg-gray-100 rounded-lg animate-pulse"></div>
            ))
          ) : (
            calendarDays.map((day, index) => (
              <button
                key={index}
                onClick={() => handleDayClick(day)}
                className={`
                  h-12 rounded-lg transition-all duration-200 flex flex-col items-center justify-center text-sm
                  ${!day.isCurrentMonth 
                    ? 'text-gray-300 bg-gray-50' 
                    : day.isToday 
                      ? 'bg-blue-100 text-blue-700 font-semibold' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }
                  ${day.hasAttendance 
                    ? 'ring-2 ring-green-200 bg-green-50 hover:bg-green-100 cursor-pointer' 
                    : 'cursor-default'
                  }
                `}
              >
                <span>{day.date.getDate()}</span>
                {day.hasAttendance && (
                  <div className="flex space-x-1 mt-1">
                    <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-green-600">{day.asistencias.length}</span>
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Leyenda */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-100 ring-2 ring-green-200 rounded"></div>
            <span className="text-gray-600">Con registros</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-100 rounded"></div>
            <span className="text-gray-600">Hoy</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-100 rounded"></div>
            <span className="text-gray-600">Sin registros</span>
          </div>
        </div>
      </div>
    </div>
  );
};
