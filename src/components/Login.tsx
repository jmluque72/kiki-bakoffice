import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import { ForgotPasswordModal } from './ForgotPasswordModal';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { login, isLoading, error: authError } = useAuth();

  // Limpiar error cuando el usuario empiece a escribir
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (authError) {
      // Limpiar error al escribir
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (authError) {
      // Limpiar error al escribir
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!email || !password) {
      return;
    }

    // Evitar múltiples envíos mientras está cargando
    if (isLoading) {
      return;
    }

    const success = await login(email, password);
    
    // Si el login falla, no hacer nada más (no redirigir)
    if (!success) {
      // El error ya se maneja en el hook useAuth y se muestra en el UI
      return;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        {/* Logo Kiki arriba */}
        <div className="flex justify-center mb-8">
          <img 
            src="/kiki_splash.png" 
            alt="Kiki Logo" 
            className="h-40 w-auto"
          />
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Bienvenido a KIKI</h1>
          <p className="text-gray-600">Inicia sesión para continuar</p>
        </div>

        {authError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700 text-sm">{authError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="tu@email.com"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Tu contraseña"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              disabled={isLoading}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </form>
      </div>

      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onBackToLogin={() => setShowForgotPassword(false)}
      />
    </div>
  );
};