import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { GraduationCap, Eye, EyeOff, Zap } from 'lucide-react';
import supabase from '../../lib/supabase';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isQuickLogin, setIsQuickLogin] = useState(true);
  const { signIn } = useAuthContext();
  const navigate = useNavigate();

  const handleQuickLogin = async () => {
    if (!email) return;
    setLoading(true);
    setError('');

    const { data, error: signInError } = await signIn(email, email);
    
    if (signInError) {
      if (signInError.message?.includes('not found')) {
        setError('❌ Email no encontrado. Verifica que esté bien escrito.');
      } else {
        setError('❌ No se pudo acceder. Intenta con el login completo.');
      }
    } else {
      setError('✅ ¡Acceso exitoso!');
      setTimeout(() => {
        if (data?.role === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/student', { replace: true });
        }
      }, 800);
    }
    
    setLoading(false);
  };

  const handleFullLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error: signInError } = await signIn(email, password);
    
    if (signInError) {
      if (signInError.message?.includes('not found')) {
        setError('❌ Email no encontrado.');
      } else {
        setError('❌ Email o contraseña incorrectos.');
      }
    } else {
      setError('✅ ¡Acceso exitoso!');
      setTimeout(() => {
        if (data?.role === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/student', { replace: true });
        }
      }, 800);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center text-white">
            <div className="flex justify-center mb-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <GraduationCap className="h-8 w-8" />
              </div>
            </div>
            <h2 className="text-2xl font-bold">Campus Virtual</h2>
            <p className="text-blue-100 mt-2">Accede a tu plataforma de aprendizaje</p>
          </div>

          {/* Toggle Buttons */}
          <div className="p-6 pb-4">
            <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
              <button
                type="button"
                onClick={() => setIsQuickLogin(true)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  isQuickLogin
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ⚡ Acceso Rápido
              </button>
              <button
                type="button"
                onClick={() => setIsQuickLogin(false)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  !isQuickLogin
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🔐 Login Completo
              </button>
            </div>

            {/* Quick Login */}
            {isQuickLogin ? (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-gray-600 text-sm">
                    Solo necesitas tu email para ingresar
                  </p>
                </div>
                
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@empresa.com"
                  required
                />

                <Button
                  type="button"
                  onClick={handleQuickLogin}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  isLoading={loading}
                  disabled={!email}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Ingresar Rápido
                </Button>
                
                <p className="text-xs text-gray-500 text-center">
                  Para nuevos usuarios: se usará tu email como contraseña
                </p>
              </div>
            ) : (
              /* Full Login */
              <form onSubmit={handleFullLogin} className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-gray-600 text-sm">
                    Ingresa con email y contraseña personalizada
                  </p>
                </div>

                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@empresa.com"
                  required
                />
                
                <div className="relative">
                  <Input
                    label="Contraseña"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tu contraseña personalizada"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  isLoading={loading}
                >
                  Iniciar Sesión
                </Button>
              </form>
            )}

            {/* Error Message */}
            {error && (
              <div className={`mt-4 border rounded-lg p-3 text-center ${
                error.includes('✅') 
                  ? 'bg-green-50 border-green-200 text-green-700' 
                  : 'bg-red-50 border-red-200 text-red-600'
              }`}>
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};