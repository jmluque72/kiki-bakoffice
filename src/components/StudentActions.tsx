import React, { useState, useEffect } from 'react';
import { apiClient } from '../config/api';

interface StudentAction {
  _id: string;
  nombre: string;
  descripcion?: string;
  division: string;
  color: string;
  orden: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Group {
  _id: string;
  nombre: string;
}

const StudentActions: React.FC = () => {
  const [actions, setActions] = useState<StudentAction[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingAction, setEditingAction] = useState<StudentAction | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    color: '#3B82F6',
    orden: 0
  });

  // Cargar grupos al montar el componente
  useEffect(() => {
    loadGroups();
  }, []);

  // Cargar acciones cuando se selecciona un grupo
  useEffect(() => {
    if (selectedGroup) {
      loadActions(selectedGroup);
    } else {
      setActions([]);
    }
  }, [selectedGroup]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/grupos?page=1&limit=100');
      console.log('Respuesta de grupos:', response.data);
      
      if (response.data.success) {
        // Verificar si data es un array o un objeto con paginación
        if (Array.isArray(response.data.data)) {
          setGroups(response.data.data);
        } else if (response.data.data && Array.isArray(response.data.data.grupos)) {
          // Si es un objeto con paginación, usar la propiedad grupos
          setGroups(response.data.data.grupos);
        } else if (response.data.data && Array.isArray(response.data.data.data)) {
          // Si es un objeto anidado, usar data.data
          setGroups(response.data.data.data);
        } else {
          console.error('Estructura de respuesta inesperada:', response.data);
          setError('Error en la estructura de datos de grupos');
          setGroups([]);
        }
      } else {
        setError('Error al cargar los grupos');
        setGroups([]);
      }
    } catch (error) {
      console.error('Error al cargar grupos:', error);
      setError('Error al cargar los grupos');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const loadActions = async (groupId: string) => {
    try {
      setLoading(true);
      // Usar endpoint normal de la API
      const response = await apiClient.get(`/api/student-actions/division/${groupId}`);
      if (response.data.success) {
        setActions(response.data.data);
      }
    } catch (error) {
      console.error('Error al cargar acciones:', error);
      setError('Error al cargar las acciones');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) {
      setError('Selecciona una división');
      return;
    }

    try {
      setLoading(true);
      const actionData = {
        ...formData,
        division: selectedGroup
      };

      if (editingAction) {
        // Actualizar acción existente
        const response = await apiClient.put(`/api/student-actions/${editingAction._id}`, actionData);
        if (response.data.success) {
          setActions(actions.map(action => 
            action._id === editingAction._id ? response.data.data : action
          ));
        }
      } else {
        // Crear nueva acción
        const response = await apiClient.post('/api/student-actions', actionData);
        if (response.data.success) {
          setActions([...actions, response.data.data]);
        }
      }

      setShowModal(false);
      setEditingAction(null);
      setFormData({ nombre: '', descripcion: '', color: '#3B82F6', orden: 0 });
    } catch (error) {
      console.error('Error al guardar acción:', error);
      setError('Error al guardar la acción');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (action: StudentAction) => {
    setEditingAction(action);
    setFormData({
      nombre: action.nombre,
      descripcion: action.descripcion || '',
      color: action.color,
      orden: action.orden
    });
    setShowModal(true);
  };

  const handleDelete = async (actionId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta acción?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.delete(`/api/student-actions/${actionId}`);
      if (response.data.success) {
        setActions(actions.filter(action => action._id !== actionId));
      }
    } catch (error) {
      console.error('Error al eliminar acción:', error);
      setError('Error al eliminar la acción');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (action: StudentAction) => {
    try {
      setLoading(true);
      const response = await apiClient.put(`/api/student-actions/${action._id}`, {
        activo: !action.activo
      });
      if (response.data.success) {
        setActions(actions.map(a => 
          a._id === action._id ? { ...a, activo: !a.activo } : a
        ));
      }
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      setError('Error al actualizar el estado');
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setEditingAction(null);
    setFormData({ nombre: '', descripcion: '', color: '#3B82F6', orden: 0 });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAction(null);
    setFormData({ nombre: '', descripcion: '', color: '#3B82F6', orden: 0 });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Acciones Diarias de Estudiantes
        </h1>
        <p className="text-gray-600">
          Configura las acciones que los profesores pueden registrar para los estudiantes por división.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Selector de División */}
      <div className="mb-6">
        <label htmlFor="group-select" className="block text-sm font-medium text-gray-700 mb-2">
          Seleccionar División
        </label>
        <select
          id="group-select"
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Selecciona una división</option>
          {Array.isArray(groups) && groups.map((group) => (
            <option key={group._id} value={group._id}>
              {group.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Botón para agregar acción */}
      {selectedGroup && (
        <div className="mb-6">
          <button
            onClick={openModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Agregar Acción
          </button>
        </div>
      )}

      {/* Lista de Acciones */}
      {selectedGroup && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Acciones de la División
            </h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Cargando...</p>
            </div>
          ) : actions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No hay acciones configuradas para esta división.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {actions.map((action) => (
                <div key={action._id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: action.color }}
                      ></div>
                      <div>
                        <h3 className="font-medium text-gray-900">{action.nombre}</h3>
                        {action.descripcion && (
                          <p className="text-sm text-gray-600">{action.descripcion}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          Orden: {action.orden}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        action.activo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {action.activo ? 'Activo' : 'Inactivo'}
                      </span>
                      <button
                        onClick={() => handleToggleStatus(action)}
                        className={`px-3 py-1 text-xs rounded ${
                          action.activo
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {action.activo ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        onClick={() => handleEdit(action)}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(action._id)}
                        className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
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
      )}

      {/* Modal para crear/editar acción */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingAction ? 'Editar Acción' : 'Nueva Acción'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>

              <div className="mb-4">
                <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    id="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="orden" className="block text-sm font-medium text-gray-700 mb-1">
                  Orden
                </label>
                <input
                  type="number"
                  id="orden"
                  value={formData.orden}
                  onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) || 0 })}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : editingAction ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentActions;
