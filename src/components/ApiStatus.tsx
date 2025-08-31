import React, { useState, useEffect } from 'react';
import { apiClient, API_ENDPOINTS } from '../config/api';
import { Wifi, WifiOff, CheckCircle, XCircle } from 'lucide-react';

export const ApiStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get(API_ENDPOINTS.HEALTH);
        setIsConnected(response.status === 200);
      } catch (error) {
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkApiStatus();
    
    // Verificar cada 30 segundos
    const interval = setInterval(checkApiStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span>Verificando conexión...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
      {isConnected ? (
        <>
          <CheckCircle className="w-4 h-4" />
          <span>API Conectado</span>
        </>
      ) : (
        <>
          <XCircle className="w-4 h-4" />
          <span>API Desconectado</span>
        </>
      )}
    </div>
  );
}; 