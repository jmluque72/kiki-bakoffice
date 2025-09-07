import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { DashboardContent } from './DashboardContent';
import { AccountsSection } from './sections/AccountsSection';
import { UsuariosSection } from './sections/UsuariosSection';
import { ActivitySection } from './sections/ActivitySection';
import { EventosSection } from './sections/EventosSection';
import { NotificationsSection } from './sections/NotificationsSection';
import PickupSection from './sections/PickupSection';

import GruposSection from './sections/GruposSection';
import { AsistenciasSection } from './sections/AsistenciasSection';
import { StudentsSection } from './sections/StudentsSection';
import CoordinadoresSection from './sections/CoordinadoresSection';
import TutoresSection from './sections/TutoresSection';
import { useAuth } from '../hooks/useAuth';

export const Dashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const { user } = useAuth();

  const renderContent = () => {
    // Si el usuario no es superadmin y trata de acceder a accounts, redirigir a divisiones
    if (activeSection === 'accounts' && user?.role?.nombre !== 'superadmin') {
      setActiveSection('divisiones');
      return <GruposSection userRole={user?.role?.nombre || ''} />;
    }

    // Si el usuario es adminaccount y trata de acceder al dashboard, redirigir a divisiones
    if (activeSection === 'dashboard' && user?.role?.nombre === 'adminaccount') {
      setActiveSection('divisiones');
      return <GruposSection userRole={user?.role?.nombre || ''} />;
    }

    switch (activeSection) {
      case 'accounts':
        return <AccountsSection />;
      case 'usuarios':
        return <UsuariosSection />;
      case 'activity':
        return <ActivitySection />;
                      case 'eventos':
        return <EventosSection />;
      case 'notificaciones':
        return <NotificationsSection />;
      case 'divisiones':
        return <GruposSection 
          userRole={user?.role?.nombre || ''} 
          onSectionChange={setActiveSection}
        />;
      case 'coordinadores':
        return <CoordinadoresSection userRole={user?.role?.nombre || ''} />;
      case 'tutores':
        return <TutoresSection userRole={user?.role?.nombre || ''} />;
      case 'asistencias':
        return <AsistenciasSection />;
      case 'alumnos':
        return <StudentsSection />;
      case 'pickup':
        return <PickupSection />;
      case 'dashboard':
      default:
        return <DashboardContent />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      
      <div className="flex-1 flex flex-col lg:ml-0">
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          currentSection={activeSection}
          onNotificationClick={() => setActiveSection('notificaciones')}
        />
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};