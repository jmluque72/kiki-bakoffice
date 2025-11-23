import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, MoreVertical, Users, UserCheck, UserX, X, Mail, User as UserIcon, Loader2, AlertCircle, UserCog, UsersRound, Download } from 'lucide-react';
import { userService, User, UserFormData } from '../../services/userService';
import { getRoleDisplayName } from '../../utils/roleTranslations';
import { useAuth } from '../../hooks/useAuth';
import * as XLSX from 'xlsx';

interface UsuariosSectionProps {
  isReadonly?: boolean;
}

export const UsuariosSection: React.FC<UsuariosSectionProps> = ({ isReadonly = false }) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role?.nombre === 'superadmin';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    coordinadores: 0,
    familiares: 0,
    tutores: 0,
    familyadmin: 0
  });
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    role: 'user',
    status: 'active',
    avatar: ''
  });

  const getStatusColor = (activo: boolean) => {
    return activo 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'bg-red-100 text-red-800';
      case 'adminaccount': return 'bg-orange-100 text-orange-800';
      case 'coordinador': return 'bg-purple-100 text-purple-800';
      case 'familyadmin': return 'bg-green-100 text-green-800';
      case 'familyviewer': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.nombre || user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterRole === 'all' || user.role?.nombre === filterRole;
    return matchesSearch && matchesFilter;
  });

  // Las estadísticas ahora vienen del servidor

  const openModal = () => {
    // Modal desactivado - Los usuarios se crean por Excel o app móvil
    console.log('Creación de usuarios desactivada - Los usuarios se crean mediante carga de Excel o desde la app móvil');
    return;
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      name: '',
      email: '',
      role: 'user',
      status: 'active',
      avatar: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await userService.createUser(formData);
      await fetchUsers();
      closeModal();
    } catch (error) {
      console.error('Error creating user:', error);
      setError('Error al crear usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const fetchUsers = async () => {
    try {
      console.log('📞 [FRONTEND] fetchUsers llamado');
      console.log('📞 [FRONTEND] Parámetros:', { currentPage, limit: 10, searchTerm });
      setLoading(true);
      setError(null);
      console.log('📞 [FRONTEND] Llamando a userService.getUsers...');
      const response = await userService.getUsers(currentPage, 10, searchTerm);
      console.log('✅ [FRONTEND] Respuesta recibida de userService.getUsers');
      console.log('📊 [FRONTEND] Respuesta completa del servicio:', JSON.stringify(response, null, 2));
      console.log('📊 [FRONTEND] response.data:', response.data);
      console.log('📊 [FRONTEND] response.data.stats:', response.data?.stats);
      
      // El servicio devuelve response.data del axios, que es el objeto completo del backend
      // Estructura: { success: true, data: { users: [], total: 0, stats: {} } }
      if (response && response.data) {
        setUsers(response.data.users || []);
        setTotalUsers(response.data.total || 0);
        setTotalPages(Math.ceil((response.data.total || 0) / 10));
        
        // Usar estadísticas del servidor si están disponibles
        if (response.data.stats) {
          console.log('📊 [FRONTEND] Estableciendo stats:', JSON.stringify(response.data.stats, null, 2));
          setStats({
            total: response.data.stats.total || 0,
            active: response.data.stats.active || 0,
            inactive: response.data.stats.inactive || 0,
            coordinadores: response.data.stats.coordinadores || 0,
            familiares: response.data.stats.familiares || 0,
            tutores: response.data.stats.tutores || 0,
            familyadmin: response.data.stats.familyadmin || 0
          });
        } else {
          console.warn('⚠️ [FRONTEND] No se recibieron stats del servidor. response.data:', response.data);
          // Si no hay stats, al menos usar el total
          if (response.data.total !== undefined) {
            setStats(prev => ({ ...prev, total: response.data.total }));
          }
        }
      } else {
        console.error('❌ [FRONTEND] Respuesta inválida:', response);
        setError('Error: respuesta inválida del servidor');
      }
    } catch (error) {
      console.error('❌ [FRONTEND] Error fetching users:', error);
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 [FRONTEND] useEffect ejecutado, llamando fetchUsers...');
    console.log('🔄 [FRONTEND] currentPage:', currentPage, 'searchTerm:', searchTerm);
    fetchUsers();
  }, [currentPage, searchTerm]);

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Exportar usuarios a Excel
  const exportToExcel = async () => {
    try {
      setLoading(true);
      console.log('📥 [EXPORT] Iniciando exportación de usuarios...');
      
      // Obtener todos los usuarios
      const allUsers = await userService.getAllUsersForExport();
      console.log('📥 [EXPORT] Usuarios obtenidos:', allUsers.length);
      
      // Preparar datos para Excel
      const excelData = allUsers.map(user => ({
        'Nombre': user.nombre || user.name || '',
        'Email': user.email || '',
        'Rol': getRoleDisplayName(user.role?.nombre || ''),
        'Estado': user.activo ? 'Activo' : 'Inactivo',
        'Fecha Creación': new Date(user.createdAt).toLocaleDateString('es-AR'),
        'Última Actualización': new Date(user.updatedAt).toLocaleDateString('es-AR')
      }));
      
      // Crear workbook y worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');
      
      // Ajustar ancho de columnas
      const colWidths = [
        { wch: 30 }, // Nombre
        { wch: 35 }, // Email
        { wch: 25 }, // Rol
        { wch: 15 }, // Estado
        { wch: 18 }, // Fecha Creación
        { wch: 18 }  // Última Actualización
      ];
      ws['!cols'] = colWidths;
      
      // Generar nombre de archivo con fecha
      const fileName = `usuarios_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Descargar archivo
      XLSX.writeFile(wb, fileName);
      console.log('✅ [EXPORT] Archivo exportado exitosamente:', fileName);
      
    } catch (error) {
      console.error('❌ [EXPORT] Error al exportar usuarios:', error);
      setError('Error al exportar usuarios a Excel');
    } finally {
      setLoading(false);
    }
  };

  console.log('🎨 [FRONTEND] UsuariosSection renderizado');
  console.log('🎨 [FRONTEND] Estado actual - users:', users.length, 'stats:', stats);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Usuarios</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total || totalUsers}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tutores</p>
              <p className="text-xs text-gray-500 mb-1">(familyadmin)</p>
              <p className="text-2xl font-bold text-gray-900">{stats.tutores}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <UsersRound className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Familiares</p>
              <p className="text-xs text-gray-500 mb-1">(familyviewer)</p>
              <p className="text-2xl font-bold text-gray-900">{stats.familiares}</p>
            </div>
            <div className="p-3 bg-cyan-100 rounded-lg">
              <UsersRound className="w-6 h-6 text-cyan-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Coordinadores</p>
              <p className="text-xs text-gray-500 mb-1">(coordinador)</p>
              <p className="text-2xl font-bold text-gray-900">{stats.coordinadores}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <UserCog className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Gestión de Usuarios</h2>
              <p className="text-sm text-gray-500 mt-1">
                Los usuarios se crean automáticamente mediante carga de Excel o desde la app móvil
              </p>
            </div>
            <button
              onClick={exportToExcel}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Exportar a Excel
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los roles</option>
                <option value="superadmin">Super Administrador</option>
                <option value="adminaccount">Administrador de Cuenta</option>
                <option value="coordinador">Coordinador</option>
                <option value="familyadmin">Administrador de Familia</option>
                <option value="familyviewer">Visualizador de Familia</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Cargando usuarios...</span>
            </div>
          ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último Login
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {(user.nombre || user.name || '').split(' ').map((n: string) => n[0]).join('')}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.nombre || user.name || 'Sin nombre'}</div>
                        <div className="text-sm text-gray-500">{user.email || ''}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role?.nombre || '')}`}>
                      {getRoleDisplayName(user.role?.nombre || '')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.activo)}`}>
                      {user.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando página {currentPage} de {totalPages} ({totalUsers} usuarios total)
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 text-sm border rounded-md ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Agregar Nuevo Usuario
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
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    placeholder="Ej: Juan Pérez"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    placeholder="usuario@empresa.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="familyviewer">Visualizador de Familia</option>
                    <option value="familyadmin">Administrador de Familia</option>
                    <option value="coordinador">Coordinador</option>
                    <option value="adminaccount">Administrador de Cuenta</option>
                    <option value="superadmin">Super Administrador</option>
                  </select>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL del Avatar (Opcional)
                  </label>
                  <input
                    type="url"
                    name="avatar"
                    value={formData.avatar}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://ejemplo.com/avatar.jpg"
                  />
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
                    Agregar Usuario
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};