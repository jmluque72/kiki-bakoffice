import { useState, useEffect, createContext, useContext } from 'react';
import { AuthService } from '../services/authService';
import { User } from '../config/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthProvider = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para validar si el usuario tiene acceso al backoffice
  const validateBackofficeAccess = (user: User): boolean => {
    const allowedRoles = ['superadmin', 'adminaccount'];
    const userRole = user.role?.nombre || user.role;
    
    console.log('🔍 [useAuth] Validando acceso al backoffice...');
    console.log('🔍 [useAuth] Rol del usuario:', userRole);
    console.log('🔍 [useAuth] Roles permitidos:', allowedRoles);
    
    const hasAccess = allowedRoles.includes(userRole);
    console.log('🔍 [useAuth] ¿Tiene acceso?', hasAccess);
    
    return hasAccess;
  };

  // Cargar usuario inicial
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = AuthService.getToken();
        console.log('🔍 [useAuth] Token encontrado:', !!token);
        if (token) {
          // Verificar si el token es válido obteniendo el perfil
          console.log('🔍 [useAuth] Obteniendo perfil...');
          const profile = await AuthService.getProfile();
          console.log('🔍 [useAuth] Perfil obtenido:', profile);
          
          // Validar acceso al backoffice
          if (validateBackofficeAccess(profile)) {
            setUser(profile);
            console.log('✅ [useAuth] Usuario autorizado para el backoffice');
          } else {
            console.log('❌ [useAuth] Usuario no autorizado para el backoffice');
            setError('No tienes permisos para acceder al backoffice. Solo usuarios con rol superadmin o adminaccount pueden acceder.');
            AuthService.logout();
          }
        }
      } catch (error) {
        console.error('❌ [useAuth] Error obteniendo perfil:', error);
        
        // Fallback: intentar cargar usuario desde localStorage
        try {
          const savedUser = localStorage.getItem('backoffice_user');
          if (savedUser) {
            const userData = JSON.parse(savedUser);
            console.log('🔍 [useAuth] Usuario desde localStorage:', userData);
            
            // Validar acceso al backoffice también para usuarios guardados
            if (validateBackofficeAccess(userData)) {
              setUser(userData);
            } else {
              console.log('❌ [useAuth] Usuario guardado no autorizado para el backoffice');
              setError('No tienes permisos para acceder al backoffice. Solo usuarios con rol superadmin o adminaccount pueden acceder.');
              AuthService.logout();
            }
          } else {
            // Token inválido, limpiar localStorage
            AuthService.logout();
          }
        } catch (localError) {
          console.error('❌ [useAuth] Error cargando usuario desde localStorage:', localError);
          AuthService.logout();
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await AuthService.login({ email, password });
      
      // Validar acceso al backoffice después del login
      if (validateBackofficeAccess(response.user)) {
        setUser(response.user);
        console.log('✅ [useAuth] Login exitoso con acceso autorizado al backoffice');
        return true;
      } else {
        console.log('❌ [useAuth] Login exitoso pero sin acceso al backoffice');
        setError('No tienes permisos para acceder al backoffice. Solo usuarios con rol superadmin o adminaccount pueden acceder.');
        AuthService.logout();
        return false;
      }
    } catch (error: any) {
      setError(error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
    setError(null);
  };

  return {
    user,
    login,
    logout,
    isLoading,
    error
  };
};

export { AuthContext };