import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useStudentActions } from '../hooks/useStudentActions';
import { useDivisions } from '../hooks/useDivisions';
import { Trash2, Edit, Eye, EyeOff, Plus, RefreshCw, Building2 } from 'lucide-react';

interface StudentAction {
  _id: string;
  nombre: string;
  descripcion?: string;
  division: string;
  categoria: string;
  color: string;
  orden: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StudentActionForm {
  nombre: string;
  descripcion: string;
  division: string;
  categoria: string;
  color: string;
  orden: number;
  activo: boolean;
}

const StudentActionsManagement: React.FC = () => {
  const [selectedDivisionForManagement, setSelectedDivisionForManagement] = useState<string>('');
  
  const { 
    actions, 
    loading, 
    createAction, 
    updateAction, 
    deleteAction, 
    toggleActionStatus,
    loadActions 
  } = useStudentActions(selectedDivisionForManagement);
  
  const { divisions, loadDivisions } = useDivisions();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingAction, setEditingAction] = useState<StudentAction | null>(null);
  const [actionToDelete, setActionToDelete] = useState<StudentAction | null>(null);
  
  // Filtros
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // Formulario
  const [formData, setFormData] = useState<StudentActionForm>({
    nombre: '',
    descripcion: '',
    division: '',
    categoria: '',
    color: '#0E5FCE',
    orden: 0,
    activo: true
  });

  // Validación
  const [errors, setErrors] = useState<Partial<Record<keyof StudentActionForm, string>>>({});

  useEffect(() => {
    loadDivisions();
  }, []);

  useEffect(() => {
    if (selectedDivisionForManagement) {
      loadActions();
    } else {
      // Limpiar acciones si no hay división seleccionada
      // No podemos modificar directamente, pero el hook manejará esto
    }
  }, [selectedDivisionForManagement]);

  const filteredActions = actions.filter(action => {
    const divisionMatch = !selectedDivision || selectedDivision === 'all' || action.division === selectedDivision;
    const categoryMatch = !selectedCategory || selectedCategory === 'all' || action.categoria === selectedCategory;
    const statusMatch = !selectedStatus || selectedStatus === 'all' ||
      (selectedStatus === 'activo' && action.activo) ||
      (selectedStatus === 'inactivo' && !action.activo);
    
    return divisionMatch && categoryMatch && statusMatch;
  });

  const getDivisionName = (divisionId: string) => {
    const division = divisions.find(d => d._id === divisionId);
    return division ? division.nombre : 'División no encontrada';
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      alimentacion: 'Alimentación',
      higiene: 'Higiene',
      descanso: 'Descanso',
      juego: 'Juego',
      otro: 'Otro'
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      alimentacion: 'bg-blue-100 text-blue-800',
      higiene: 'bg-purple-100 text-purple-800',
      descanso: 'bg-green-100 text-green-800',
      juego: 'bg-orange-100 text-orange-800',
      otro: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const handleCreate = () => {
    if (!selectedDivisionForManagement) {
      return;
    }
    setFormData({
      nombre: '',
      descripcion: '',
      division: selectedDivisionForManagement, // Pre-llenar con la división seleccionada
      categoria: 'otro', // Valor por defecto, no se muestra en el formulario
      color: '#0E5FCE',
      orden: 0,
      activo: true
    });
    setErrors({});
    setShowCreateModal(true);
  };

  const handleEdit = (action: StudentAction) => {
    setFormData({
      nombre: action.nombre,
      descripcion: action.descripcion || '',
      division: action.division,
      categoria: action.categoria,
      color: action.color,
      orden: action.orden,
      activo: action.activo
    });
    setErrors({});
    setEditingAction(action);
    setShowEditModal(true);
  };

  const handleDelete = (action: StudentAction) => {
    setActionToDelete(action);
    setShowDeleteModal(true);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof StudentActionForm, string>> = {};
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }
    
    if (!formData.division) {
      newErrors.division = 'La división es obligatoria';
    }
    
    if (!formData.color || !formData.color.match(/^#[0-9A-Fa-f]{6}$/)) {
      newErrors.color = 'El color debe ser un código hexadecimal válido (ej: #0E5FCE)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      if (editingAction) {
        await updateAction(editingAction._id, formData);
      } else {
        await createAction(formData);
      }
      setShowCreateModal(false);
      setShowEditModal(false);
      setEditingAction(null);
      setErrors({});
    } catch (error) {
      console.error('Error saving action:', error);
    }
  };

  const handleConfirmDelete = async () => {
    if (actionToDelete) {
      try {
        await deleteAction(actionToDelete._id);
        setShowDeleteModal(false);
        setActionToDelete(null);
      } catch (error) {
        console.error('Error deleting action:', error);
      }
    }
  };

