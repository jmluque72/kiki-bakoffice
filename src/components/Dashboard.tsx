import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { DashboardContent } from './DashboardContent';
import { AccountsSection } from './sections/AccountsSection';
import { UsuariosSection } from './sections/UsuariosSection';
import { ActivitySection } from './sections/ActivitySection';
import { EventosSection } from './sections/EventosSection';
import { NotificationsSection } from './sections/NotificationsSection';
import { PendingNotificationsSection } from './sections/PendingNotificationsSection';
import PickupSection from './sections/PickupSection';

import GruposSection from './sections/GruposSection';
import { AsistenciasSection } from './sections/AsistenciasSection';
import { StudentsSection } from './sections/StudentsSection';
import CoordinadoresSection from './sections/CoordinadoresSection';
import TutoresSection from './sections/TutoresSection';
import { DocumentsSection } from './sections/DocumentsSection';
import { StudentActionsSection } from './sections/StudentActionsSection';
import { FormulariosSection } from './sections/FormulariosSection';
import { PushNotificationsSection } from './sections/PushNotificationsSection';
import { LoginStatsSection } from './sections/LoginStatsSection';
import { NotificationTemplatesSection } from './sections/NotificationTemplatesSection';
import { useAuth } from '../hooks/useAuth';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role?.nombre === 'superadmin';
  // Superadmin inicia en accounts, otros usuarios en dashboard
  const [activeSection, setActiveSection] = useState(isSuperAdmin ? 'accounts' : 'dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    const userRole = user?.role?.nombre || '';
    const isSuperAdmin = userRole === 'superadmin';
    
    // Si el usuario no es superadmin y trata de acceder a accounts, redirigir a divisiones
    if (activeSection === 'accounts' && !isSuperAdmin) {
      setActiveSection('divisiones');
      return <GruposSection userRole={userRole} />;
    }

    // Si el usuario no es adminaccount ni superadmin y trata de acceder a documentos, redirigir a divisiones
    if (activeSection === 'documentos' && userRole !== 'adminaccount' && !isSuperAdmin) {
      setActiveSection('divisiones');
      return <GruposSection userRole={userRole} />;
    }

    // Si el usuario es adminaccount y trata de acceder al dashboard, redirigir a divisiones
    if (activeSection === 'dashboard' && userRole === 'adminaccount') {
      setActiveSection('divisiones');
      return <GruposSection userRole={userRole} />;
    }

    // Pasar isReadonly a todas las secciones cuando es superadmin
    // Superadmin tiene permisos completos (isReadonly=false), otros roles pueden tener restricciones
    switch (activeSection) {
      case 'accounts':
        return <AccountsSection isReadonly={false} />; // Superadmin puede crear y editar instituciones
      case 'usuarios':
        return <UsuariosSection isReadonly={isSuperAdmin} />;
      case 'activity':
        return <ActivitySection isReadonly={isSuperAdmin} />;
      case 'eventos':
        return <EventosSection isReadonly={isSuperAdmin} />;
      case 'notificaciones':
        return <NotificationsSection isReadonly={isSuperAdmin} />;
      case 'notificaciones-pendientes':
        return <PendingNotificationsSection isReadonly={isSuperAdmin} />;
      case 'divisiones':
        return <GruposSection 
          userRole={user?.role?.nombre || ''} 
          onSectionChange={setActiveSection}
          isReadonly={isSuperAdmin}
        />;
      case 'coordinadores':
        return <CoordinadoresSection userRole={user?.role?.nombre || ''} isReadonly={isSuperAdmin} />;
      case 'tutores':
        return <TutoresSection userRole={user?.role?.nombre || ''} isReadonly={isSuperAdmin} />;
      case 'asistencias':
        return <AsistenciasSection isReadonly={isSuperAdmin} />;
      case 'acciones-diarias':
        return <StudentActionsSection isReadonly={isSuperAdmin} />;
      case 'alumnos':
        return <StudentsSection isReadonly={isSuperAdmin} />;
      case 'pickup':
        return <PickupSection isReadonly={isSuperAdmin} />;
      case 'formularios':
        return <FormulariosSection isReadonly={isSuperAdmin} />;
      case 'documentos':
        return <DocumentsSection isReadonly={isSuperAdmin} />;
      case 'push-notifications':
        return <PushNotificationsSection isReadonly={isSuperAdmin} />;
      case 'login-stats':
        return <LoginStatsSection />;
      case 'notification-templates':
        return <NotificationTemplatesSection isReadonly={isSuperAdmin} />;
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
        />
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};