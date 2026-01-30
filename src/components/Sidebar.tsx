import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Settings, 
  FileText, 
  CreditCard,
  Activity,
  Calendar,
  Building2,
  LogOut,
  X,
  Clock,
  GraduationCap,
  UserPlus,
  Bell,
  Shield,
  FolderOpen,
  ClipboardList,
  Smartphone,
  ChevronDown,
  ChevronRight,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface SidebarItem {
  icon: React.ComponentType<any>;
  label: string;
  key: string;
}

interface SidebarGroup {
  label: string;
  icon: React.ComponentType<any>;
  items: SidebarItem[];
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const GROUPS_ORDER = ['institución', 'cobranzas', 'personas', 'actividad', 'eventos', 'comunicación', 'sistema'];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, activeSection, onSectionChange }) => {
  const { logout, user } = useAuth();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const isSuperAdmin = user?.role?.nombre === 'superadmin';
  const isAdminAccount = user?.role?.nombre === 'adminaccount';
  const canSeeNotifications = isAdminAccount || isSuperAdmin;

  // Abrir el grupo que contiene la sección activa; si no hay, abrir el primero
  useEffect(() => {
    const group = getGroupForKey(activeSection);
    if (group) {
      setExpandedGroups((prev) => ({ ...prev, [group]: true }));
    } else {
      const firstKey = GROUPS_ORDER.find((k) => menuGroups[k]?.items?.length);
      if (firstKey) setExpandedGroups((prev) => ({ ...prev, [firstKey]: true }));
    }
  }, [activeSection]);

  const menuGroups: Record<string, SidebarGroup> = isSuperAdmin
    ? {}
    : {
        'institución': {
          label: 'Institución',
          icon: Building2,
          items: [
            { icon: Building2, label: 'Divisiones', key: 'divisiones' },
            ...(isAdminAccount ? [{ icon: Settings, label: 'Config. Institución', key: 'account-config' }] : []),
            ...(isAdminAccount ? [{ icon: FolderOpen, label: 'Documentos', key: 'documentos' }] : []),
          ],
        },
        'cobranzas': {
          label: 'Cobranzas',
          icon: CreditCard,
          items: [
            ...((isAdminAccount || isSuperAdmin) ? [
              { icon: Settings, label: 'Configuración', key: 'payment-config' },
              { icon: ClipboardList, label: 'Registro', key: 'payment-register' },
              { icon: BarChart3, label: 'Estadísticas', key: 'payment-stats' },
            ] : []),
          ],
        },
        'personas': {
          label: 'Personas',
          icon: Users,
          items: [
            { icon: Users, label: 'Usuarios', key: 'usuarios' },
            { icon: UserPlus, label: 'Tutores', key: 'tutores' },
            { icon: GraduationCap, label: 'Alumnos', key: 'alumnos' },
            { icon: Shield, label: 'Quién Retira', key: 'pickup' },
          ],
        },
        'actividad': {
          label: 'Actividad y asistencia',
          icon: ClipboardList,
          items: [
            { icon: Activity, label: 'Activity', key: 'activity' },
            { icon: Clock, label: 'Asistencias', key: 'asistencias' },
            { icon: ClipboardList, label: 'Acciones Diarias', key: 'acciones-diarias' },
            { icon: FileText, label: 'Formularios', key: 'formularios' },
          ],
        },
        'eventos': {
          label: 'Eventos',
          icon: Calendar,
          items: [
            { icon: Calendar, label: 'Eventos', key: 'eventos' },
          ],
        },
        'comunicación': {
          label: 'Comunicación',
          icon: Bell,
          items: [
            { icon: Smartphone, label: 'Push Notifications', key: 'push-notifications' },
            ...(canSeeNotifications ? [{ icon: Bell, label: 'Notificaciones Pendientes', key: 'notificaciones-pendientes' }] : []),
            ...(canSeeNotifications ? [{ icon: FileText, label: 'Templates de Notificaciones', key: 'notification-templates' }] : []),
          ],
        },
        'sistema': {
          label: 'Sistema',
          icon: BarChart3,
          items: [
            ...(canSeeNotifications ? [{ icon: BarChart3, label: 'Estadísticas de Login', key: 'login-stats' }] : []),
          ],
        },
      };

  function getGroupForKey(key: string): string | null {
    for (const [groupKey, group] of Object.entries(menuGroups)) {
      if (group.items.some((i) => i.key === key)) return groupKey;
    }
    return null;
  }

  const handleSectionClick = (sectionKey: string) => {
    onSectionChange(sectionKey);
    onClose();
  };

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden cursor-default border-0 p-0 m-0 w-full h-full"
          onClick={onClose}
        />
      )}

      <nav data-testid="sidebar" className={`fixed left-0 top-0 h-full w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:z-0`}>
        
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <img src="/kiki_splash.png" alt="Kiki Logo" className="h-[100px] w-auto" />
            <button onClick={onClose} className="lg:hidden text-gray-500 hover:text-gray-700 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <ul className="space-y-1">
            {isSuperAdmin ? (
              <li>
                <button
                  onClick={() => handleSectionClick('accounts')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 w-full text-left ${
                    activeSection === 'accounts' ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="font-medium">Instituciones</span>
                </button>
              </li>
            ) : (
              GROUPS_ORDER.map((groupKey) => {
                const group = menuGroups[groupKey];
                if (!group || group.items.length === 0) return null;
                const isExpanded = expandedGroups[groupKey] ?? false;
                return (
                  <li key={groupKey}>
                    <button
                      onClick={() => toggleGroup(groupKey)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-lg w-full text-left text-gray-700 hover:bg-gray-50 font-medium"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
                      <group.icon className="w-5 h-5 shrink-0" />
                      <span>{group.label}</span>
                    </button>
                    {isExpanded && (
                      <ul className="mt-1 ml-4 pl-2 border-l border-gray-200 space-y-0.5">
                        {group.items.map((item) => (
                          <li key={item.key}>
                            <button
                              onClick={() => handleSectionClick(item.key)}
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg w-full text-left text-sm transition-all duration-200 ${
                                activeSection === item.key
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }`}
                            >
                              <item.icon className="w-4 h-4 shrink-0 opacity-80" />
                              <span>{item.label}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </nav>
    </>
  );
};