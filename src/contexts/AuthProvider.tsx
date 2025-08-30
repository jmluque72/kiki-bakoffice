import React, { ReactNode } from 'react';
import { AuthContext, useAuthProvider, useAuth } from '../hooks/useAuth';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuthProvider();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

export { useAuth };