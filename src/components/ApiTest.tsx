import React, { useState, useEffect } from 'react';
import { apiClient, API_ENDPOINTS } from '../config/api';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

export const ApiTest: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiUrl, setApiUrl] = useState<string>('');

  useEffect(() => {
    const testConnection = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Obtener la URL del API desde la configuración
        const baseURL = apiClient.defaults.baseURL;
        setApiUrl(baseURL || 'No configurado');
        
        // Probar la conexión
        const response = await apiClient.get(API_ENDPOINTS.HEALTH);
        
        if (response.status === 200) {
          setIsConnected(true);
        } else {
          setIsConnected(false);
          setError(`Status: ${response.status}`);
        }
      } catch (error: any) {
        setIsConnected(false);
        setError(error.message || 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Prueba de Conexión API</h2>
      
      <div className="space-y-4">
        <div>
          <span className="font-medium">URL del API:</span>
          <span className="ml-2 text-gray-600">{apiUrl}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="font-medium">Estado:</span>
          {isLoading ? (
            <div className="flex items-center gap-2 text-blue-600">
              <Loader className="w-4 h-4 animate-spin" />
              <span>Verificando...</span>
            </div>
          ) : isConnected ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>Conectado</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="w-4 h-4" />
              <span>Desconectado</span>
            </div>
          )}
        </div>
        
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}
        
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Probar de nuevo
        </button>
      </div>
    </div>
  );
}; 