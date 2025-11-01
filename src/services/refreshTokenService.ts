// Servicio para manejar refresh tokens en el backoffice
class RefreshTokenService {
  private static readonly STORAGE_KEYS = {
    ACCESS_TOKEN: 'kiki_access_token',
    REFRESH_TOKEN: 'kiki_refresh_token',
    TOKEN_EXPIRES_IN: 'kiki_token_expires_in',
    TOKEN_EXPIRES_AT: 'kiki_token_expires_at'
  };

  /**
   * Guarda los tokens en localStorage
   */
  static saveTokens(tokens: {
    accessToken: string;
    refreshToken: string;
    tokenExpiresIn: number;
    expiresAt?: number;
  }): void {
    try {
      const expiresAt = tokens.expiresAt || (Date.now() + tokens.tokenExpiresIn * 1000);
      
      localStorage.setItem(this.STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
      localStorage.setItem(this.STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
      localStorage.setItem(this.STORAGE_KEYS.TOKEN_EXPIRES_IN, tokens.tokenExpiresIn.toString());
      localStorage.setItem(this.STORAGE_KEYS.TOKEN_EXPIRES_AT, expiresAt.toString());
      
      console.log('💾 [REFRESH TOKEN] Tokens guardados en localStorage');
    } catch (error) {
      console.error('❌ [REFRESH TOKEN] Error guardando tokens:', error);
    }
  }

  /**
   * Obtiene el access token actual
   */
  static getAccessToken(): string | null {
    return localStorage.getItem(this.STORAGE_KEYS.ACCESS_TOKEN);
  }

  /**
   * Obtiene el refresh token
   */
  static getRefreshToken(): string | null {
    return localStorage.getItem(this.STORAGE_KEYS.REFRESH_TOKEN);
  }

  /**
   * Verifica si el access token está próximo a expirar
   */
  static isTokenExpiringSoon(thresholdMinutes: number = 2): boolean {
    const expiresAt = localStorage.getItem(this.STORAGE_KEYS.TOKEN_EXPIRES_AT);
    if (!expiresAt) return true;
    
    const expirationTime = parseInt(expiresAt);
    const now = Date.now();
    const thresholdMs = thresholdMinutes * 60 * 1000;
    
    return (expirationTime - now) <= thresholdMs;
  }

  /**
   * Renueva el access token usando el refresh token
   */
  static async refreshAccessToken(): Promise<string | null> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        console.log('❌ [REFRESH TOKEN] No hay refresh token disponible');
        return null;
      }

      console.log('🔄 [REFRESH TOKEN] Renovando access token...');
      
      // Obtener la URL base del API desde la configuración
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
        (import.meta.env.DEV ? 'http://localhost:3000' : 'https://api.kiki.com.ar');
      
      const response = await fetch(`${apiBaseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) {
        console.error('❌ [REFRESH TOKEN] Error en refresh:', response.status);
        return null;
      }

      const data = await response.json();
      
      if (data.success && data.data.accessToken) {
        // Guardar el nuevo access token
        localStorage.setItem(this.STORAGE_KEYS.ACCESS_TOKEN, data.data.accessToken);
        localStorage.setItem(this.STORAGE_KEYS.TOKEN_EXPIRES_IN, data.data.tokenExpiresIn.toString());
        localStorage.setItem(this.STORAGE_KEYS.TOKEN_EXPIRES_AT, (Date.now() + data.data.tokenExpiresIn * 1000).toString());
        
        console.log('✅ [REFRESH TOKEN] Access token renovado exitosamente');
        return data.data.accessToken;
      } else {
        console.error('❌ [REFRESH TOKEN] Respuesta inválida del servidor');
        return null;
      }
    } catch (error) {
      console.error('❌ [REFRESH TOKEN] Error renovando token:', error);
      return null;
    }
  }

  /**
   * Revoca el refresh token en el servidor
   */
  static async revokeRefreshToken(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) return true;

      console.log('🔒 [REFRESH TOKEN] Revocando refresh token...');
      
      // Obtener la URL base del API desde la configuración
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
        (import.meta.env.DEV ? 'http://localhost:3000' : 'https://api.kiki.com.ar');
      
      const response = await fetch(`${apiBaseUrl}/auth/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken })
      });

      console.log('✅ [REFRESH TOKEN] Refresh token revocado');
      return true;
    } catch (error) {
      console.error('❌ [REFRESH TOKEN] Error revocando token:', error);
      return false;
    }
  }

  /**
   * Limpia todos los tokens del localStorage
   */
  static clearTokens(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(this.STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(this.STORAGE_KEYS.TOKEN_EXPIRES_IN);
      localStorage.removeItem(this.STORAGE_KEYS.TOKEN_EXPIRES_AT);
      
      console.log('🧹 [REFRESH TOKEN] Tokens limpiados del localStorage');
    } catch (error) {
      console.error('❌ [REFRESH TOKEN] Error limpiando tokens:', error);
    }
  }

  /**
   * Verifica si hay tokens válidos
   */
  static hasValidTokens(): boolean {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    return !!(accessToken && refreshToken);
  }

  /**
   * Verifica si el token aún no ha expirado
   */
  static isTokenValid(): boolean {
    const expiresAt = localStorage.getItem(this.STORAGE_KEYS.TOKEN_EXPIRES_AT);
    if (!expiresAt) return false;
    
    const expirationTime = parseInt(expiresAt);
    return Date.now() < expirationTime;
  }

  /**
   * Obtiene los minutos restantes hasta la expiración
   */
  static getMinutesUntilExpiration(): number {
    const expiresAt = localStorage.getItem(this.STORAGE_KEYS.TOKEN_EXPIRES_AT);
    if (!expiresAt) return 0;
    
    const expirationTime = parseInt(expiresAt);
    const now = Date.now();
    const diffMs = expirationTime - now;
    return Math.max(0, Math.floor(diffMs / 60000)); // Convertir a minutos
  }
}

export default RefreshTokenService;
