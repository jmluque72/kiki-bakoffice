import React, { useState, useEffect, useRef } from 'react';
import { Upload, Users, Download, Trash2, Plus, Search, Filter, Eye, QrCode, Printer } from 'lucide-react';
import { apiClient } from '../../config/api';
import { Notification } from '../Notification';
import { ConfirmationDialog } from '../ConfirmationDialog';
import * as XLSX from 'xlsx';
import { getRoleDisplayName } from '../../utils/roleTranslations';
import QRCode from 'qrcode';
import { useReactToPrint } from 'react-to-print';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/print.css';

interface Student {
  _id: string;
  nombre: string;
  apellido: string;
  email: string;
  dni: string;
  year: number;
  qrCode?: string;
  account: {
    _id: string;
    nombre: string;
  };
  division: {
    _id: string;
    nombre: string;
  };
  tutor?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

interface StudentsSectionProps {
  selectedAccount?: any;
  selectedDivision?: any;
  isReadonly?: boolean;
}

export const StudentsSection: React.FC<StudentsSectionProps> = ({ 
  selectedAccount, 
  selectedDivision,
  isReadonly = false
}) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role?.nombre === 'superadmin';
  
  // Obtener la división seleccionada desde localStorage si no viene como prop
  const [currentAccount, setCurrentAccount] = useState(selectedAccount);
  const [currentDivision, setCurrentDivision] = useState(selectedDivision);

  useEffect(() => {
    if (!selectedAccount || !selectedDivision) {
      const storedAccount = localStorage.getItem('selectedAccountForStudents');
      const storedDivision = localStorage.getItem('selectedDivisionForStudents');
      
      if (storedAccount && storedDivision) {
        setCurrentAccount(JSON.parse(storedAccount));
        setCurrentDivision(JSON.parse(storedDivision));
      }
    } else {
      setCurrentAccount(selectedAccount);
      setCurrentDivision(selectedDivision);
    }
  }, [selectedAccount, selectedDivision]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadYear, setUploadYear] = useState(new Date().getFullYear());
  const [uploadResults, setUploadResults] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  
  // Estado para el popup de vinculaciones
  const [showAssociationsModal, setShowAssociationsModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentAssociations, setStudentAssociations] = useState<any[]>([]);
  const [loadingAssociations, setLoadingAssociations] = useState(false);
  
