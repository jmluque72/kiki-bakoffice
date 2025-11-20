import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  Users,
  AlertCircle,
  Download,
  Loader2
} from 'lucide-react';
import { EventService, Event } from '../services/eventService';
import { apiClient } from '../config/api';
import * as XLSX from 'xlsx';


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
  console.log('📅 [EVENTS_CALENDAR] Componente inicializado con división:', selectedDivision);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

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
      
      // Debug: mostrar días con eventos
      if (dayEvents.length > 0) {
        console.log('📅 [EVENTS_CALENDAR] Día con eventos:', dateString, 'Eventos:', dayEvents.length);
      }
      
      // Crear fecha local para evitar problemas de zona horaria
      const localDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      
      days.push({
        date: localDate,
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
    // Usar fecha local para evitar problemas de zona horaria
    const year = day.date.getFullYear();
    const month = String(day.date.getMonth() + 1).padStart(2, '0');
    const dayNum = String(day.date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${dayNum}`;
    
    console.log('📅 [EVENTS_CALENDAR] Click en día - Fecha original:', day.date.toISOString());
    console.log('📅 [EVENTS_CALENDAR] Click en día - Año:', year, 'Mes:', month, 'Día:', dayNum);
    console.log('📅 [EVENTS_CALENDAR] Click en día - DateString:', dateString);
    console.log('📅 [EVENTS_CALENDAR] Click en día - Eventos:', day.events);
    onDateClick(dateString, day.events);
  };

  // Cargar eventos cuando cambie la división o el mes
  useEffect(() => {
    console.log('📅 [EVENTS_CALENDAR] useEffect ejecutado:', { selectedDivision, currentDate: currentDate.toISOString() });
    if (selectedDivision) {
      console.log('📅 [EVENTS_CALENDAR] Cargando eventos para división:', selectedDivision);
      loadMonthEvents(currentDate);
    } else {
      console.log('📅 [EVENTS_CALENDAR] No hay división seleccionada');
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

  // Exportar eventos del mes a Excel
  const handleExportToExcel = async () => {
    if (!selectedDivision) {
      alert('Por favor, selecciona una división primero');
      return;
    }

    try {
      setExporting(true);
      
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const params = new URLSearchParams({
        divisionId: selectedDivision,
        fechaInicio: startDate.toISOString().split('T')[0],
        fechaFin: endDate.toISOString().split('T')[0]
      });

      console.log('📊 [EXPORT] Obteniendo eventos para exportar...', params.toString());
      
      const response = await apiClient.get(`/api/events/export/month?${params.toString()}`);
      const { events, totalEvents, totalStudents } = response.data.data;

      console.log('📊 [EXPORT] Eventos recibidos:', totalEvents);

      // Preparar datos para Excel
      const excelData: any[] = [];

      events.forEach((event: any) => {
        if (event.requiereAutorizacion && (event.authorizations.length > 0 || event.studentsPending.length > 0)) {
          // Evento con autorizaciones
          // Agregar fila principal del evento
          excelData.push({
            'Evento': event.titulo,
            'Fecha': new Date(event.fecha).toLocaleDateString('es-AR'),
            'Hora': event.hora,
            'Lugar': event.lugar || '',
            'Descripción': event.descripcion,
            'Requiere Autorización': 'Sí',
            'Estudiante': '',
            'Tutor': '',
            'Email Tutor': '',
            'Estado Autorización': '',
            'Fecha Autorización': '',
            'Comentarios': ''
          });

          // Agregar autorizaciones aprobadas
          const autorizados = event.authorizations.filter((auth: any) => auth.autorizado);
          autorizados.forEach((auth: any) => {
            excelData.push({
              'Evento': '',
              'Fecha': '',
              'Hora': '',
              'Lugar': '',
              'Descripción': '',
              'Requiere Autorización': '',
              'Estudiante': auth.estudiante,
              'Tutor': auth.tutor,
              'Email Tutor': auth.emailTutor,
              'Estado Autorización': 'Aprobado',
              'Fecha Autorización': auth.fechaAutorizacion ? new Date(auth.fechaAutorizacion).toLocaleDateString('es-AR') : '',
              'Comentarios': auth.comentarios
            });
          });

          // Agregar autorizaciones rechazadas
          const rechazados = event.authorizations.filter((auth: any) => !auth.autorizado);
          rechazados.forEach((auth: any) => {
            excelData.push({
              'Evento': '',
              'Fecha': '',
              'Hora': '',
              'Lugar': '',
              'Descripción': '',
              'Requiere Autorización': '',
              'Estudiante': auth.estudiante,
              'Tutor': auth.tutor,
              'Email Tutor': auth.emailTutor,
              'Estado Autorización': 'Rechazado',
              'Fecha Autorización': auth.fechaAutorizacion ? new Date(auth.fechaAutorizacion).toLocaleDateString('es-AR') : '',
              'Comentarios': auth.comentarios
            });
          });

          // Agregar pendientes
          event.studentsPending.forEach((student: any) => {
            excelData.push({
              'Evento': '',
              'Fecha': '',
              'Hora': '',
              'Lugar': '',
              'Descripción': '',
              'Requiere Autorización': '',
              'Estudiante': student.estudiante,
              'Tutor': '',
              'Email Tutor': '',
              'Estado Autorización': 'Pendiente',
              'Fecha Autorización': '',
              'Comentarios': ''
            });
          });

          // Agregar fila vacía entre eventos
          excelData.push({
            'Evento': '',
            'Fecha': '',
            'Hora': '',
            'Lugar': '',
            'Descripción': '',
            'Requiere Autorización': '',
            'Estudiante': '',
            'Tutor': '',
            'Email Tutor': '',
            'Estado Autorización': '',
            'Fecha Autorización': '',
            'Comentarios': ''
          });
        } else {
          // Evento sin autorización o sin autorizaciones registradas
          excelData.push({
            'Evento': event.titulo,
            'Fecha': new Date(event.fecha).toLocaleDateString('es-AR'),
            'Hora': event.hora,
            'Lugar': event.lugar || '',
            'Descripción': event.descripcion,
            'Requiere Autorización': event.requiereAutorizacion ? 'Sí' : 'No',
            'Estudiante': '',
            'Tutor': '',
            'Email Tutor': '',
            'Estado Autorización': '',
            'Fecha Autorización': '',
            'Comentarios': ''
          });
        }
      });

      // Crear workbook y worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Eventos');

      // Ajustar ancho de columnas
      const colWidths = [
        { wch: 30 }, // Evento
        { wch: 12 }, // Fecha
        { wch: 10 }, // Hora
        { wch: 25 }, // Lugar
        { wch: 40 }, // Descripción
        { wch: 20 }, // Requiere Autorización
        { wch: 30 }, // Estudiante
        { wch: 25 }, // Tutor
        { wch: 30 }, // Email Tutor
        { wch: 20 }, // Estado Autorización
        { wch: 18 }, // Fecha Autorización
        { wch: 40 }  // Comentarios
      ];
      ws['!cols'] = colWidths;

      // Generar nombre de archivo con fecha
      const monthName = monthNames[currentDate.getMonth()];
      const fileName = `eventos_${monthName}_${year}_${selectedDivision}.xlsx`;

      // Descargar archivo
      XLSX.writeFile(wb, fileName);
      console.log('✅ [EXPORT] Archivo exportado exitosamente:', fileName);

    } catch (error: any) {
      console.error('❌ [EXPORT] Error al exportar eventos:', error);
      alert('Error al exportar eventos: ' + (error.response?.data?.message || error.message));
    } finally {
      setExporting(false);
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
            onClick={handleExportToExcel}
            disabled={exporting || !selectedDivision}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Exportar eventos del mes a Excel"
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Exportando...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Exportar a Excel</span>
              </>
            )}
          </button>
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
                      className={`w-2 h-2 rounded-full ${getEventColor(event.categoria || '')}`}
                      title={event.titulo}
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
                    ${getEventColor(event.categoria || '')} text-white
                  `}
                  title={event.titulo}
                >
                  {event.titulo}
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
