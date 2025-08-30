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

  // Cargar usuario inicial
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = AuthService.getToken();
        if (token) {
          // Verificar si el token es válido obteniendo el perfil
          const profile = await AuthService.getProfile();
          setUser(profile);
        }
      } catch (error) {
        // Token inválido, limpiar localStorage
        AuthService.logout();
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
      setUser(response.user);
      return true;
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