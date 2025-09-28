import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Notification } from '../services/notificationService';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  notifications: Notification[];
  hasNotifications: boolean;
}

interface NotificationsCalendarProps {
  calendarData: { [fecha: string]: { fecha: string; totalNotificaciones: number; notificaciones: Notification[] } };
  onDateClick: (date: string, notifications: Notification[]) => void;
  selectedDivision?: string | null;
}

export const NotificationsCalendar: React.FC<NotificationsCalendarProps> = ({
  calendarData,
  onDateClick,
  selectedDivision
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);

  // Generar días del calendario con notificaciones
  const generateCalendarDays = (date: Date, calendarData: { [fecha: string]: { fecha: string; totalNotificaciones: number; notificaciones: Notification[] } }) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const today = new Date();
    
    // Primer día del mes
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Día de la semana del primer día (0 = domingo, 1 = lunes, etc.)
    const startDay = firstDay.getDay();
    
    // Calcular el primer día a mostrar (puede ser del mes anterior)
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDay);
    
    // Calcular el último día a mostrar
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    const days: CalendarDay[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      const dayData = calendarData[dateString];
      const dayNotifications = dayData ? dayData.notificaciones : [];
      
      // Debug: mostrar días con notificaciones
      if (dayNotifications.length > 0) {
        console.log('📅 [NOTIFICATIONS_CALENDAR] Día con notificaciones:', dateString, 'Notificaciones:', dayNotifications.length);
      }
      
      // Crear fecha local para evitar problemas de zona horaria
      const localDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      
      days.push({
        date: localDate,
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: currentDate.toDateString() === today.toDateString(),
        notifications: dayNotifications,
        hasNotifications: dayNotifications.length > 0
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    setCalendarDays(days);
  };

  // Navegar al mes anterior
  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  // Navegar al mes siguiente
  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Manejar click en un día
  const handleDayClick = (day: CalendarDay) => {
    // Usar fecha local para evitar problemas de zona horaria
    const year = day.date.getFullYear();
    const month = String(day.date.getMonth() + 1).padStart(2, '0');
    const dayNum = String(day.date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${dayNum}`;
    
    console.log('📅 [NOTIFICATIONS_CALENDAR] Click en día - Fecha original:', day.date.toISOString());
    console.log('📅 [NOTIFICATIONS_CALENDAR] Click en día - Fecha local:', day.date.toLocaleDateString());
    console.log('📅 [NOTIFICATIONS_CALENDAR] Click en día - Año:', year, 'Mes:', month, 'Día:', dayNum);
    console.log('📅 [NOTIFICATIONS_CALENDAR] Click en día - DateString:', dateString);
    console.log('📅 [NOTIFICATIONS_CALENDAR] Click en día - Notificaciones:', day.notifications);
    onDateClick(dateString, day.notifications);
  };

  // Generar calendario cuando cambian los datos o la fecha
  useEffect(() => {
    console.log('📅 [NOTIFICATIONS_CALENDAR] Generando calendario para:', currentDate.toISOString());
    console.log('📅 [NOTIFICATIONS_CALENDAR] Datos del calendario:', Object.keys(calendarData).length, 'días');
    generateCalendarDays(currentDate, calendarData);
  }, [currentDate, calendarData]);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header del calendario */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        
        <h2 className="text-xl font-semibold text-gray-800">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Días del calendario */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => (
          <button
            key={index}
            onClick={() => handleDayClick(day)}
            className={`
              relative p-2 h-12 text-sm rounded-lg transition-colors
              ${day.isCurrentMonth 
                ? 'text-gray-900 hover:bg-blue-50' 
                : 'text-gray-400 hover:bg-gray-50'
              }
              ${day.isToday 
                ? 'bg-blue-100 text-blue-900 font-semibold' 
                : ''
              }
              ${day.hasNotifications 
                ? 'bg-orange-100 text-orange-900 font-semibold' 
                : ''
              }
            `}
          >
            <span className="block">{day.date.getDate()}</span>
            {day.hasNotifications && (
              <div className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"></div>
            )}
          </button>
        ))}
      </div>

      {/* Leyenda */}
      <div className="mt-4 flex items-center justify-center space-x-4 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-100 rounded"></div>
          <span>Hoy</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-orange-100 rounded"></div>
          <span>Con notificaciones</span>
        </div>
      </div>
    </div>
  );
};
