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
  ChevronRight
} from 'lucide-react';
import { useBackofficeAsistencias, AsistenciaFilters } from '../../hooks/useBackofficeAsistencias';
import { useAuth } from '../../hooks/useAuth';
import { Notification } from '../Notification';

export const AsistenciasSection: React.FC = () => {
  const { user } = useAuth();
  const {
    asistencias,
    pagination,
    loading,
    error,
    currentPage,
    itemsPerPage,
    loadAsistencias,
    createAsistencia,
    updateAsistencia,
    deleteAsistencia,
    handlePageChange,
    handleNextPage,
    handlePrevPage,
    exportAsistencias,
    getStats,
    clearError
  } = useBackofficeAsistencias();

  const [filters, setFilters] = useState<AsistenciaFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAsistencia, setSelectedAsistencia] = useState<any>(null);

  const handleFilterChange = (key: keyof AsistenciaFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    loadAsistencias(1, { ...filters, search: searchTerm });
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchTerm('');
    loadAsistencias(1);
  };

  const handleSearch = () => {
    loadAsistencias(1, { ...filters, search: searchTerm });
  };

  const handleCreateAsistencia = async (asistenciaData: any) => {
    const result = await createAsistencia(asistenciaData);
    setNotificationType(result.success ? 'success' : 'error');
    setNotificationMessage(result.message);
    setShowNotification(true);
    if (result.success) {
      setShowCreateModal(false);
    }
  };

  const handleUpdateAsistencia = async (asistenciaId: string, updateData: any) => {
    const result = await updateAsistencia(asistenciaId, updateData);
    setNotificationType(result.success ? 'success' : 'error');
    setNotificationMessage(result.message);
    setShowNotification(true);
    if (result.success) {
      setShowEditModal(false);
      setSelectedAsistencia(null);
    }
  };

  const handleDeleteAsistencia = async (asistenciaId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta asistencia?')) {
      const result = await deleteAsistencia(asistenciaId);
      setNotificationType(result.success ? 'success' : 'error');
      setNotificationMessage(result.message);
      setShowNotification(true);
    }
  };

  const handleExport = async () => {
    const result = await exportAsistencias({ ...filters, search: searchTerm });
    setNotificationType(result.success ? 'success' : 'error');
    setNotificationMessage(result.message);
    setShowNotification(true);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'presente':
        return 'bg-green-100 text-green-800';
      case 'ausente':
        return 'bg-red-100 text-red-800';
      case 'justificado':
        return 'bg-yellow-100 text-yellow-800';
      case 'tardanza':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    // El campo fecha es String en formato YYYY-MM-DD
    if (dateString && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    // Si no es un formato válido, mostrar la original
    return dateString || 'Fecha inválida';
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '-';
    return new Date(timeString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Limpiar error cuando se cierre la notificación
  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => {
        setShowNotification(false);
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showNotification, clearError]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
            <p className="text-gray-600">Gestiona las asistencias de los alumnos</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Nueva Asistencia</span>
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cuenta
            </label>
            <select
              value={filters.accountId || ''}
              onChange={(e) => handleFilterChange('accountId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las cuentas</option>
              {/* Aquí se cargarían las cuentas disponibles */}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grupo
            </label>
            <select
              value={filters.grupoId || ''}
              onChange={(e) => handleFilterChange('grupoId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los grupos</option>
              {/* Aquí se cargarían los grupos disponibles */}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={filters.fechaInicio || ''}
              onChange={(e) => handleFilterChange('fechaInicio', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Fin
            </label>
            <input
              type="date"
              value={filters.fechaFin || ''}
              onChange={(e) => handleFilterChange('fechaFin', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <div className="flex space-x-3">
            <button
              onClick={handleApplyFilters}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Filter className="h-4 w-4" />
              <span>Aplicar Filtros</span>
            </button>
            <button
              onClick={handleClearFilters}
              className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <span>Limpiar</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar asistencias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Buscar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Asistencias */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Asistencias ({pagination?.totalItems || 0} registros)
          </h3>
        </div>
        
        {error && (
          <div className="px-6 py-4 bg-red-50 border-b border-red-200">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alumno
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grupo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Horarios
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registrado Por
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {asistencias.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-lg font-medium">No se encontraron asistencias</p>
                    <p className="text-sm">Intenta ajustar los filtros o agregar nuevas asistencias</p>
                  </td>
                </tr>
              ) : (
                asistencias.flatMap((asistencia) =>
                  asistencia.estudiantes.map((estudiante, index) => (
                    <tr key={`${asistencia._id}-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {estudiante.student ? `${estudiante.student.nombre} ${estudiante.student.apellido}` : 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {estudiante.student?.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {asistencia.division?.nombre || 'Sin grupo'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {asistencia.account?.nombre}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(asistencia.fecha)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(estudiante.presente ? 'presente' : 'ausente')}`}>
                          {estudiante.presente ? 'presente' : 'ausente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div>N/A</div>
                          <div>N/A</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {asistencia.creadoPor?.nombre}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedAsistencia({ asistencia, estudiante, index });
                              setShowEditModal(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAsistencia(asistencia._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
        
        {/* Paginación */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, pagination.totalItems)} de {pagination.totalItems} resultados
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrevPage(filters)}
                  disabled={!pagination.hasPrevPage}
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum, filters)}
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handleNextPage(filters)}
                  disabled={!pagination.hasNextPage}
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Página siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notificación */}
      <Notification
        type={notificationType}
        message={notificationMessage}
        isVisible={showNotification}
        onClose={() => setShowNotification(false)}
      />
    </div>
  );
}; 