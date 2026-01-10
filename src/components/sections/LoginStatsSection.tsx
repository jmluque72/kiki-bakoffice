import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  Loader2,
  RefreshCw,
  Download,
  Calendar,
  TrendingUp,
  Shield
} from 'lucide-react';
import { LoginStatsService, LoginStats, UsersLoginStatusResponse, LoginAttempt } from '../../services/loginStatsService';
import { useAuth } from '../../hooks/useAuth';
import * as XLSX from 'xlsx';

export const LoginStatsSection: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role?.nombre === 'adminaccount' || user?.role?.nombre === 'superadmin';

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'suspicious'>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stats generales
  const [loginStats, setLoginStats] = useState<LoginStats | null>(null);
  const [timeWindow, setTimeWindow] = useState<number>(24);

  // Estado de usuarios
  const [usersStatus, setUsersStatus] = useState<UsersLoginStatusResponse | null>(null);
  const [usersTimeWindow, setUsersTimeWindow] = useState<number>(7);

  // Intentos sospechosos
  const [suspiciousAttempts, setSuspiciousAttempts] = useState<LoginAttempt[]>([]);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin, timeWindow, usersTimeWindow, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === 'overview') {
        const stats = await LoginStatsService.getLoginStats(timeWindow);
        setLoginStats(stats);
      } else if (activeTab === 'users') {
        const status = await LoginStatsService.getUsersLoginStatus(usersTimeWindow);
        setUsersStatus(status);
      } else if (activeTab === 'suspicious') {
        const attempts = await LoginStatsService.getSuspiciousAttempts(timeWindow);
        setSuspiciousAttempts(attempts);
      }
    } catch (err: any) {
      console.error('Error loading login stats:', err);
      setError(err.message || 'Error al cargar estadísticas de login');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Hace un momento';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} minutos`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Ayer';
    return `Hace ${diffInDays} días`;
  };

  const exportToExcel = () => {
    if (!usersStatus) return;

    const data = [
      ...usersStatus.usersLoggedIn.map(u => ({
        Email: u.email,
        Nombre: u.name,
        Rol: u.role,
        'Último Login': u.lastLogin ? formatDate(u.lastLogin) : 'N/A',
        'Cantidad de Logins': u.loginCount || 0,
        'IP Último Login': u.lastLoginIP || 'N/A',
        'Dispositivo': u.lastLoginDevice ? `${u.lastLoginDevice.platform} - ${u.lastLoginDevice.browser}` : 'N/A',
        'Ubicación': u.lastLoginLocation ? `${u.lastLoginLocation.city}, ${u.lastLoginLocation.country}` : 'N/A'
      })),
      ...usersStatus.usersNotLoggedIn.map(u => ({
        Email: u.email,
        Nombre: u.name,
        Rol: u.role,
        'Último Login': 'Sin login',
        'Cantidad de Logins': 0,
        'IP Último Login': 'N/A',
        'Dispositivo': 'N/A',
        'Ubicación': 'N/A'
      }))
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Estadísticas de Login');
    XLSX.writeFile(wb, `login-stats-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">No tienes permisos para ver esta sección.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Estadísticas de Login</h1>
        <p className="text-gray-600">Monitoreo y análisis de actividad de login de usuarios</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BarChart3 className="w-5 h-5 inline mr-2" />
            Resumen
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="w-5 h-5 inline mr-2" />
            Usuarios
          </button>
          <button
            onClick={() => setActiveTab('suspicious')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'suspicious'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <AlertTriangle className="w-5 h-5 inline mr-2" />
            Actividad Sospechosa
          </button>
        </nav>
      </div>

      {/* Controls */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">
            Período:
            <select
              value={activeTab === 'users' ? usersTimeWindow : timeWindow}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (activeTab === 'users') {
                  setUsersTimeWindow(value);
                } else {
                  setTimeWindow(value);
                }
              }}
              className="ml-2 px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value={1}>Últimas 24 horas</option>
              <option value={7}>Últimos 7 días</option>
              <option value={30}>Últimos 30 días</option>
              <option value={90}>Últimos 90 días</option>
            </select>
          </label>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'users' && usersStatus && (
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar Excel
            </button>
          )}
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* Overview Tab */}
      {!loading && activeTab === 'overview' && loginStats && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Intentos</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {loginStats.stats.totalAttempts}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Logins Exitosos</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {loginStats.stats.successfulAttempts}
                  </p>
                </div>
                <UserCheck className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Intentos Fallidos</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {loginStats.stats.failedAttempts}
                  </p>
                </div>
                <UserX className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tasa de Éxito</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {loginStats.stats.successRate.toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3">
                <Globe className="w-6 h-6 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">IPs Únicas</p>
                  <p className="text-xl font-bold text-gray-900">
                    {loginStats.stats.uniqueIPs}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-indigo-600" />
                <div>
                  <p className="text-sm text-gray-600">Emails Únicos</p>
                  <p className="text-xl font-bold text-gray-900">
                    {loginStats.stats.uniqueEmails}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Actividad Sospechosa</p>
                  <p className="text-xl font-bold text-gray-900">
                    {loginStats.stats.suspiciousAttempts}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {!loading && activeTab === 'users' && usersStatus && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">Total de Usuarios</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {usersStatus.stats.totalUsers}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg shadow p-6 border border-green-200">
              <p className="text-sm text-green-700">Con Login</p>
              <p className="text-2xl font-bold text-green-700 mt-1">
                {usersStatus.stats.usersLoggedIn}
              </p>
            </div>
            <div className="bg-red-50 rounded-lg shadow p-6 border border-red-200">
              <p className="text-sm text-red-700">Sin Login</p>
              <p className="text-2xl font-bold text-red-700 mt-1">
                {usersStatus.stats.usersNotLoggedIn}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg shadow p-6 border border-blue-200">
              <p className="text-sm text-blue-700">Tasa de Login</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">
                {usersStatus.stats.loginRate}
              </p>
            </div>
          </div>

          {/* Users with Login */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-green-600" />
              Usuarios que hicieron login ({usersStatus.usersLoggedIn.length})
            </h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rol
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Último Login
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cantidad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dispositivo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ubicación
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {usersStatus.usersLoggedIn.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>{formatRelativeTime(user.lastLogin!)}</div>
                          <div className="text-xs text-gray-400">{formatDate(user.lastLogin!)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.loginCount || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.lastLoginDevice ? (
                            <div className="flex items-center gap-1">
                              {user.lastLoginDevice.isMobile ? (
                                <Smartphone className="w-4 h-4" />
                              ) : (
                                <Monitor className="w-4 h-4" />
                              )}
                              <span>{user.lastLoginDevice.platform}</span>
                            </div>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.lastLoginLocation
                            ? `${user.lastLoginLocation.city}, ${user.lastLoginLocation.country}`
                            : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Users without Login */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <UserX className="w-6 h-6 text-red-600" />
              Usuarios sin login ({usersStatus.usersNotLoggedIn.length})
            </h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
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
                        Fecha de Creación
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {usersStatus.usersNotLoggedIn.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suspicious Activity Tab */}
      {!loading && activeTab === 'suspicious' && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            Intentos Sospechosos ({suspiciousAttempts.length})
          </h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dispositivo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Riesgo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {suspiciousAttempts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No hay intentos sospechosos en el período seleccionado
                      </td>
                    </tr>
                  ) : (
                    suspiciousAttempts.map((attempt) => (
                      <tr key={attempt._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {attempt.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {attempt.ipAddress}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {attempt.deviceInfo ? (
                            <div className="flex items-center gap-1">
                              {attempt.deviceInfo.isMobile ? (
                                <Smartphone className="w-4 h-4" />
                              ) : (
                                <Monitor className="w-4 h-4" />
                              )}
                              <span>{attempt.deviceInfo.platform} - {attempt.deviceInfo.browser}</span>
                            </div>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              attempt.riskScore >= 70
                                ? 'bg-red-100 text-red-800'
                                : attempt.riskScore >= 40
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {attempt.riskScore}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatRelativeTime(attempt.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

