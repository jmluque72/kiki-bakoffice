import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
  Download,
  FileText,
  X
} from 'lucide-react';
import { studentActionService, StudentActionLog } from '../services/studentActionService';
import { apiClient } from '../config/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const [exporting, setExporting] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

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

      // Obtener todas las acciones del mes
      const allActions = await studentActionService.getDivisionActions(
        selectedDivision,
        undefined,
        fechaInicio,
        fechaFin
      );

      // Preparar datos para Excel
      const excelData: any[] = [];
      
      // Encabezados
      const headers = [
        'Fecha',
        'Alumno',
        'Acción',
        'Categoría',
        'Comentarios',
        'Registrado por',
        'Estado',
        'Fecha de registro'
      ];
      
      excelData.push(headers);

      // Datos de cada acción
      allActions.forEach(action => {
        const actionDate = new Date(action.fechaAccion);
        const fechaStr = actionDate.toLocaleDateString('es-AR');
        const registroDate = new Date(action.createdAt);
        const registroStr = registroDate.toLocaleDateString('es-AR') + ' ' + registroDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        
        const row = [
          fechaStr,
          `${action.estudiante?.nombre || ''} ${action.estudiante?.apellido || ''}`.trim(),
          action.accion?.nombre || '',
          action.accion?.categoria || '',
          action.comentarios || '',
          action.registradoPor?.name || action.registradoPor?.email || '',
          action.estado || '',
          registroStr
        ];
        
        excelData.push(row);
      });

      // Crear workbook
      const ws = XLSX.utils.aoa_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Acciones ${monthNames[currentDate.getMonth()]}`);

      // Ajustar ancho de columnas
      const colWidths = [
        { wch: 12 }, // Fecha
        { wch: 25 }, // Alumno
        { wch: 20 }, // Acción
        { wch: 15 }, // Categoría
        { wch: 40 }, // Comentarios
        { wch: 25 }, // Registrado por
        { wch: 15 }, // Estado
        { wch: 20 }  // Fecha de registro
      ];
      ws['!cols'] = colWidths;

      // Generar nombre de archivo
      const fileName = `acciones_${monthNames[currentDate.getMonth()]}_${year}.xlsx`;

      // Descargar archivo
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Error al exportar acciones:', error);
      alert('Error al exportar acciones a Excel');
    } finally {
      setExporting(false);
    }
  };

  // Cargar estudiantes de la división
  const loadStudents = async () => {
    if (!selectedDivision) return;
    
    try {
      setLoadingStudents(true);
      const response = await apiClient.get(`/api/students/division/${selectedDivision}`);
      if (response.data.success && response.data.data) {
        setStudents(response.data.data);
      }
    } catch (error) {
      console.error('Error cargando estudiantes:', error);
      setError('Error al cargar estudiantes');
    } finally {
      setLoadingStudents(false);
    }
  };

  // Abrir modal de selección de alumno
  const handleExportPDFClick = async () => {
    await loadStudents();
    setShowStudentModal(true);
  };

  // Generar PDF para un alumno
  const handleGeneratePDF = async (studentId: string) => {
    if (exportingPDF) return;
    
    try {
      setExportingPDF(true);
      
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      const fechaInicio = startDate.toISOString().split('T')[0];
      const fechaFin = endDate.toISOString().split('T')[0];

      // Obtener acciones del alumno para el mes usando el endpoint con rango de fechas
      const response = await apiClient.get(`/api/student-actions/log/student/${studentId}`, {
        params: {
          fechaInicio,
          fechaFin
        }
      });

      const monthActions = response.data.data || [];

      // Obtener información del estudiante
      const student = students.find(s => s._id === studentId);
      if (!student) {
        alert('Estudiante no encontrado');
        return;
      }

      // Crear PDF
      const doc = new jsPDF();
      
      // Configuración de colores
      const primaryColor = [14, 95, 206]; // Azul Kiki
      const secondaryColor = [255, 140, 66]; // Naranja Kiki
      const lightGray = [248, 249, 250];
      const mediumGray = [233, 236, 239];
      const darkGray = [33, 37, 41];
      const textGray = [73, 80, 87];

      // Header con gradiente
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, 210, 50, 'F');
      
      // Logo/Texto Kiki más grande y centrado
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('KIKI', 105, 22, { align: 'center' });
      
      // Subtítulo
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('Reporte de Acciones Diarias', 105, 32, { align: 'center' });
      
      // Línea decorativa
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.5);
      doc.line(20, 38, 190, 38);
      
      // Información del estudiante en caja destacada
      let startY = 60;
      doc.setFillColor(...lightGray);
      doc.roundedRect(20, startY, 170, 25, 3, 3, 'F');
      
      doc.setFontSize(11);
      doc.setTextColor(...darkGray);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMACIÓN DEL ALUMNO', 25, startY + 8);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textGray);
      doc.text(`Nombre: ${student.nombre} ${student.apellido}`, 25, startY + 15);
      doc.text(`Mes: ${monthNames[month - 1]} ${year}`, 25, startY + 22);
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text(`Total de acciones: ${monthActions.length}`, 120, startY + 15);

      // Tabla de acciones
      if (monthActions.length > 0) {
        // Ordenar acciones por fecha (más recientes primero, o más antiguas primero según prefieras)
        const sortedActions = [...monthActions]
          .filter(action => action && action.fechaAccion)
          .sort((a, b) => {
            const dateA = new Date(a.fechaAccion).getTime();
            const dateB = new Date(b.fechaAccion).getTime();
            return dateB - dateA; // Más recientes primero (cambiar a dateA - dateB para más antiguas primero)
          });

        const tableData = sortedActions.map(action => {
          try {
            const actionDate = new Date(action.fechaAccion);
            const fechaStr = actionDate.toLocaleDateString('es-AR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            });
            const horaStr = actionDate.toLocaleTimeString('es-AR', {
              hour: '2-digit',
              minute: '2-digit'
            });
            
            return [
              fechaStr,
              horaStr,
              action.accion?.nombre || 'N/A',
              action.accion?.categoria || 'N/A',
              action.comentarios || '-',
              action.registradoPor?.name || action.registradoPor?.email || 'N/A'
            ];
          } catch (error) {
            console.error('Error procesando acción:', error, action);
            return null;
          }
        }).filter(row => row !== null);

        autoTable(doc, {
          startY: startY + 30,
          head: [['Fecha', 'Hora', 'Acción', 'Categoría', 'Comentarios', 'Registrado por']],
          body: tableData,
          theme: 'striped',
          headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 11,
            halign: 'center',
            cellPadding: 5
          },
          bodyStyles: {
            fontSize: 9,
            textColor: darkGray,
            cellPadding: 4,
            lineColor: [220, 220, 220],
            lineWidth: 0.1
          },
          alternateRowStyles: {
            fillColor: lightGray
          },
          columnStyles: {
            0: { 
              cellWidth: 28,
              halign: 'center',
              fontStyle: 'bold'
            },
            1: { 
              cellWidth: 22,
              halign: 'center'
            },
            2: { 
              cellWidth: 35,
              fontStyle: 'bold'
            },
            3: { 
              cellWidth: 25,
              halign: 'center'
            },
            4: { 
              cellWidth: 50,
              fontStyle: 'italic'
            },
            5: { 
              cellWidth: 30
            }
          },
          margin: { left: 20, right: 20, top: 10 },
          styles: {
            cellPadding: 4,
            overflow: 'linebreak',
            cellWidth: 'wrap'
          },
          didDrawPage: (data: any) => {
            // Agregar número de página en cada página
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text(
              `Página ${data.pageNumber}`,
              data.settings.margin.left,
              doc.internal.pageSize.height - 10
            );
          }
        });
      } else {
        // Mensaje cuando no hay acciones
        doc.setFillColor(...lightGray);
        doc.roundedRect(20, startY + 30, 170, 20, 3, 3, 'F');
        doc.setFontSize(12);
        doc.setTextColor(...textGray);
        doc.setFont('helvetica', 'italic');
        doc.text('No hay acciones registradas para este mes.', 105, startY + 42, { align: 'center' });
      }

      // Footer mejorado
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Línea decorativa en el footer
        doc.setDrawColor(...mediumGray);
        doc.setLineWidth(0.5);
        doc.line(20, 280, 190, 280);
        
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Página ${i} de ${pageCount}`,
          105,
          287,
          { align: 'center' }
        );
        doc.text(
          `Generado el ${new Date().toLocaleDateString('es-AR', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric' 
          })}`,
          105,
          292,
          { align: 'center' }
        );
        
        // Logo pequeño en el footer
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('KIKI', 190, 292, { align: 'right' });
      }

      // Descargar PDF
      const fileName = `acciones_${student.nombre}_${student.apellido}_${monthNames[month - 1]}_${year}.pdf`;
      doc.save(fileName);
      
      setShowStudentModal(false);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF');
    } finally {
      setExportingPDF(false);
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
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportToExcel}
            disabled={exporting || loading}
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
            onClick={handleExportPDFClick}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="h-4 w-4 mr-2" />
            Exportar PDF
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
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

      {/* Modal de selección de alumno para PDF */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Seleccionar Alumno para PDF
              </h3>
              <button
                onClick={() => setShowStudentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {loadingStudents ? (
              <div className="text-center py-8">
                <Clock className="w-8 h-8 mx-auto mb-4 text-blue-500 animate-spin" />
                <p className="text-gray-600">Cargando estudiantes...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No hay estudiantes en esta división</p>
              </div>
            ) : (
              <>
                <div className="max-h-64 overflow-y-auto mb-4">
                  {students.map((student) => (
                    <button
                      key={student._id}
                      onClick={() => handleGeneratePDF(student._id)}
                      disabled={exportingPDF}
                      className="w-full text-left px-4 py-3 mb-2 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {student.nombre} {student.apellido}
                          </p>
                          {student.dni && (
                            <p className="text-sm text-gray-500">DNI: {student.dni}</p>
                          )}
                        </div>
                        {exportingPDF && (
                          <Clock className="w-4 h-4 text-blue-500 animate-spin" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowStudentModal(false)}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

