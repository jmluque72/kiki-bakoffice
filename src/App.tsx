import React from 'react';
import { AuthProvider } from './contexts/AuthProvider';
import { useAuth } from './hooks/useAuth';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { useTokenRefresh } from './hooks/useTokenRefresh';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  
  // Activar refresh automático del token
  useTokenRefresh();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return user ? <Dashboard /> : <Login />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;