import React from 'react';
import { Menu, Bell, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotificationCount } from '../hooks/useNotificationCount';
import { ApiStatus } from './ApiStatus';

interface HeaderProps {
  onMenuClick: () => void;
  currentSection: string;
  onNotificationClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, currentSection, onNotificationClick }) => {
  const { user } = useAuth();
  const { unreadCount, shouldShowNotifications } = useNotificationCount();

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
          
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
            <User className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">{user?.nombre}</span>
          </div>
        </div>
      </div>
    </header>
  );
};