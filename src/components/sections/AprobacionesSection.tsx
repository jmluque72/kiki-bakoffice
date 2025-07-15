import React, { useState } from 'react';
import { Search, Filter, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { Approval } from '../../types';

export const AprobacionesSection: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  const approvals: Approval[] = [
    {
      id: '1',
      title: 'Solicitud de Presupuesto Adicional',
      requester: 'María García',
      type: 'account',
      status: 'pending',
      requestDate: '2024-01-20',
      description: 'Solicitud de $5,000 adicionales para campaña de marketing',
      priority: 'high'
    },
    {
      id: '2',
      title: 'Creación de Nueva División',
      requester: 'Carlos López',
      type: 'division',
      status: 'approved',
      requestDate: '2024-01-19',
      description: 'División de Inteligencia Artificial y Machine Learning',
      priority: 'medium'
    },
    {
      id: '3',
      title: 'Evento Corporativo Q1',
      requester: 'Ana Martínez',
      type: 'event',
      status: 'pending',
      requestDate: '2024-01-18',
      description: 'Conferencia trimestral para 200 empleados',
      priority: 'medium'
    },
    {
      id: '4',
      title: 'Acceso de Usuario Externo',
      requester: 'Roberto Silva',
      type: 'user',
      status: 'rejected',
      requestDate: '2024-01-17',
      description: 'Acceso temporal para consultor externo',
      priority: 'low'
    },
    {
      id: '5',
      title: 'Actualización de Cuenta Premium',
      requester: 'Juan Pérez',
      type: 'account',
      status: 'pending',
      requestDate: '2024-01-16',
      description: 'Upgrade de cuenta standard a premium',
      priority: 'high'
    },
    {
      id: '6',
      title: 'Eliminación de División Obsoleta',
      requester: 'María García',
      type: 'division',
      status: 'approved',
      requestDate: '2024-01-15',
      description: 'Eliminación de división de tecnologías legacy',
      priority: 'low'
    }
  ];

  const getStatusColor = (status: Approval['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Approval['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: Approval['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: Approval['type']) => {
    switch (type) {
      case 'account': return 'bg-blue-100 text-blue-800';
      case 'event': return 'bg-purple-100 text-purple-800';
      case 'user': return 'bg-indigo-100 text-indigo-800';
      case 'division': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredApprovals = approvals.filter(approval => {
    const matchesSearch = approval.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         approval.requester.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         approval.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || approval.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || approval.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const pendingApprovals = approvals.filter(approval => approval.status === 'pending').length;
  const approvedApprovals = approvals.filter(approval => approval.status === 'approved').length;
  const rejectedApprovals = approvals.filter(approval => approval.status === 'rejected').length;

  const handleApprove = (id: string) => {
    console.log('Aprobar:', id);
  };

  const handleReject = (id: string) => {
    console.log('Rechazar:', id);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-gray-900">{pendingApprovals}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aprobadas</p>
              <p className="text-2xl font-bold text-gray-900">{approvedApprovals}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rechazadas</p>
              <p className="text-2xl font-bold text-gray-900">{rejectedApprovals}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Gestión de Aprobaciones</h2>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar aprobaciones..."
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
                <option value="pending">Pendiente</option>
                <option value="approved">Aprobado</option>
                <option value="rejected">Rechazado</option>
              </select>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas las prioridades</option>
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
              </select>
            </div>
          </div>
        </div>

        {/* Approvals List */}
        <div className="p-6">
          <div className="space-y-4">
            {filteredApprovals.map((approval) => (
              <div key={approval.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{approval.title}</h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(approval.type)}`}>
                        {approval.type}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(approval.priority)}`}>
                        {approval.priority}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{approval.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Solicitado por: <strong>{approval.requester}</strong></span>
                      <span>Fecha: {new Date(approval.requestDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(approval.status)}`}>
                      {getStatusIcon(approval.status)}
                      {approval.status}
                    </span>
                  </div>
                </div>

                {approval.status === 'pending' && (
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleApprove(approval.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleReject(approval.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Rechazar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};