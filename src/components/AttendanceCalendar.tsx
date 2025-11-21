import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Download
} from 'lucide-react';
import { AsistenciaService, Asistencia } from '../services/asistenciaService';
import * as XLSX from 'xlsx';

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
  presentes?: number;
  totalEstudiantes?: number;
}

export const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({
  selectedDivision,
  onDateClick
}) => {
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
        hasAttendance: dayData ? dayData.totalEstudiantes > 0 : false,
        presentes: dayData ? dayData.presentes : 0,
        totalEstudiantes: dayData ? dayData.totalEstudiantes : 0
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

  // Exportar a Excel
  const handleExportToExcel = async () => {
    if (exporting) return; // Prevenir múltiples clics
    
    try {
      setExporting(true);
      
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      const fechaInicio = startDate.toISOString().split('T')[0];
      const fechaFin = endDate.toISOString().split('T')[0];

      // Obtener todas las asistencias del mes en una sola llamada
      const allAsistencias = await AsistenciaService.getBackofficeAsistencias({
        grupoId: selectedDivision,
        fechaInicio,
        fechaFin,
        limit: 10000, // Límite alto para obtener todas
        page: 1
      });

      // Organizar datos por estudiante
      const studentMap = new Map<string, {
        nombre: string;
        apellido: string;
        dni?: string;
        dias: { [fecha: string]: 'Presente' | 'Ausente' | 'Sin registro' };
        totalPresentes: number;
        totalDias: number;
        porcentaje: number;
      }>();

      // Procesar cada asistencia
      allAsistencias.asistencias.forEach(asistencia => {
        asistencia.estudiantes.forEach(estudiante => {
          const studentId = typeof estudiante.student === 'object' && estudiante.student?._id 
            ? estudiante.student._id.toString() 
            : estudiante.student?.toString() || '';
          
          if (!studentId) return;

          if (!studentMap.has(studentId)) {
            const studentData = typeof estudiante.student === 'object' ? estudiante.student : null;
            studentMap.set(studentId, {
              nombre: studentData?.nombre || '',
              apellido: studentData?.apellido || '',
              dni: studentData?.dni || '',
              dias: {},
              totalPresentes: 0,
              totalDias: 0,
              porcentaje: 0
            });
          }

          const student = studentMap.get(studentId)!;
          student.dias[asistencia.fecha] = estudiante.presente ? 'Presente' : 'Ausente';
          if (estudiante.presente) {
            student.totalPresentes++;
          }
          student.totalDias++;
        });
      });

      // Agregar días sin registro
      const currentDateForDays = new Date(startDate);
      while (currentDateForDays <= endDate) {
        const fechaStr = currentDateForDays.toISOString().split('T')[0];
        studentMap.forEach(student => {
          if (!student.dias[fechaStr]) {
            student.dias[fechaStr] = 'Sin registro';
          }
        });
        currentDateForDays.setDate(currentDateForDays.getDate() + 1);
      }

      // Calcular porcentajes
      const totalDiasMes = endDate.getDate();
      studentMap.forEach(student => {
        student.porcentaje = student.totalDias > 0 
          ? Math.round((student.totalPresentes / student.totalDias) * 100) 
          : 0;
      });

      // Preparar datos para Excel
      const excelData: any[] = [];
      
      // Encabezados: Alumno y luego cada día del mes
      const headers = ['Alumno'];
      const currentDateForHeaders = new Date(startDate);
      while (currentDateForHeaders <= endDate) {
        headers.push(`${currentDateForHeaders.getDate()}/${month}`);
        currentDateForHeaders.setDate(currentDateForHeaders.getDate() + 1);
      }
      headers.push('Total Presentes', 'Total Días', '% Asistencia Mensual');
      
      excelData.push(headers);

      // Datos de cada estudiante
      studentMap.forEach(student => {
        const row: any[] = [
          `${student.nombre} ${student.apellido}`
        ];
        
        const currentDateForRow = new Date(startDate);
        while (currentDateForRow <= endDate) {
          const fechaStr = currentDateForRow.toISOString().split('T')[0];
          row.push(student.dias[fechaStr] || 'Sin registro');
          currentDateForRow.setDate(currentDateForRow.getDate() + 1);
        }
        
        row.push(student.totalPresentes);
        row.push(student.totalDias);
        row.push(`${student.porcentaje}%`);
        
        excelData.push(row);
      });

      // Crear workbook
      const ws = XLSX.utils.aoa_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Asistencias ${monthNames[currentDate.getMonth()]}`);

      // Ajustar ancho de columnas
      const colWidths = [
        { wch: 25 }, // Alumno
      ];
      // Agregar ancho para cada día
      for (let i = 0; i < totalDiasMes; i++) {
        colWidths.push({ wch: 12 });
      }
      colWidths.push({ wch: 15 }, { wch: 12 }, { wch: 18 }); // Total Presentes, Total Días, %
      ws['!cols'] = colWidths;

      // Generar nombre de archivo
      const fileName = `asistencias_${monthNames[currentDate.getMonth()]}_${year}.xlsx`;

      // Descargar archivo
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Error al exportar asistencias:', error);
      alert('Error al exportar asistencias a Excel');
    } finally {
      setExporting(false);
    }
  };

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
              onClick={handleExportToExcel}
              disabled={exporting}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar a Excel
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
                {day.hasAttendance && day.presentes !== undefined && day.totalEstudiantes !== undefined && (
                  <div className="mt-1">
                    <span className="text-xs font-medium text-green-600">
                      {day.presentes}/{day.totalEstudiantes} ({Math.round((day.presentes / day.totalEstudiantes) * 100)}%)
                    </span>
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
