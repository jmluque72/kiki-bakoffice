import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  Users,
  AlertCircle
} from 'lucide-react';
import { EventService, Event } from '../services/eventService';


interface EventsCalendarProps {
  selectedDivision: string;
  onDateClick: (date: string, events: Event[]) => void;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: Event[];
  hasEvents: boolean;
}

export const EventsCalendar: React.FC<EventsCalendarProps> = ({
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

  // Cargar eventos del mes actual
  const loadMonthEvents = async (date: Date) => {
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

      console.log('📅 [EVENTS_CALENDAR] Cargando eventos del mes para:', params);

      const calendarData = await EventService.getCalendarData(params);
      
      console.log('📅 [EVENTS_CALENDAR] Datos del calendario recibidos:', calendarData);

      // Generar días del calendario con los datos del calendario
      generateCalendarDays(date, calendarData);

    } catch (err: any) {
      console.error('Error loading month events:', err);
      setError(err.message || 'Error al cargar eventos del calendario');
    } finally {
      setLoading(false);
    }
  };

  // Generar días del calendario con eventos
  const generateCalendarDays = (date: Date, calendarData: { [fecha: string]: { fecha: string; totalEventos: number; eventos: Event[] } }) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const today = new Date();
    
    // Primer día del mes
    const firstDay = new Date(year, month, 1);
    // Último día del mes
    const lastDay = new Date(year, month + 1, 0);
    // Primer día de la semana del primer día del mes
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // Último día de la semana del último día del mes
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    const days: CalendarDay[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      const dayData = calendarData[dateString];
      const dayEvents = dayData ? dayData.eventos : [];
      
      days.push({
        date: new Date(currentDate),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: currentDate.toDateString() === today.toDateString(),
        events: dayEvents,
        hasEvents: dayEvents.length > 0
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
    loadMonthEvents(newDate);
  };

  // Navegar al mes siguiente
  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
    loadMonthEvents(newDate);
  };

  // Manejar click en un día
  const handleDayClick = (day: CalendarDay) => {
    const dateString = day.date.toISOString().split('T')[0];
    onDateClick(dateString, day.events);
  };

  // Cargar eventos cuando cambie la división o el mes
  useEffect(() => {
    if (selectedDivision) {
      loadMonthEvents(currentDate);
    }
  }, [selectedDivision, currentDate]);

  const getEventColor = (categoria: string) => {
    switch (categoria) {
      case 'reunion': return 'bg-blue-500';
      case 'taller': return 'bg-green-500';
      case 'conferencia': return 'bg-purple-500';
      case 'seminario': return 'bg-yellow-500';
      case 'webinar': return 'bg-indigo-500';
      case 'curso': return 'bg-pink-500';
      case 'actividad_social': return 'bg-orange-500';
      case 'deportivo': return 'bg-red-500';
      case 'cultural': return 'bg-teal-500';
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
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header del calendario */}
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

      {/* Días de la semana */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {dayNames.map((day) => (
          <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 bg-gray-50">
            {day}
          </div>
        ))}
      </div>

      {/* Días del calendario */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => (
          <div
            key={index}
            onClick={() => handleDayClick(day)}
            className={`
              min-h-[120px] p-2 border-r border-b border-gray-200 cursor-pointer transition-colors
              ${day.isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 text-gray-400'}
              ${day.isToday ? 'bg-blue-50 border-blue-200' : ''}
              ${day.hasEvents ? 'bg-green-50 border-green-200' : ''}
            `}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`
                text-sm font-medium
                ${day.isToday ? 'text-blue-600' : day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
              `}>
                {day.date.getDate()}
              </span>
              {day.hasEvents && (
                <div className="flex space-x-1">
                  {day.events.slice(0, 2).map((event, eventIndex) => (
                    <div
                      key={eventIndex}
                      className={`w-2 h-2 rounded-full ${getEventColor(event.categoria)}`}
                      title={event.nombre}
                    />
                  ))}
                  {day.events.length > 2 && (
                    <div className="w-2 h-2 rounded-full bg-gray-400" title={`+${day.events.length - 2} más`} />
                  )}
                </div>
              )}
            </div>
            
            {/* Mostrar eventos del día */}
            <div className="space-y-1">
              {day.events.slice(0, 2).map((event) => (
                <div
                  key={event._id}
                  className={`
                    text-xs p-1 rounded truncate
                    ${getEventColor(event.categoria)} text-white
                  `}
                  title={event.nombre}
                >
                  {event.nombre}
                </div>
              ))}
              {day.events.length > 2 && (
                <div className="text-xs text-gray-500">
                  +{day.events.length - 2} más
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Leyenda de colores */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-4 text-sm">
          <span className="text-gray-600 font-medium">Leyenda:</span>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Reunión</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Taller</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span>Conferencia</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Seminario</span>
          </div>
        </div>
      </div>
    </div>
  );
};
