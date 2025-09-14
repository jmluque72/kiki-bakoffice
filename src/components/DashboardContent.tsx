import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Building2, 
  Calendar,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { DashboardService, DashboardStats, RecentActivity } from '../services/dashboardService';
import { useAuth } from '../hooks/useAuth';

export const DashboardContent: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Solo cargar datos si es superadmin
      if (user?.role?.nombre === 'superadmin') {
        const [statsData, activitiesData] = await Promise.all([
          DashboardService.getStats(),
          DashboardService.getRecentActivities()
        ]);

        setStats(statsData);
        setRecentActivities(activitiesData);
      }
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Hace un momento';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} minutos`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `Hace ${diffInDays} días`;
  };

  const statsCards = stats ? [
    {
      title: 'Instituciones Activas',
      value: stats.institucionesActivas.toString(),
      icon: Building2,
      color: 'bg-blue-500'
    },
    {
      title: 'Usuarios Activos',
      value: stats.usuariosActivos.toString(),
      icon: Users,
      color: 'bg-green-500'
    },
    {
      title: 'Alumnos Activos',
      value: stats.alumnosActivos.toString(),
      icon: Users,
      color: 'bg-purple-500'
    },
    {
      title: 'Total Actividades',
      value: stats.totalActividades.toString(),
      icon: Activity,
      color: 'bg-orange-500'
    }
  ] : [];

  // Si no es superadmin, mostrar mensaje
  if (user?.role?.nombre !== 'superadmin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Dashboard no disponible
          </h3>
          <p className="text-gray-500">
            Solo los superadministradores pueden ver el dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bienvenida */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">¡Bienvenido de vuelta!</h2>
        <p className="text-blue-100">Aquí tienes un resumen del sistema KIKI</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-gray-200 animate-pulse">
                  <div className="w-6 h-6"></div>
                </div>
              </div>
              <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            </div>
          ))
        ) : (
          statsCards.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-gray-600 text-sm">{stat.title}</p>
            </div>
          ))
        )}
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Actividades Recientes */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Actividades Recientes</h3>
            <button 
              onClick={loadDashboardData}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Actualizar
            </button>
          </div>
          
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center gap-4 p-3">
                  <div className="w-2 h-2 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivities.length > 0 ? (
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium text-sm">{activity.descripcion}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {activity.institucion}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {activity.division}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs mt-1">{formatDate(activity.fecha)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No hay actividades recientes</h4>
              <p className="text-gray-500">Las actividades aparecerán aquí cuando se registren en el sistema.</p>
            </div>
          )}
        </div>

        {/* Panel lateral */}
        <div className="space-y-6">
          {/* Resumen del Sistema */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen del Sistema</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Sistema KIKI</span>
                <span className="font-semibold text-green-600">Activo</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Última actualización</span>
                <span className="font-semibold text-sm">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Versión</span>
                <span className="font-semibold">v1.0.0</span>
              </div>
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Gestionar Instituciones
              </button>
              <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2">
                <Users className="w-4 h-4" />
                Ver Usuarios
              </button>
              <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Ver Actividades
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};