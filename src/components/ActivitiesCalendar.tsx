import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  AlertCircle
} from 'lucide-react';
import { apiClient } from '../config/api';

interface Activity {
  _id: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  hora: string;
  lugar: string;
  estado: string;
  categoria: string;
  imagenes: string[];
  objetivos: string[];
  materiales: string[];
  evaluacion: string;
  observaciones: string;
  participantes: any[];
  creador: {
    name: string;
  };
  institucion: {
    _id: string;
    nombre: string;
  };
  division?: {
    _id: string;
    nombre: string;
  };
}

interface ActivitiesCalendarProps {
  selectedDivision: string;
  onDateClick: (date: string, activities: Activity[]) => void;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  activities: Activity[];
  hasActivities: boolean;
}

export const ActivitiesCalendar: React.FC<ActivitiesCalendarProps> = ({
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

  const loadMonthActivities = async (date: Date) => {
    if (!selectedDivision) return;

    try {
      setLoading(true);
      setError(null);

      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const params = {
        divisionId: selectedDivision,
        fechaInicio: startDate.toISOString().split('T')[0],
        fechaFin: endDate.toISOString().split('T')[0]
      };

      console.log('📅 [ACTIVITIES_CALENDAR] Cargando actividades del mes para:', params);

      const response = await apiClient.get(`/backoffice/actividades/calendar?${new URLSearchParams(params).toString()}`);
      const calendarData = response.data.data;
      
      console.log('📅 [ACTIVITIES_CALENDAR] Datos del calendario recibidos:', calendarData);

      generateCalendarDays(date, calendarData);

    } catch (err: any) {
      console.error('Error loading month activities:', err);
      setError(err.message || 'Error al cargar actividades del calendario');
    } finally {
      setLoading(false);
    }
  };

  const generateCalendarDays = (date: Date, calendarData: { [fecha: string]: { fecha: string; totalActividades: number; actividades: Activity[] } }) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const today = new Date();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    const days: CalendarDay[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      const dayData = calendarData[dateString];
      const dayActivities = dayData ? dayData.actividades : [];
      
      days.push({
        date: new Date(currentDate),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: currentDate.toDateString() === today.toDateString(),
        activities: dayActivities,
        hasActivities: dayActivities.length > 0
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    setCalendarDays(days);
  };

  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
    loadMonthActivities(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
    loadMonthActivities(newDate);
  };

  const handleDayClick = (day: CalendarDay) => {
    const dateString = day.date.toISOString().split('T')[0];
    onDateClick(dateString, day.activities);
  };

  useEffect(() => {
    if (selectedDivision) {
      loadMonthActivities(currentDate);
    }
  }, [selectedDivision, currentDate]);

  const getActivityColor = (categoria: string) => {
    switch (categoria) {
      case 'academica': return 'bg-blue-500';
      case 'deportiva': return 'bg-green-500';
      case 'cultural': return 'bg-purple-500';
      case 'recreativa': return 'bg-yellow-500';
      case 'social': return 'bg-indigo-500';
      case 'otra': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border w-full min-w-[800px]">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-4">
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

      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-7 border-b border-gray-200">
        {dayNames.map((day) => (
          <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 bg-gray-50">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => (
          <div
            key={index}
            onClick={() => handleDayClick(day)}
            className={`
              min-h-[120px] min-w-[120px] p-2 border-r border-b border-gray-200 cursor-pointer transition-colors
              ${day.isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 text-gray-400'}
              ${day.isToday ? 'bg-blue-50 border-blue-200' : ''}
              ${day.hasActivities ? 'bg-green-50 border-green-200' : ''}
            `}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`
                text-sm font-medium
                ${day.isToday ? 'text-blue-600' : day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
              `}>
                {day.date.getDate()}
              </span>
              {day.hasActivities && (
                <div className="flex space-x-1">
                  {day.activities.slice(0, 2).map((activity, activityIndex) => (
                    <div
                      key={activityIndex}
                      className={`w-2 h-2 rounded-full ${getActivityColor(activity.categoria)}`}
                      title={activity.titulo}
                    />
                  ))}
                  {day.activities.length > 2 && (
                    <div className="w-2 h-2 rounded-full bg-gray-400" title={`+${day.activities.length - 2} más`} />
                  )}
                </div>
              )}
            </div>
            
            <div className="space-y-1">
              {day.activities.slice(0, 2).map((activity) => (
                <div
                  key={activity._id}
                  className={`
                    text-xs p-1 rounded overflow-hidden text-ellipsis whitespace-nowrap
                    ${getActivityColor(activity.categoria)} text-white
                  `}
                  title={activity.titulo}
                  style={{ 
                    maxWidth: '100%',
                    minWidth: '80px',
                    display: 'block'
                  }}
                >
                  {activity.titulo}
                </div>
              ))}
              {day.activities.length > 2 && (
                <div className="text-xs text-gray-500">
                  +{day.activities.length - 2} más
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-4 text-sm">
          <span className="text-gray-600 font-medium">Leyenda:</span>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Académica</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Deportiva</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span>Cultural</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Recreativa</span>
          </div>
        </div>
      </div>
    </div>
  );
};
