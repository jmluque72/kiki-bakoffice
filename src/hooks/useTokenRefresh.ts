import { useEffect, useRef } from 'react';
import RefreshTokenService from '../services/refreshTokenService';

/**
 * Hook para manejar el refresh automático del token
 * Verifica periódicamente si el token está por expirar y lo renueva automáticamente
 */
export const useTokenRefresh = () => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Función para verificar y renovar el token si es necesario
    const checkAndRefreshToken = async () => {
      // Solo proceder si hay tokens válidos
      if (!RefreshTokenService.hasValidTokens()) {
        console.log('⏭️ [TOKEN REFRESH] No hay tokens válidos, omitiendo refresh');
        return;
      }

      // Verificar si el token está próximo a expirar (menos de 2 minutos)
      if (RefreshTokenService.isTokenExpiringSoon(2)) {
        const minutesLeft = RefreshTokenService.getMinutesUntilExpiration();
        console.log(`🔄 [TOKEN REFRESH] Token próximo a expirar (${minutesLeft} min restantes), renovando...`);
        
        try {
          const newToken = await RefreshTokenService.refreshAccessToken();
          if (newToken) {
            console.log('✅ [TOKEN REFRESH] Token renovado exitosamente');
          } else {
            console.warn('⚠️ [TOKEN REFRESH] No se pudo renovar el token');
          }
        } catch (error) {
          console.error('❌ [TOKEN REFRESH] Error renovando token:', error);
        }
      } else {
        const minutesLeft = RefreshTokenService.getMinutesUntilExpiration();
        if (minutesLeft > 0) {
          console.log(`✅ [TOKEN REFRESH] Token válido (${minutesLeft} min restantes)`);
        }
      }
    };

    // Ejecutar inmediatamente al montar
    checkAndRefreshToken();

    // Configurar intervalo para verificar cada 30 segundos
    intervalRef.current = setInterval(() => {
      checkAndRefreshToken();
    }, 30000); // 30 segundos

    // Limpiar intervalo al desmontar
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []); // Solo ejecutar una vez al montar

  return null;
};

