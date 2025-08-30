import React from 'react';
import { 
  TrendingUp, 
  Users, 
  Building2, 
  Calendar,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export const DashboardContent: React.FC = () => {
  const stats = [
    {
      title: 'Instituciones Activas',
      value: '12',
      change: '+8%',
      trending: 'up',
      icon: Building2,
      color: 'bg-blue-500'
    },
    {
      title: 'Usuarios Activos',
      value: '2,340',
      change: '+18%',
      trending: 'up',
      icon: Users,
      color: 'bg-green-500'
    },
    {
      title: 'Actividades',
      value: '156',
      change: '+12%',
      trending: 'up',
      icon: Activity,
      color: 'bg-orange-500'
    },
    {
      title: 'Eventos',
      value: '24',
      change: '+5%',
      trending: 'up',
      icon: Calendar,
      color: 'bg-purple-500'
    }
  ];

  const recentActivity = [
    { action: 'Nuevo usuario registrado', time: 'Hace 2 minutos', type: 'user' },
    { action: 'Orden #1234 completada', time: 'Hace 5 minutos', type: 'order' },
    { action: 'Producto actualizado', time: 'Hace 10 minutos', type: 'product' },
    { action: 'Pago procesado', time: 'Hace 15 minutos', type: 'payment' },
    { action: 'Nuevo comentario', time: 'Hace 20 minutos', type: 'comment' }
  ];

  return (
    <div className="space-y-6">
      {/* Bienvenida */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">¡Bienvenido de vuelta!</h2>
        <p className="text-blue-100">Aquí tienes un resumen de tu negocio hoy</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className={`flex items-center gap-1 text-sm ${
                stat.trending === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.trending === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {stat.change}
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
            <p className="text-gray-600 text-sm">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de actividad */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Ver todo
            </button>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium">{activity.action}</p>
                  <p className="text-gray-500 text-sm">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel lateral */}
        <div className="space-y-6">
          {/* Métricas rápidas */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Métricas Rápidas</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Sesiones hoy</span>
                <span className="font-semibold">1,234</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tiempo promedio</span>
                <span className="font-semibold">4:32</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tasa de rebote</span>
                <span className="font-semibold">42%</span>
              </div>
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
            <div className="space-y-2">
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                Agregar Producto
              </button>
              <button className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                Generar Reporte
              </button>
              <button className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                Configurar Notificaciones
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};