  const handleToggleStatus = async (action: StudentAction) => {
    try {
      await toggleActionStatus(action._id, !action.activo);
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-600">Gestión de Acciones de Estudiantes</h1>
        <div className="flex gap-2">
          <Button 
            onClick={handleCreate} 
            className="bg-blue-600 hover:bg-blue-700"
            disabled={!selectedDivisionForManagement}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Acción
          </Button>
          {selectedDivisionForManagement && (
            <Button onClick={loadActions} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          )}
        </div>
      </div>

      {/* Selector de División */}
      <Card className="p-4 mb-6">
        <Label htmlFor="division-select-management" className="block text-sm font-medium text-gray-700 mb-2">
          Seleccionar División *
        </Label>
        <Select 
          value={selectedDivisionForManagement} 
          onValueChange={(value) => {
            setSelectedDivisionForManagement(value);
            setSelectedDivision('all');
            setSelectedCategory('all');
            setSelectedStatus('all');
          }}
        >
          <SelectTrigger id="division-select-management" className="w-full max-w-md">
            <SelectValue placeholder="Selecciona una división para gestionar sus acciones" />
          </SelectTrigger>
          <SelectContent>
            {divisions.map(division => (
              <SelectItem key={division._id} value={division._id}>
                {division.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedDivisionForManagement && (
          <p className="mt-2 text-sm text-gray-600">
            División seleccionada: {divisions.find(d => d._id === selectedDivisionForManagement)?.nombre}
          </p>
        )}
      </Card>

      {/* Mensaje si no hay división seleccionada */}
      {!selectedDivisionForManagement && (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center">
            <Building2 className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">Selecciona una división para gestionar sus acciones</p>
          </div>
        </Card>
      )}

      {/* Filtros - Solo visible si hay división seleccionada */}
      {selectedDivisionForManagement && (
        <Card className="p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="division-filter">División</Label>
            <Select value={selectedDivision} onValueChange={setSelectedDivision}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las divisiones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las divisiones</SelectItem>
                {divisions.map(division => (
                  <SelectItem key={division._id} value={division._id}>
                    {division.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="category-filter">Categoría</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="alimentacion">Alimentación</SelectItem>
                <SelectItem value="higiene">Higiene</SelectItem>
                <SelectItem value="descanso">Descanso</SelectItem>
                <SelectItem value="juego">Juego</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="status-filter">Estado</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>
      )}

      {/* Tabla de acciones - Solo visible si hay división seleccionada */}
      {selectedDivisionForManagement && (
        <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  División
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Color
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orden
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredActions.map((action) => (
                <tr key={action._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {action.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {action.descripcion || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getDivisionName(action.division)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getCategoryColor(action.categoria)}>
                      {getCategoryLabel(action.categoria)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: action.color }}
                      />
                      <span className="text-sm text-gray-500 font-mono">
                        {action.color}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {action.orden}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={action.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {action.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(action)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleStatus(action)}
                      >
                        {action.activo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(action)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      )}

      {selectedDivisionForManagement && actions.length === 0 && !loading && (
        <Card className="p-12 text-center">
          <p className="text-gray-600">No hay acciones configuradas para esta división</p>
          <p className="text-sm text-gray-500 mt-2">Crea una nueva acción usando el botón "Nueva Acción"</p>
        </Card>
      )}

      {/* Modal para crear/editar */}
      <Dialog open={showCreateModal || showEditModal} onOpenChange={(open) => {
        if (!open) {
          setShowCreateModal(false);
          setShowEditModal(false);
          setEditingAction(null);
          setErrors({});
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>
              {editingAction ? 'Editar Acción' : 'Nueva Acción'}
            </DialogTitle>
            <DialogDescription>
              {editingAction 
                ? 'Modifica los datos de la acción de estudiante.' 
                : 'Completa el formulario para crear una nueva acción de estudiante.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => {
                  setFormData({ ...formData, nombre: e.target.value });
                  if (errors.nombre) {
                    setErrors({ ...errors, nombre: undefined });
                  }
                }}
                placeholder="Nombre de la acción"
                className={errors.nombre ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.nombre && (
                <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="division">División *</Label>
              <Select 
                value={formData.division} 
                onValueChange={(value) => {
                  setFormData({ ...formData, division: value });
                  if (errors.division) {
                    setErrors({ ...errors, division: undefined });
                  }
                }}
                disabled={!!selectedDivisionForManagement} // Deshabilitar si ya está preseleccionada
              >
                <SelectTrigger className={errors.division ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Seleccionar división" />
                </SelectTrigger>
                <SelectContent>
                  {divisions.map(division => (
                    <SelectItem key={division._id} value={division._id}>
                      {division.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedDivisionForManagement && (
                <p className="text-xs text-gray-500 mt-1">
                  La acción se creará para la división seleccionada
                </p>
              )}
              {errors.division && (
                <p className="text-xs text-red-500 mt-1">{errors.division}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="color">Color *</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => {
                      setFormData({ ...formData, color: e.target.value });
                      if (errors.color) {
                        setErrors({ ...errors, color: undefined });
                      }
                    }}
                    className="w-12 h-10 border border-gray-300 rounded"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => {
                      setFormData({ ...formData, color: e.target.value });
                      if (errors.color) {
                        setErrors({ ...errors, color: undefined });
                      }
                    }}
                    placeholder="#0E5FCE"
                    className={`flex-1 ${errors.color ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  />
                </div>
                {errors.color && (
                  <p className="text-xs text-red-500 mt-1">{errors.color}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="orden">Orden</Label>
                <Input
                  id="orden"
                  type="number"
                  value={formData.orden}
                  onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="activo"
                checked={formData.activo}
                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="activo">Activo</Label>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setEditingAction(null);
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? 'Guardando...' : (editingAction ? 'Actualizar' : 'Crear')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación para eliminar */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p>
              ¿Estás seguro de que quieres eliminar la acción{' '}
              <strong>{actionToDelete?.nombre}</strong>?
            </p>
            <p className="text-red-600 font-medium mt-2">
              Esta acción no se puede deshacer.
            </p>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={loading}
            >
              {loading ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentActionsManagement;
