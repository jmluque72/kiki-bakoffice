import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  AlertCircle
} from 'lucide-react';
import { studentActionService, StudentActionLog } from '../services/studentActionService';

interface StudentActionsCalendarProps {
  selectedDivision: string;
  onDateClick: (date: string, actions: StudentActionLog[]) => void;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  actionCount: number;
  hasActions: boolean;
}

export const StudentActionsCalendar: React.FC<StudentActionsCalendarProps> = ({
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
  const loadMonthActions = async (date: Date) => {
    if (!selectedDivision) return;

    try {
      setLoading(true);
      setError(null);

      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const fechaInicio = startDate.toISOString().split('T')[0];
      const fechaFin = endDate.toISOString().split('T')[0];

      console.log('📅 [ACTIONS_CALENDAR] Cargando acciones del mes para:', { 
        divisionId: selectedDivision, 
        fechaInicio, 
        fechaFin,
        startDate,
        endDate
      });

      const calendarData = await studentActionService.getCalendarData(selectedDivision, fechaInicio, fechaFin);
      
      console.log('📅 [ACTIONS_CALENDAR] Datos del calendario recibidos:', calendarData);
      console.log('📅 [ACTIONS_CALENDAR] Total días con acciones:', Object.keys(calendarData).length);
      
      if (Object.keys(calendarData).length === 0) {
        console.warn('⚠️ [ACTIONS_CALENDAR] No se encontraron acciones para este mes. Verifica:');
        console.warn('   - Que la división tenga acciones registradas');
        console.warn('   - Que las fechas de las acciones estén en el rango del mes');
        console.warn('   - Que el usuario tenga permisos para ver la división');
      }

      // Generar días del calendario con los datos
      generateCalendarDays(date, calendarData);

    } catch (err: any) {
      console.error('Error loading month actions:', err);
      setError(err.message || 'Error al cargar acciones del calendario');
    } finally {
      setLoading(false);
    }
  };

  // Generar días del calendario
  const generateCalendarDays = (date: Date, calendarData: { [fecha: string]: number }) => {
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
      const actionCount = calendarData[dateKey] || 0;

      days.push({
        date: new Date(currentDate),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: dateKey === today.toISOString().split('T')[0],
        actionCount,
        hasActions: actionCount > 0
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    setCalendarDays(days);
  };

  // Cargar datos cuando cambia la división o el mes
  useEffect(() => {
    if (selectedDivision) {
      loadMonthActions(currentDate);
    }
  }, [selectedDivision, currentDate]);

  // Navegar al mes anterior
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // Navegar al mes siguiente
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Manejar click en un día
  const handleDayClick = async (day: CalendarDay) => {
    if (!day.isCurrentMonth || !selectedDivision) return;

    // Normalizar fecha a formato local (YYYY-MM-DD)
    const year = day.date.getFullYear();
    const month = String(day.date.getMonth() + 1).padStart(2, '0');
    const dayNum = String(day.date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${dayNum}`;
    
    console.log('🔍 [ACTIONS_CALENDAR] Cargando acciones del día:', dateString, 'para división:', selectedDivision);
    
    try {
      const actions = await studentActionService.getDivisionActions(selectedDivision, dateString);
      console.log('✅ [ACTIONS_CALENDAR] Acciones del día cargadas:', actions.length);
      onDateClick(dateString, actions);
    } catch (error) {
      console.error('❌ [ACTIONS_CALENDAR] Error cargando acciones del día:', error);
    }
  };

  if (!selectedDivision) {
    return (
      <div className="text-center py-12 text-gray-500">
        <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p>Selecciona una división para ver el calendario de acciones</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header del calendario */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          disabled={loading}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-semibold text-gray-800">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          disabled={loading}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Nombres de los días */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {dayNames.map(dayName => (
          <div key={dayName} className="text-center text-sm font-medium text-gray-600 py-2">
            {dayName}
          </div>
        ))}
      </div>

      {/* Días del calendario */}
      {loading ? (
        <div className="text-center py-12">
          <Clock className="w-8 h-8 mx-auto mb-4 text-blue-500 animate-spin" />
          <p className="text-gray-600">Cargando acciones...</p>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => (
            <button
              key={index}
              onClick={() => handleDayClick(day)}
              disabled={!day.isCurrentMonth || loading}
              className={`
                aspect-square p-2 rounded-lg transition-all
                ${!day.isCurrentMonth 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : day.isToday 
                    ? 'bg-blue-500 text-white font-bold hover:bg-blue-600' 
                    : day.hasActions
                      ? 'bg-blue-50 text-gray-800 hover:bg-blue-100 border-2 border-blue-300'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }
                ${day.isCurrentMonth && !loading ? 'cursor-pointer' : ''}
              `}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <span className="text-sm">{day.date.getDate()}</span>
                {day.hasActions && day.isCurrentMonth && (
                  <span className="text-xs font-semibold text-blue-600 mt-1">
                    {day.actionCount}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

