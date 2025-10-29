import React, { useState, useEffect } from 'react';
import { apiClient } from '../config/api';

interface StudentActionLog {
  _id: string;
  estudiante: {
    _id: string;
    nombre: string;
    apellido: string;
    avatar?: string;
  };
  accion: {
    _id: string;
    nombre: string;
    descripcion?: string;
    color: string;
    categoria: string;
    icono?: string;
  };
  registradoPor: {
    _id: string;
    name: string;
    email: string;
  };
  division: {
    _id: string;
    nombre: string;
    descripcion?: string;
  };
  fechaAccion: string;
  comentarios?: string;
  imagenes: string[];
  estado: 'registrado' | 'confirmado' | 'rechazado';
  createdAt: string;
  updatedAt: string;
}

interface Division {
  _id: string;
  nombre: string;
  descripcion?: string;
}

const StudentActionLogs: React.FC = () => {
  const [actionLogs, setActionLogs] = useState<StudentActionLog[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingLog, setEditingLog] = useState<StudentActionLog | null>(null);
  const [formData, setFormData] = useState({
    estudiante: '',
    accion: '',
    comentarios: '',
    fechaAccion: new Date().toISOString().slice(0, 16),
  });

  useEffect(() => {
    loadDivisions();
  }, []);

  useEffect(() => {
    if (selectedDivision) {
      loadActionLogs();
    }
  }, [selectedDivision, selectedDate]);

  const loadDivisions = async () => {
    try {
      const response = await apiClient.get('/api/grupos?page=1&limit=100');
      setDivisions(response.data.data.grupos || []);
    } catch (error) {
      console.error('Error cargando divisiones:', error);
      setError('Error cargando divisiones');
    }
  };

  const loadActionLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        fecha: selectedDate,
      });
      
      const response = await apiClient.get(`/api/student-actions/log/division/${selectedDivision}?${params}`);
      setActionLogs(response.data.data || []);
    } catch (error: any) {
      console.error('Error cargando acciones:', error);
      setError(error.response?.data?.message || 'Error cargando acciones');
    } finally {
      setLoading(false);
    }
  };

  const handleEditLog = (log: StudentActionLog) => {
    setEditingLog(log);
    setFormData({
      estudiante: log.estudiante._id,
      accion: log.accion._id,
      comentarios: log.comentarios || '',
      fechaAccion: new Date(log.fechaAccion).toISOString().slice(0, 16),
    });
    setShowModal(true);
  };

  const handleSaveLog = async () => {
    try {
      setLoading(true);
      
      if (editingLog) {
        // Actualizar acción existente
        const response = await apiClient.put(`/api/student-actions/log/${editingLog._id}`, {
          comentarios: formData.comentarios,
          fechaAccion: new Date(formData.fechaAccion).toISOString(),
        });
        
        if (response.data.success) {
          setActionLogs(prev => 
            prev.map(log => 
              log._id === editingLog._id ? response.data.data : log
            )
          );
        }
      }
      
      setShowModal(false);
      setEditingLog(null);
      setFormData({
        estudiante: '',
        accion: '',
        comentarios: '',
        fechaAccion: new Date().toISOString().slice(0, 16),
      });
    } catch (error: any) {
      console.error('Error guardando acción:', error);
      setError(error.response?.data?.message || 'Error guardando acción');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta acción?')) {
      return;
    }

    try {
      setLoading(true);
      
      const response = await apiClient.delete(`/api/student-actions/log/${logId}`);
      
      if (response.data.success) {
        setActionLogs(prev => prev.filter(log => log._id !== logId));
      }
    } catch (error: any) {
      console.error('Error eliminando acción:', error);
      setError(error.response?.data?.message || 'Error eliminando acción');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'confirmado':
        return '#4CAF50';
      case 'rechazado':
        return '#F44336';
      default:
        return '#FF9800';
    }
  };

  const getStatusText = (estado: string) => {
    switch (estado) {
      case 'confirmado':
        return 'Confirmado';
      case 'rechazado':
        return 'Rechazado';
      default:
        return 'Registrado';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Acciones de Estudiantes</h1>
        <p className="text-gray-600">Gestiona las acciones registradas por los coordinadores</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              División
            </label>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar división</option>
              {divisions.map((division) => (
                <option key={division._id} value={division._id}>
                  {division.nombre}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={loadActionLogs}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Buscar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de acciones */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Acciones Registradas ({actionLogs.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="px-6 py-4 text-red-600">
            {error}
          </div>
        ) : actionLogs.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No hay acciones registradas para los filtros seleccionados
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {actionLogs.map((log) => (
              <div key={log._id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: log.accion.color }}
                      ></div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {log.accion.nombre}
                      </h3>
                      <span
                        className="px-2 py-1 text-xs font-medium rounded-full"
                        style={{
                          backgroundColor: getStatusColor(log.estado) + '20',
                          color: getStatusColor(log.estado),
                        }}
                      >
                        {getStatusText(log.estado)}
                      </span>
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-600">
                      <p><strong>Estudiante:</strong> {log.estudiante.nombre} {log.estudiante.apellido}</p>
                      <p><strong>División:</strong> {log.division.nombre}</p>
                      <p><strong>Registrado por:</strong> {log.registradoPor.name}</p>
                      <p><strong>Fecha:</strong> {formatDate(log.fechaAccion)}</p>
                      {log.comentarios && (
                        <p><strong>Comentarios:</strong> {log.comentarios}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditLog(log)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteLog(log._id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingLog ? 'Editar Acción' : 'Nueva Acción'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comentarios
                </label>
                <textarea
                  value={formData.comentarios}
                  onChange={(e) => setFormData({ ...formData, comentarios: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha y Hora
                </label>
                <input
                  type="datetime-local"
                  value={formData.fechaAccion}
                  onChange={(e) => setFormData({ ...formData, fechaAccion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveLog}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentActionLogs;
