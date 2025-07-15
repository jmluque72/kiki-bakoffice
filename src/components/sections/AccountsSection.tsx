import React, { useState } from 'react';
import { Search, Filter, Plus, MoreVertical, Building2, TrendingUp, AlertCircle, Globe, Mail } from 'lucide-react';
import { Institution } from '../../types';

export const AccountsSection: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const institutions: Institution[] = [
    {
      id: '1',
      nombre: 'Universidad Nacional de Colombia',
      address: 'Carrera 30 No 45-03, Edificio 477',
      emailadmin: 'admin@unal.edu.co',
      logo: 'https://via.placeholder.com/40',
      status: 'active',
      cuidad: 'Bogotá',
      pais: 'Colombia'
    },
    {
      id: '2',
      nombre: 'Instituto Tecnológico de Monterrey',
      address: 'Av. Eugenio Garza Sada 2501 Sur',
      emailadmin: 'admin@tec.mx',
      logo: 'https://via.placeholder.com/40',
      status: 'active',
      cuidad: 'Monterrey',
      pais: 'México'
    },
    {
      id: '3',
      nombre: 'Universidad de Buenos Aires',
      address: 'Viamonte 430, C1053 CABA',
      emailadmin: 'admin@uba.ar',
      logo: 'https://via.placeholder.com/40',
      status: 'pending',
      cuidad: 'Buenos Aires',
      pais: 'Argentina'
    },
    {
      id: '4',
      nombre: 'Universidad de Chile',
      address: 'Av. Libertador Bernardo O\'Higgins 1058',
      emailadmin: 'admin@uchile.cl',
      logo: 'https://via.placeholder.com/40',
      status: 'inactive',
      cuidad: 'Santiago',
      pais: 'Chile'
    },
    {
      id: '5',
      nombre: 'Pontificia Universidad Javeriana',
      address: 'Carrera 7 No 40-62',
      emailadmin: 'admin@javeriana.edu.co',
      logo: 'https://via.placeholder.com/40',
      status: 'active',
      cuidad: 'Bogotá',
      pais: 'Colombia'
    }
  ];

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
      institution.cuidad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      institution.pais.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || institution.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalInstitutions = institutions.length;
  const activeInstitutions = institutions.filter(inst => inst.status === 'active').length;
  const pendingInstitutions = institutions.filter(inst => inst.status === 'pending').length;

  return (
    <div className="space-y-6">
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

          <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            Nueva Institución
          </button>
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
                <tr key={institution.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img 
                        src={institution.logo} 
                        alt={`Logo ${institution.nombre}`}
                        className="w-10 h-10 rounded-lg object-cover mr-3"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {institution.nombre}
                        </div>
                      </div>
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
                      {institution.emailadmin}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Globe className="w-4 h-4 mr-2 text-gray-400" />
                      <div>
                        <div>{institution.cuidad}</div>
                        <div className="text-xs text-gray-500">{institution.pais}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(institution.status)}`}>
                      {getStatusText(institution.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical className="w-4 h-4" />
                    </button>
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
    </div>
  );
};