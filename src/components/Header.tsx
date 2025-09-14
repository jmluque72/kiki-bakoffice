import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotificationCount } from '../hooks/useNotificationCount';
import { ApiStatus } from './ApiStatus';
import { getRoleDisplayName, getRoleColor } from '../utils/roleTranslations';
import { ChangePasswordModal } from './ChangePasswordModal';

interface HeaderProps {
  onMenuClick: () => void;
  currentSection: string;
  onNotificationClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, currentSection, onNotificationClick }) => {
  const { user, logout } = useAuth();
  const { unreadCount, shouldShowNotifications } = useNotificationCount();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getSectionTitle = (section: string) => {
    const titles: { [key: string]: string } = {
      dashboard: 'Dashboard',
      accounts: 'Instituciones',
      usuarios: 'Usuarios',
      activity: 'Activity',
      eventos: 'Eventos',
      divisiones: 'Divisiones'
    };
    return titles[section] || 'Dashboard';
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">{getSectionTitle(currentSection)}</h1>
        </div>

        <div className="flex items-center gap-4">
          {shouldShowNotifications && (
            <button 
              onClick={onNotificationClick}
              className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
              title="Notificaciones"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          )}
          
          <ApiStatus />
          
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <User className="w-5 h-5 text-gray-600" />
              <div className="flex flex-col text-left">
                <span className="text-sm font-medium text-gray-900">{user?.name}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${getRoleColor(user?.role?.nombre || '')}`}>
                  {user?.role?.nombre || 'Sin rol'}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <button
                  onClick={() => {
                    setShowChangePassword(true);
                    setShowUserMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Cambiar Contraseña
                </button>
                <button
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </header>
  );
};