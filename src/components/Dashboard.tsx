import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { DashboardContent } from './DashboardContent';
import { AccountsSection } from './sections/AccountsSection';
import { UsuariosSection } from './sections/UsuariosSection';
import { ActivitySection } from './sections/ActivitySection';
import { EventosSection } from './sections/EventosSection';
import { AprobacionesSection } from './sections/AprobacionesSection';
import { DivisionesSection } from './sections/DivisionesSection';

export const Dashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');

  const renderContent = () => {
    switch (activeSection) {
      case 'accounts':
        return <AccountsSection />;
      case 'usuarios':
        return <UsuariosSection />;
      case 'activity':
        return <ActivitySection />;
      case 'eventos':
        return <EventosSection />;
      case 'aprobaciones':
        return <AprobacionesSection />;
      case 'divisiones':
        return <DivisionesSection />;
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