  // Estado para el modal de código QR
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedStudentQR, setSelectedStudentQR] = useState<Student | null>(null);
  const [qrCode, setQrCode] = useState<string>('');
  const [generatingQR, setGeneratingQR] = useState(false);
  const [qrCodeImage, setQrCodeImage] = useState<string>('');
  const [generatingQRImage, setGeneratingQRImage] = useState(false);
  
  // Referencia para la impresión
  const printRef = useRef<HTMLDivElement>(null);

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

  // Obtener cuenta del usuario si es adminaccount
  useEffect(() => {
    if (!isSuperAdmin && !currentAccount && user) {
      const loadUserAccount = async () => {
        try {
          const response = await apiClient.get(`/api/users/profile`);
          const userData = response.data;
          if (userData.associations && userData.associations.length > 0) {
            const account = userData.associations[0].account;
            setCurrentAccount(account);
          }
        } catch (error) {
          console.error('Error cargando cuenta del usuario:', error);
        }
      };
      loadUserAccount();
    }
  }, [isSuperAdmin, currentAccount, user]);

  // Cargar alumnos
  const loadStudents = async () => {
    // Para adminaccount, cargar todos de la institución
    // Para superadmin, requiere accountId
    if (!isSuperAdmin && !currentAccount?._id) return;
    if (isSuperAdmin && !currentAccount?._id) return;

    setLoading(true);
    try {
      const response = await apiClient.get('/api/students', {
        params: {
          accountId: currentAccount._id
          // No enviar divisionId para obtener todos
          // No enviar year para obtener todos los años
        }
      });

      if (response.data.success) {
        setStudents(response.data.data.students);
      }
    } catch (error) {
      console.error('Error cargando alumnos:', error);
      Notification.error('Error al cargar los alumnos');
    } finally {
      setLoading(false);
    }
  };

  // Eliminar alumno
  const deleteStudent = async (studentId: string) => {
    try {
      const response = await apiClient.delete(`/api/students/${studentId}`);
      
      if (response.data.success) {
        Notification.success('Alumno eliminado correctamente');
        loadStudents();
      }
    } catch (error) {
      console.error('Error eliminando alumno:', error);
      Notification.error('Error al eliminar el alumno');
    }
  };

  const handleDeleteClick = (student: Student) => {
    setStudentToDelete(student);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (studentToDelete) {
      deleteStudent(studentToDelete._id);
    }
  };

  // Generar códigos QR para todos los estudiantes
  const generateQRCodes = async () => {
    if (!currentAccount?._id || !currentDivision?._id) {
      Notification.error('Debe seleccionar una cuenta y división');
      return;
    }

    setGeneratingQR(true);
    try {
      const response = await apiClient.post('/api/students/generate-qr-codes', {
        accountId: currentAccount._id,
        divisionId: currentDivision._id
      });

      if (response.data.success) {
        const { generatedCount, totalProcessed } = response.data.data;
        Notification.success(`Se generaron ${generatedCount} códigos QR de ${totalProcessed} estudiantes procesados`);
        loadStudents(); // Recargar la lista
      }
    } catch (error) {
      console.error('Error generando códigos QR:', error);
      Notification.error('Error al generar códigos QR');
    } finally {
      setGeneratingQR(false);
    }
  };

  // Mostrar código QR de un estudiante
  const handleShowQR = async (student: Student) => {
    setSelectedStudentQR(student);
    setQrCode(student.qrCode || '');
    setShowQRModal(true);
    
    // Generar imagen del código QR si existe
    if (student.qrCode) {
      setGeneratingQRImage(true);
      try {
        const qrImage = await QRCode.toDataURL(student.qrCode, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeImage(qrImage);
      } catch (error) {
        console.error('Error generando imagen QR:', error);
        setQrCodeImage('');
      } finally {
        setGeneratingQRImage(false);
      }
    } else {
      setQrCodeImage('');
    }
  };

  // Función de impresión
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `QR_${selectedStudentQR?.nombre}_${selectedStudentQR?.apellido}`,
    onAfterPrint: () => {
      Notification.success('Código QR enviado a impresión');
    },
    onPrintError: (error) => {
      console.error('Error de impresión:', error);
      Notification.error('Error al imprimir el código QR');
    }
  });

  // Cargar vinculaciones de un estudiante
  const loadStudentAssociations = async (studentId: string) => {
    setLoadingAssociations(true);
    try {
      const response = await apiClient.get(`/api/shared/student/${studentId}`);
      
      if (response.data.success) {
        setStudentAssociations(response.data.data.associations);
      }
    } catch (error) {
      console.error('Error cargando vinculaciones:', error);
      Notification.error('Error al cargar las vinculaciones del estudiante');
      setStudentAssociations([]);
    } finally {
      setLoadingAssociations(false);
    }
  };

  // Abrir popup de vinculaciones
  const handleViewAssociations = (student: Student) => {
    setSelectedStudent(student);
    setShowAssociationsModal(true);
    loadStudentAssociations(student._id);
  };

  // Subir archivo Excel
  const handleFileUpload = async () => {
    // Superadmin no puede cargar alumnos
    if (isSuperAdmin) {
      Notification.error('Los superadministradores solo pueden crear instituciones. La carga de alumnos debe realizarse desde la institución.');
      return;
    }
    
    if (!uploadFile || !currentAccount?._id || !currentDivision?._id) {
      Notification.error('Por favor selecciona un archivo Excel');
      return;
    }

    setUploading(true);
    setUploadResults(null);
    const formData = new FormData();
    formData.append('excel', uploadFile);
    formData.append('accountId', currentAccount._id);
    formData.append('divisionId', currentDivision._id);
    formData.append('year', uploadYear.toString());

    try {
      const response = await apiClient.post('/api/students/upload-excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const result = response.data;
      const data = result.data || result;

      // Guardar resultados para mostrar
      setUploadResults(data);

      // Verificar si hay éxitos o errores
      const successCount = data.success || 0;
      const errorCount = data.errors?.length || 0;
      const totalCount = data.total || 0;

      if (successCount > 0) {
        // Hay éxitos, mostrar mensaje de éxito
        if (errorCount > 0) {
          Notification.warning(`${result.message || `Carga completada: ${successCount} alumnos cargados, ${errorCount} errores`}`);
        } else {
          Notification.success(result.message || `Carga completada: ${successCount} alumnos cargados exitosamente`);
          // Si todo salió bien, cerrar el modal y recargar
          setShowUploadModal(false);
          setUploadFile(null);
          setShowPreview(false);
          setPreviewData([]);
          loadStudents();
        }
      } else if (errorCount > 0) {
        // Solo hay errores
        Notification.error(result.message || `No se pudieron cargar alumnos. ${errorCount} errores encontrados`);
      } else {
        // No hay datos
        Notification.warning('No se encontraron datos para procesar');
      }
    } catch (error: any) {
      console.error('Error subiendo archivo:', error);
      
      // Intentar extraer datos de la respuesta aunque sea un error HTTP
      const errorResponse = error.response?.data;
      if (errorResponse?.data) {
        // El backend devolvió datos aunque sea status 400
        const data = errorResponse.data;
        setUploadResults(data);
        
        const successCount = data.success || 0;
        const errorCount = data.errors?.length || 0;
        
        if (successCount > 0) {
          Notification.warning(errorResponse.message || `Carga completada con advertencias: ${successCount} alumnos cargados, ${errorCount} errores`);
        } else {
          Notification.error(errorResponse.message || `No se pudieron cargar alumnos. ${errorCount} errores encontrados`);
        }
      } else {
        // Error real de red o servidor
        Notification.error(errorResponse?.message || 'Error al subir el archivo');
      }
    } finally {
      setUploading(false);
    }
  };

  // Generar preview del Excel
  const generatePreview = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Convertir a formato de objetos con headers
        if (jsonData.length > 1) {
          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1, 6); // Solo las primeras 5 filas para preview
          
          const previewRows = rows.map((row: any) => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] || '';
            });
            return obj;
          });
          
          setPreviewData(previewRows);
          setShowPreview(true);
        }
      } catch (error) {
        console.error('Error generando preview:', error);
        Notification.error('Error al leer el archivo Excel');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Descargar plantilla Excel
  const downloadTemplate = () => {
    const template = [
      {
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan.perez@email.com',
        dni: '12345678',
        dniTutor: '87654321',
        nombreTutor: 'Carlos Pérez',
        emailTutor: 'carlos.perez@email.com'
      },
      {
        nombre: 'Ana',
        apellido: 'López',
        email: 'ana.lopez@email.com',
        dni: '23456789',
        dniTutor: '23456789',
        nombreTutor: 'Roberto López',
        emailTutor: 'roberto.lopez@email.com'
      },
      {
        nombre: 'Carlos',
        apellido: 'Rodríguez',
        email: '', // Email opcional
        dni: '34567890',
        dniTutor: '34567890',
        nombreTutor: 'Miguel Rodríguez',
        emailTutor: 'miguel.rodriguez@email.com'
      },
      {
        nombre: 'Sofía',
        apellido: 'García',
        email: 'sofia.garcia@email.com',
        dni: '45678901',
        dniTutor: '45678901',
        nombreTutor: 'Alejandro García',
        emailTutor: 'alejandro.garcia@email.com'
      },
      {
        nombre: 'Lucas',
        apellido: 'Fernández',
        email: 'lucas.fernandez@email.com',
        dni: '56789012',
        dniTutor: '56789012',
        nombreTutor: 'Diego Fernández',
        emailTutor: 'diego.fernandez@email.com'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Alumnos');
    XLSX.writeFile(wb, 'plantilla_alumnos.xlsx');
  };

  // Filtrar alumnos
  const filteredStudents = students.filter(student => {
    const search = searchTerm?.toLowerCase() || '';
    const nombre = student.nombre?.toLowerCase() || '';
    const apellido = student.apellido?.toLowerCase() || '';
    const email = student.email?.toLowerCase() || '';
    const dni = student.dni || '';
    
    const matchesStudent = nombre.includes(search) ||
                          apellido.includes(search) ||
                          email.includes(search) ||
                          dni.includes(searchTerm || '');
    
    const matchesTutor = student.tutor && (
      (student.tutor.name?.toLowerCase() || '').includes(search) ||
      (student.tutor.email?.toLowerCase() || '').includes(search)
    );
    
    return matchesStudent || matchesTutor;
  });

  useEffect(() => {
    loadStudents();
  }, [currentAccount]);

  const handleExportStudents = () => {
    if (students.length === 0) {
      Notification.error('No hay alumnos para exportar');
      return;
    }

    try {
      // Aplicar filtros si existen
      let dataToExport = students;
      
      if (searchTerm) {
        const search = searchTerm?.toLowerCase() || '';
        dataToExport = students.filter(student => {
          const nombre = student.nombre?.toLowerCase() || '';
          const apellido = student.apellido?.toLowerCase() || '';
          const email = student.email?.toLowerCase() || '';
          const dni = student.dni?.toLowerCase() || '';
          const tutorName = student.tutor?.name?.toLowerCase() || '';
          const tutorEmail = student.tutor?.email?.toLowerCase() || '';
          
          return nombre.includes(search) || 
                 apellido.includes(search) || 
                 email.includes(search) || 
                 dni.includes(search);
        });
      }

      // Preparar datos para Excel
      const excelData = dataToExport.map(student => ({
        'Nombre': student.nombre || '',
        'Apellido': student.apellido || '',
        'DNI': student.dni || '',
        'División': student.division?.nombre || 'N/A',
        'Año': student.year || '',
        'Fecha de Registro': new Date(student.createdAt).toLocaleDateString('es-AR')
      }));

      // Crear workbook y worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Alumnos');

      // Ajustar ancho de columnas
      const colWidths = [
        { wch: 20 }, // Nombre
        { wch: 20 }, // Apellido
        { wch: 15 }, // DNI
        { wch: 20 }, // División
        { wch: 10 }, // Año
        { wch: 18 }  // Fecha de Registro
      ];
      ws['!cols'] = colWidths;

      // Generar nombre de archivo con fecha
      const fileName = `alumnos_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Descargar archivo
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Error al exportar alumnos:', error);
      Notification.error('Error al exportar alumnos a Excel');
    }
  };

  if (!currentAccount && !isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Cargando información...</h3>
        </div>
      </div>
    );
  }

  if (isSuperAdmin && !currentAccount) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Selecciona una institución</h3>
          <p className="mt-1 text-sm text-gray-500">
            Para ver y gestionar alumnos, primero selecciona una institución.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Alumnos</h2>
          <p className="text-gray-600">
            {currentAccount.nombre}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportStudents}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar a Excel
          </button>
          
          <button
            onClick={generateQRCodes}
            disabled={generatingQR}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <QrCode className="h-4 w-4 mr-2" />
            {generatingQR ? 'Generando...' : 'Generar QR'}
          </button>
          
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow rounded-lg p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buscar
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, email, DNI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Lista de alumnos */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Alumnos ({filteredStudents.length})
          </h3>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay alumnos</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza cargando un archivo Excel con la lista de alumnos.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Alumno
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DNI
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    División
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Año
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha de registro
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {student.nombre} {student.apellido}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.dni}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {student.division?.nombre || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.year}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(student.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleShowQR(student)}
                          className="text-green-600 hover:text-green-900"
                          title="Ver código QR"
                          disabled={!student.qrCode}
                        >
                          <QrCode className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleViewAssociations(student)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver vinculaciones"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(student)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar alumno"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para subir archivo */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[500px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Cargar alumnos desde Excel
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Archivo Excel
                  </label>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setUploadFile(file);
                    generatePreview(file);
                  }
                }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Año
                  </label>
                  <select
                    value={uploadYear}
                    onChange={(e) => setUploadYear(parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                {/* Preview del Excel */}
                {showPreview && previewData.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preview del archivo (primeras 5 filas)
                    </label>
                    <div className="border border-gray-300 rounded-md p-3 bg-gray-50 max-h-60 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-300">
                            {Object.keys(previewData[0]).map((header) => (
                              <th key={header} className="text-left p-1 font-medium text-gray-700">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.map((row, index) => (
                            <tr key={index} className="border-b border-gray-200">
                              {Object.values(row).map((value, cellIndex) => (
                                <td key={cellIndex} className="p-1 text-gray-600">
                                  {String(value || '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                                  <div className="text-sm text-gray-600">
                    <p className="font-medium mb-2">Formato requerido:</p>
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium text-gray-700">Campos del Alumno:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>nombre (obligatorio)</li>
                          <li>apellido (obligatorio)</li>
                          <li>dni (obligatorio, único)</li>
                          <li>email (opcional, único si se proporciona)</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Campos del Tutor (obligatorios):</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>dniTutor (obligatorio)</li>
                          <li>nombreTutor (obligatorio)</li>
                          <li>emailTutor (obligatorio)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    if (!uploading) {
                      setShowUploadModal(false);
                      setShowPreview(false);
                      setPreviewData([]);
                      setUploadFile(null);
                      setUploadResults(null);
                    }
                  }}
                  disabled={uploading}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleFileUpload}
                  disabled={!uploadFile || uploading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Subiendo...' : 'Subir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de resultados */}
      {uploadResults && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Resultados de la carga
              </h3>
              
              <div className="space-y-4">
                {uploadResults.success > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <p className="text-sm text-green-800">
                      <strong>{uploadResults.success}</strong> de <strong>{uploadResults.total || uploadResults.success}</strong> alumnos cargados exitosamente
                    </p>
                  </div>
                )}
                
                {uploadResults.errors && uploadResults.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-sm text-red-800 mb-2 font-medium">
                      <strong>{uploadResults.errors.length}</strong> error(es) encontrado(s):
                    </p>
                    <div className="max-h-60 overflow-y-auto space-y-1">
                      {uploadResults.errors.map((error: any, index: number) => (
                        <p key={index} className="text-xs text-red-700 bg-red-100 p-2 rounded">
                          <span className="font-medium">Fila {error.row}:</span> {error.error}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                
                {uploadResults.success === 0 && (!uploadResults.errors || uploadResults.errors.length === 0) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <p className="text-sm text-yellow-800">
                      No se procesaron filas. Verifica que el archivo tenga el formato correcto.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setUploadResults(null);
                    if (uploadResults.success > 0 && (!uploadResults.errors || uploadResults.errors.length === 0)) {
                      // Si todo salió bien, cerrar también el modal de upload
                      setShowUploadModal(false);
                      setUploadFile(null);
                      setShowPreview(false);
                      setPreviewData([]);
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

       {/* Confirmation Dialog */}
       <ConfirmationDialog
         isOpen={showDeleteDialog}
         onClose={() => setShowDeleteDialog(false)}
         onConfirm={handleConfirmDelete}
         title="Eliminar alumno"
         message={`¿Estás seguro de que quieres eliminar a ${studentToDelete?.nombre} ${studentToDelete?.apellido}? Esta acción no se puede deshacer.`}
         type="danger"
         confirmText="Eliminar"
         cancelText="Cancelar"
       />

       {/* Modal de Vinculaciones */}
       {showAssociationsModal && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
           <div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
             <div className="mt-3">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="text-lg font-medium text-gray-900">
                   Vinculaciones de {selectedStudent?.nombre} {selectedStudent?.apellido}
                 </h3>
                 <button
                   onClick={() => setShowAssociationsModal(false)}
                   className="text-gray-400 hover:text-gray-600"
                 >
                   <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
               </div>
               
               {loadingAssociations ? (
                 <div className="flex items-center justify-center h-32">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                 </div>
               ) : studentAssociations.length === 0 ? (
                 <div className="text-center py-8">
                   <Users className="mx-auto h-12 w-12 text-gray-400" />
                   <h3 className="mt-2 text-sm font-medium text-gray-900">No hay vinculaciones</h3>
                   <p className="mt-1 text-sm text-gray-500">
                     Este estudiante no tiene usuarios vinculados.
                   </p>
                 </div>
               ) : (
                 <div className="space-y-4">
                   <div className="bg-gray-50 rounded-lg p-4">
                     <h4 className="text-sm font-medium text-gray-700 mb-3">Usuarios vinculados:</h4>
                     <div className="space-y-3">
                       {studentAssociations.map((association, index) => (
                         <div key={association._id} className="bg-white rounded-lg p-4 border border-gray-200">
                           <div className="flex items-center justify-between">
                             <div className="flex-1">
                               <div className="flex items-center space-x-3">
                                 <div className="flex-shrink-0">
                                   <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                     <span className="text-sm font-medium text-indigo-600">
                                       {association.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                     </span>
                                   </div>
                                 </div>
                                 <div className="flex-1">
                                   <div className="text-sm font-medium text-gray-900">
                                     {association.user?.name || 'Usuario sin nombre'}
                                   </div>
                                   <div className="text-sm text-gray-500">
                                     {association.user?.email || 'Sin email'}
                                   </div>
                                 </div>
                               </div>
                             </div>
                             <div className="flex items-center space-x-2">
                               <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                 association.role?.nombre === 'familyadmin' ? 'bg-green-100 text-green-800' :
                                 association.role?.nombre === 'familyviewer' ? 'bg-blue-100 text-blue-800' :
                                 association.role?.nombre === 'coordinador' ? 'bg-purple-100 text-purple-800' :
                                 'bg-gray-100 text-gray-800'
                               }`}>
                                 {getRoleDisplayName(association.role?.nombre || '')}
                               </span>
                               <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                 association.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                               }`}>
                                 {association.status === 'active' ? 'Activo' : 'Inactivo'}
                               </span>
                             </div>
                           </div>
                           <div className="mt-3 pt-3 border-t border-gray-200">
                             <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                               <div>
                                 <span className="font-medium">Institución:</span> {association.account?.nombre}
                               </div>
                               <div>
                                 <span className="font-medium">División:</span> {association.division?.nombre || 'Sin división'}
                               </div>
                               <div>
                                 <span className="font-medium">Fecha de vinculación:</span> {new Date(association.createdAt).toLocaleDateString()}
                               </div>
                               <div>
                                 <span className="font-medium">Vinculado por:</span> {association.createdBy?.name || 'Sistema'}
                               </div>
                             </div>
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 </div>
               )}
               
               <div className="flex justify-end mt-6">
                 <button
                   onClick={() => setShowAssociationsModal(false)}
                   className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700"
                 >
                   Cerrar
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Modal de Código QR */}
       {showQRModal && selectedStudentQR && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
           <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
             <div className="mt-3">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="text-lg font-medium text-gray-900">
                   Código QR - {selectedStudentQR.nombre} {selectedStudentQR.apellido}
                 </h3>
                 <button
                   onClick={() => setShowQRModal(false)}
                   className="text-gray-400 hover:text-gray-600"
                 >
                   <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
               </div>
               
               {qrCode ? (
                 <div className="text-center">
                   <div className="mb-4">
                     <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                       {generatingQRImage ? (
                         <div className="w-48 h-48 bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                           <div className="text-center">
                             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                             <p className="text-sm text-gray-500">Generando QR...</p>
                           </div>
                         </div>
                       ) : qrCodeImage ? (
                         <img 
                           src={qrCodeImage} 
                           alt="Código QR" 
                           className="w-48 h-48 mx-auto"
                         />
                       ) : (
                         <div className="w-48 h-48 bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                           <div className="text-center">
                             <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                             <p className="text-sm text-gray-500">Error generando QR</p>
                           </div>
                         </div>
                       )}
                     </div>
                   </div>
                   
                   <div className="bg-gray-50 rounded-lg p-4 mb-4">
                     <p className="text-sm text-gray-600 mb-2">
                       <strong>Estudiante:</strong> {selectedStudentQR.nombre} {selectedStudentQR.apellido}
                     </p>
                     <p className="text-sm text-gray-600 mb-2">
                       <strong>DNI:</strong> {selectedStudentQR.dni}
                     </p>
                     <p className="text-sm text-gray-600">
                       <strong>División:</strong> {selectedStudentQR.division?.nombre}
                     </p>
                   </div>
                   
                   <div className="flex space-x-2">
                     <button
                       onClick={() => {
                         navigator.clipboard.writeText(qrCode);
                         Notification.success('Código copiado al portapapeles');
                       }}
                       className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                     >
                       Copiar
                     </button>
                     <button
                       onClick={handlePrint}
                       disabled={!qrCodeImage}
                       className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                     >
                       <Printer className="h-4 w-4 mr-1" />
                       Imprimir
                     </button>
                     <button
                       onClick={() => setShowQRModal(false)}
                       className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700"
                     >
                       Cerrar
                     </button>
                   </div>
                 </div>
               ) : (
                 <div className="text-center py-8">
                   <QrCode className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                   <h3 className="text-sm font-medium text-gray-900 mb-2">Sin código QR</h3>
                   <p className="text-sm text-gray-500 mb-4">
                     Este estudiante no tiene un código QR generado.
                   </p>
                   <button
                     onClick={() => setShowQRModal(false)}
                     className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700"
                   >
                     Cerrar
                   </button>
                 </div>
               )}
             </div>
           </div>
         </div>
       )}

       {/* Componente para impresión (oculto) */}
       <div style={{ display: 'none' }}>
         <div ref={printRef} className="print-content">
           {selectedStudentQR && qrCodeImage && (
             <div className="p-8 text-center">
               <div className="mb-6">
                 <h1 className="text-2xl font-bold text-gray-900 mb-2">
                   Código QR de Asistencia
                 </h1>
                 <h2 className="text-xl text-gray-700">
                   {selectedStudentQR.nombre} {selectedStudentQR.apellido}
                 </h2>
               </div>
               
               <div className="mb-6">
                 <img 
                   src={qrCodeImage} 
                   alt="Código QR" 
                   className="w-64 h-64 mx-auto border-2 border-gray-300"
                 />
               </div>
               
               <div className="text-sm text-gray-600 space-y-1">
                 <p><strong>DNI:</strong> {selectedStudentQR.dni}</p>
                 <p><strong>División:</strong> {selectedStudentQR.division?.nombre}</p>
                 <p><strong>Institución:</strong> {selectedStudentQR.account?.nombre}</p>
                 <p><strong>Código:</strong> {qrCode}</p>
               </div>
               
               <div className="mt-8 text-xs text-gray-500">
                 <p>Imprima este código QR y péguelo en el cuaderno del estudiante</p>
                 <p>Para marcar asistencia, escanee este código con la app móvil</p>
               </div>
             </div>
           )}
         </div>
       </div>
     </div>
   );
 }; 