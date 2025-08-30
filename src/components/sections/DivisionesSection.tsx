import React, { useState } from 'react';
import { Search, Filter, Plus, MoreVertical, Building2, Users, DollarSign, TrendingUp, Edit, Trash2, X, Upload } from 'lucide-react';
import { Division } from '../../types';
import { useAuth } from '../../hooks/useAuth';

interface DivisionFormData {
  name: string;
  description: string;
  status: 'active' | 'inactive';
}

export const DivisionesSection: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'delete' | 'upload'>('add');
  const [selectedDivision, setSelectedDivision] = useState<Division | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState<DivisionFormData>({
    name: '',
    description: '',
    status: 'active'
  });

  const [divisions, setDivisions] = useState<Division[]>([
    {
      id: '1',
      name: 'Tecnología e Innovación',
      description: 'Desarrollo de productos y soluciones tecnológicas',
      status: 'active',
      createdAt: '2023-01-15'
    },
    {
      id: '2',
      name: 'Marketing Digital',
      description: 'Estrategias de marketing online y comunicación',
      status: 'active',
      createdAt: '2023-02-20'
    },
    {
      id: '3',
      name: 'Recursos Humanos',
      description: 'Gestión del talento y desarrollo organizacional',
      status: 'active',
      createdAt: '2023-01-10'
    },
    {
      id: '4',
      name: 'Finanzas y Contabilidad',
      description: 'Gestión financiera y control presupuestario',
      status: 'active',
      createdAt: '2023-01-05'
    },
    {
      id: '5',
      name: 'Operaciones Legacy',
      description: 'Mantenimiento de sistemas heredados',
      status: 'inactive',
      createdAt: '2022-06-15'
    },
    {
      id: '6',
      name: 'Inteligencia Artificial',
      description: 'Investigación y desarrollo en IA y ML',
      status: 'active',
      createdAt: '2023-09-01'
    }
  ]);

  const getStatusColor = (status: Division['status']) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const filteredDivisions = divisions.filter(division => {
    const matchesSearch = division.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         division.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || division.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalDivisions = divisions.length;
  const activeDivisions = divisions.filter(div => div.status === 'active').length;
  const inactiveDivisions = divisions.filter(div => div.status === 'inactive').length;

  // Verificar permisos para acciones
  const canEditDivisions = user?.role?.nombre === 'superadmin' || user?.role?.nombre === 'adminaccount';
  const canDeleteDivisions = user?.role?.nombre === 'superadmin';

  const openModal = (mode: 'add' | 'edit' | 'delete', division?: Division) => {
    setModalMode(mode);
    setSelectedDivision(division || null);
    
    if (mode === 'add') {
      setFormData({
        name: '',
        description: '',
        status: 'active'
      });
    } else if (mode === 'edit' && division) {
      setFormData({
        name: division.name,
        description: division.description,
        status: division.status
      });
    }
    
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedDivision(null);
    setFormData({
      name: '',
      description: '',
      status: 'active'
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (modalMode === 'add') {
      const newDivision: Division = {
        id: (divisions.length + 1).toString(),
        ...formData,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setDivisions([...divisions, newDivision]);
    } else if (modalMode === 'edit' && selectedDivision) {
      setDivisions(divisions.map(div => 
        div.id === selectedDivision.id 
          ? { ...div, ...formData }
          : div
      ));
    }
    
    closeModal();
  };

  const handleDelete = () => {
    if (selectedDivision) {
      setDivisions(divisions.filter(div => div.id !== selectedDivision.id));
      closeModal();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generatePreview = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = require('xlsx').read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = require('xlsx').utils.sheet_to_json(worksheet, { header: 1 });
        
        // Tomar las primeras 5 filas para el preview
        const previewData = jsonData.slice(1, 6).map((row: any, index: number) => ({
          row: index + 2,
          nombre: row[0] || '',
          email: row[1] || '',
          dni: row[2] || ''
        }));
        
        setUploadPreview(previewData);
        setShowPreview(true);
      } catch (error) {
        console.error('Error al leer el archivo:', error);
        alert('Error al leer el archivo Excel');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      generatePreview(file);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;

    // Por ahora, usaremos la primera división disponible
    // En una implementación real, deberías permitir seleccionar la división
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('divisionId', divisions[0]?.id || ''); // Usar la primera división como ejemplo

    try {
      const response = await fetch('/api/coordinators/upload-excel', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (result.success) {
        alert(`Carga completada. ${result.data.success} coordinadores cargados exitosamente.`);
        setShowUploadModal(false);
        setUploadFile(null);
        setUploadPreview([]);
        setShowPreview(false);
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error al cargar coordinadores:', error);
      alert('Error al cargar coordinadores');
    }
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setUploadFile(null);
    setUploadPreview([]);
    setShowPreview(false);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Divisiones</p>
              <p className="text-2xl font-bold text-gray-900">{totalDivisions}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Divisiones Activas</p>
              <p className="text-2xl font-bold text-gray-900">{activeDivisions}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Divisiones Inactivas</p>
              <p className="text-2xl font-bold text-gray-900">{inactiveDivisions}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <Building2 className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Gestión de Divisiones</h2>
            <div className="flex gap-2">
              {canEditDivisions && (
                <button 
                  onClick={() => setShowUploadModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Cargar Coordinadores
                </button>
              )}
              {canEditDivisions && (
                <button 
                  onClick={() => openModal('add')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Nueva División
                </button>
              )}
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar divisiones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  División
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
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
              {filteredDivisions.map((division) => (
                <tr key={division.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{division.name}</div>
                      <div className="text-sm text-gray-500">Creada: {new Date(division.createdAt).toLocaleDateString()}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="max-w-xs truncate">{division.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(division.status)}`}>
                      {division.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      {canEditDivisions && (
                        <button
                          onClick={() => openModal('edit', division)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="Editar división"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {canDeleteDivisions && (
                        <button
                          onClick={() => openModal('delete', division)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Eliminar división"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      {!canEditDivisions && !canDeleteDivisions && (
                        <span className="text-gray-400 text-xs">Sin permisos</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {modalMode === 'add' && 'Agregar División'}
                  {modalMode === 'edit' && 'Editar División'}
                  {modalMode === 'delete' && 'Eliminar División'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {modalMode === 'delete' ? (
                <div>
                  <p className="text-gray-600 mb-6">
                    ¿Estás seguro de que deseas eliminar la división "{selectedDivision?.name}"? 
                    Esta acción no se puede deshacer.
                  </p>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={closeModal}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleDelete}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la División
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Activo</option>
                      <option value="inactive">Inactivo</option>
                    </select>
                  </div>

                  <div className="flex gap-3 justify-end pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {modalMode === 'add' ? 'Agregar' : 'Guardar'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Carga de Coordinadores */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Cargar Coordinadores desde Excel
                </h3>
                <button
                  onClick={closeUploadModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Instrucciones */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Formato del archivo Excel:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Columna A:</strong> Nombre del coordinador</li>
                  <li>• <strong>Columna B:</strong> Email del coordinador</li>
                  <li>• <strong>Columna C:</strong> DNI del coordinador</li>
                  <li>• La primera fila debe contener los encabezados</li>
                </ul>
              </div>

              {/* Selección de archivo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar archivo Excel
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Preview */}
              {showPreview && uploadPreview.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Vista previa (primeras 5 filas):</h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">Fila</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">Nombre</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">Email</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">DNI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {uploadPreview.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-gray-600">{row.row}</td>
                            <td className="px-4 py-2">{row.nombre}</td>
                            <td className="px-4 py-2">{row.email}</td>
                            <td className="px-4 py-2">{row.dni}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={closeUploadModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={!uploadFile}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cargar Coordinadores
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};