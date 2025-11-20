import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, MoreVertical, Building2, TrendingUp, AlertCircle, Globe, Mail, X, Loader2, Edit, Eye, UserPlus } from 'lucide-react';
import { Institution } from '../../types';
import { AccountService, CreateAccountRequest, UpdateAccountRequest } from '../../services/accountService';
import { Account } from '../../config/api';
import { ImageUpload } from '../ImageUpload';
import { CreateAdminUserModal } from '../CreateAdminUserModal';
import { config } from '../../config/env';
import { UploadService } from '../../services/uploadService';
import { useAuth } from '../../hooks/useAuth';

interface InstitutionFormData {
  nombre: string;
  razonSocial: string;
  address: string;
  emailAdmin: string;
  nombreAdmin: string;
  logo: string;
  activo: boolean;
}

interface AccountsSectionProps {
  isReadonly?: boolean;
}

export const AccountsSection: React.FC<AccountsSectionProps> = ({ isReadonly = false }) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role?.nombre === 'superadmin';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState<InstitutionFormData>({
    nombre: '',
    razonSocial: '',
    address: '',
    emailAdmin: '',
    nombreAdmin: '',
    logo: '',
    activo: true
  });

  const [currentImageKey, setCurrentImageKey] = useState<string>('');
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');

  const [institutions, setInstitutions] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAccounts, setTotalAccounts] = useState(0);
  const [accountConfig, setAccountConfig] = useState<{
    requiereAprobarActividades: boolean;
  } | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);

  const getStatusColor = (status: Institution['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Institution['status']) => {
    switch (status) {
      case 'active': return 'Activa';
      case 'inactive': return 'Inactiva';
      case 'pending': return 'Pendiente';
      default: return 'Desconocido';
    }
  };

  const filteredInstitutions = institutions.filter(institution => {
    const matchesSearch = 
      institution.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      institution.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      institution.usuarioAdministrador.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || (institution.activo ? 'active' : 'inactive') === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Cargar datos de la API
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await AccountService.getAccounts(currentPage, 10);
        setInstitutions(response.accounts);
        setTotalAccounts(response.total);
        setTotalPages(Math.ceil(response.total / 10));
      } catch (err: any) {
        setError(err.message || 'Error al cargar las instituciones');
        console.error('Error loading accounts:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAccounts();
  }, [currentPage]);

  const totalInstitutions = totalAccounts;
  const activeInstitutions = institutions.filter(inst => inst.activo).length;
  const pendingInstitutions = institutions.filter(inst => !inst.activo).length;

  const openModal = async (account?: Account) => {
    
    if (account) {
      setEditingAccount(account);
      setFormData({
        nombre: account.nombre,
        razonSocial: account.razonSocial,
        address: account.address,
        emailAdmin: account.usuarioAdministrador.email || '',
        nombreAdmin: account.usuarioAdministrador.name || '',
        logo: account.logo || '',
        activo: account.activo
      });
      
      // Cargar imagen actual si existe
      if (account.logo) {
        setCurrentImageKey(account.logo);
        // Usar la URL firmada si está disponible, sino construir la URL de S3
        const logoUrl = account.logoSignedUrl || config.getS3ImageUrl(account.logo);
        setCurrentImageUrl(logoUrl);
      } else {
        setCurrentImageKey('');
        setCurrentImageUrl('');
      }

      // Cargar configuración de la cuenta
      try {
        setLoadingConfig(true);
        const configData = await AccountService.getAccountConfig(account._id);
        setAccountConfig({
          requiereAprobarActividades: configData.requiereAprobarActividades
        });
      } catch (err: any) {
        console.error('Error cargando configuración:', err);
        // Si no existe, usar valores por defecto
        setAccountConfig({
          requiereAprobarActividades: true
        });
      } finally {
        setLoadingConfig(false);
      }
    } else {
      setEditingAccount(null);
      setFormData({
        nombre: '',
        razonSocial: '',
        address: '',
        emailAdmin: '',
        nombreAdmin: '',
        logo: '',
        activo: true
      });
      setCurrentImageKey('');
      setCurrentImageUrl('');
      setAccountConfig(null);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAccount(null);
    setFormData({
      nombre: '',
      razonSocial: '',
      address: '',
      emailAdmin: '',
      nombreAdmin: '',
      logo: '',
      activo: true
    });
  };

  const handleCreateAdminUser = (account: Account) => {
    setSelectedAccount(account);
    setShowCreateAdminModal(true);
  };

  const closeCreateAdminModal = () => {
    setShowCreateAdminModal(false);
    setSelectedAccount(null);
  };

  const handleAdminUserCreated = () => {
    // Recargar la lista de cuentas
    loadInstitutions();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingAccount) {
        // Actualizar cuenta existente
        const updateData: UpdateAccountRequest = {
          nombre: formData.nombre,
          razonSocial: formData.razonSocial,
          address: formData.address,
          emailAdmin: formData.emailAdmin,
          nombreAdmin: formData.nombreAdmin,
          logo: formData.logo,
          activo: formData.activo
        };
        
        await AccountService.updateAccount(editingAccount._id, updateData);
        
        // Si se subió una nueva imagen, actualizar el logo en S3
        if (currentImageKey && currentImageKey !== editingAccount.logo) {
          await UploadService.updateAccountLogo(editingAccount._id, currentImageKey);
        }
      } else {
        // Crear nueva cuenta (permitido para superadmin)
        const accountData: CreateAccountRequest = {
          nombre: formData.nombre,
          razonSocial: formData.razonSocial,
          address: formData.address,
          emailAdmin: formData.emailAdmin,
          passwordAdmin: 'admin123', // Contraseña por defecto
          nombreAdmin: formData.nombreAdmin,
          logo: formData.logo
        };
        
        const newAccount = await AccountService.createAccount(accountData);
        
        // Si se subió una imagen, actualizar el logo en S3
        if (currentImageKey) {
          await UploadService.updateAccountLogo(newAccount._id, currentImageKey);
        }
      }
      
      // Guardar configuración si estamos editando
      if (editingAccount && accountConfig) {
        try {
          await AccountService.updateAccountConfig(editingAccount._id, accountConfig);
          console.log('✅ Configuración guardada exitosamente');
        } catch (err: any) {
          console.error('Error guardando configuración:', err);
          // No bloquear el guardado de la cuenta si falla la configuración
        }
      }
      
      // Recargar datos
      const response = await AccountService.getAccounts(currentPage, 10);
      setInstitutions(response.accounts);
      setTotalAccounts(response.total);
      
      closeModal();
    } catch (err: any) {
      console.error('Error saving account:', err);
      setError(err.message || 'Error al guardar la institución');
    }
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (imageKey: string, imageUrl: string) => {
    setCurrentImageKey(imageKey);
    setCurrentImageUrl(imageUrl);
    setFormData(prev => ({
      ...prev,
      logo: imageKey
    }));
  };

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Cargando instituciones...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Instituciones</p>
              <p className="text-2xl font-bold text-gray-900">{totalInstitutions}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Instituciones Activas</p>
              <p className="text-2xl font-bold text-gray-900">{activeInstitutions}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-gray-900">{pendingInstitutions}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar instituciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activas</option>
                <option value="pending">Pendientes</option>
                <option value="inactive">Inactivas</option>
              </select>
            </div>
          </div>

          {!isReadonly && (
            <button 
              onClick={() => openModal()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nueva Institución
            </button>
          )}
          {isReadonly && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed">
              <Plus className="w-4 h-4" />
              Nueva Institución (Solo lectura)
            </div>
          )}
        </div>
      </div>

      {/* Institutions Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Institución
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dirección
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ubicación
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
              {filteredInstitutions.map((institution) => (
                <tr key={institution._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {institution.nombre}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {institution.address}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      {institution.usuarioAdministrador.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Globe className="w-4 h-4 mr-2 text-gray-400" />
                      <div>
                        <div>{institution.razonSocial}</div>
                        <div className="text-xs text-gray-500">Razón Social</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${institution.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {institution.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {!isReadonly && isSuperAdmin && (
                        <>
                          <button 
                            onClick={() => handleCreateAdminUser(institution)}
                            className="text-green-600 hover:text-green-800 p-1 rounded"
                            title="Crear Usuario Administrador"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => openModal(institution)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded"
                            title="Editar Institución"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {!isReadonly && !isSuperAdmin && (
                        <button 
                          onClick={() => openModal(institution)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {isReadonly && (
                        <span className="text-gray-400 text-xs">Solo lectura</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredInstitutions.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron instituciones
            </h3>
            <p className="text-gray-500">
              Intenta ajustar los filtros de búsqueda o crear una nueva institución.
            </p>
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
                  {editingAccount ? 'Editar Institución' : 'Agregar Nueva Institución'}
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
                {isReadonly && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                      <span className="text-yellow-800 text-sm font-medium">Modo solo lectura - No se pueden realizar cambios</span>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Institución
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    disabled={isReadonly}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isReadonly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    disabled={isReadonly}
                    rows={2}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isReadonly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Razón Social
                  </label>
                  <input
                    type="text"
                    name="razonSocial"
                    value={formData.razonSocial}
                    onChange={handleInputChange}
                    disabled={isReadonly}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isReadonly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Administrador
                  </label>
                  <input
                    type="email"
                    name="emailAdmin"
                    value={formData.emailAdmin}
                    onChange={handleInputChange}
                    disabled={isReadonly}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isReadonly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Administrador
                  </label>
                  <input
                    type="text"
                    name="nombreAdmin"
                    value={formData.nombreAdmin}
                    onChange={handleInputChange}
                    disabled={isReadonly}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isReadonly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo de la Institución
                  </label>
                  <ImageUpload
                    onImageUpload={handleImageUpload}
                    currentImageUrl={currentImageUrl}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    name="activo"
                    value={formData.activo ? 'true' : 'false'}
                    onChange={(e) => setFormData(prev => ({ ...prev, activo: e.target.value === 'true' }))}
                    disabled={isReadonly}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isReadonly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  >
                    <option value="true">Activa</option>
                    <option value="false">Inactiva</option>
                  </select>
                </div>

                {/* Configuración de la institución - Solo al editar */}
                {editingAccount && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Configuración de Actividades</h4>
                    {loadingConfig ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        <span className="ml-2 text-sm text-gray-600">Cargando configuración...</span>
                      </div>
                    ) : (
                      <div>
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={accountConfig?.requiereAprobarActividades ?? true}
                            onChange={(e) => setAccountConfig(prev => ({
                              ...prev,
                              requiereAprobarActividades: e.target.checked
                            } as any))}
                            disabled={isReadonly}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-900">
                              Requerir aprobación de actividades
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              Si está activado, las actividades se crean en estado "borrador" y deben ser aprobadas antes de publicarse. Si está desactivado, las actividades se publican automáticamente.
                            </p>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>
                )}

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
                    disabled={isReadonly}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      isReadonly 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {editingAccount ? 'Actualizar Institución' : 'Agregar Institución'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear usuario administrador */}
      {showCreateAdminModal && selectedAccount && (
        <CreateAdminUserModal
          isOpen={showCreateAdminModal}
          onClose={closeCreateAdminModal}
          accountId={selectedAccount._id}
          accountName={selectedAccount.nombre}
          onSuccess={handleAdminUserCreated}
        />
      )}

    </div>
  );
};