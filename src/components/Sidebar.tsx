import React from 'react';
import { 
  Home, 
  Users, 
  Settings, 
  BarChart3, 
  FileText, 
  CreditCard,
  Activity,
  Calendar,
  Building2,
  LogOut,
  Menu,
  X,
  Clock,
  GraduationCap,
  UserCheck,
  UserPlus,
  Bell,
  Shield
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface SidebarItem {
  icon: React.ComponentType<any>;
  label: string;
  key: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, activeSection, onSectionChange }) => {
  const { logout, user } = useAuth();

  const menuItems: SidebarItem[] = [
    ...(user?.role?.nombre === 'superadmin' ? [{ icon: Home, label: 'Dashboard', key: 'dashboard' }] : []),
    ...(user?.role?.nombre === 'superadmin' ? [{ icon: CreditCard, label: 'Instituciones', key: 'accounts' }] : []),
    { icon: Users, label: 'Usuarios', key: 'usuarios' },
    { icon: Activity, label: 'Activity', key: 'activity' },
    { icon: Calendar, label: 'Eventos', key: 'eventos' },
    { icon: Bell, label: 'Notificaciones', key: 'notificaciones' },
    { icon: Building2, label: 'Divisiones', key: 'divisiones' },
    { icon: UserCheck, label: 'Coordinadores', key: 'coordinadores' },
    { icon: UserPlus, label: 'Tutores', key: 'tutores' },
    { icon: GraduationCap, label: 'Alumnos', key: 'alumnos' },
    { icon: Clock, label: 'Asistencias', key: 'asistencias' },
    { icon: Shield, label: 'Quién Retira', key: 'pickup' },
  ];

  const handleSectionClick = (sectionKey: string) => {
    onSectionChange(sectionKey);
    onClose(); // Close sidebar on mobile after selection
  };

  return (
    <>
      {/* Overlay móvil */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:z-0`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">KIKI</h2>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.key}>
                <button
                  onClick={() => handleSectionClick(item.key)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    activeSection === item.key
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  } w-full text-left`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </>
  );
};