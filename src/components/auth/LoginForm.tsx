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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    
    setResetLoading(true);
    setError('');

    try {
      const response = await fetch('/api/hotmart/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setError('✅ ¡Contraseña restablecida! Tu nueva contraseña es tu email.');
        setTimeout(() => {
          setShowForgotPassword(false);
          setResetEmail('');
        }, 2000);
      } else {
        setError(`❌ ${data.message || data.error}`);
      }
    } catch (err) {
      setError('❌ Error de conexión. Intenta nuevamente.');
    }

    setResetLoading(false);
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
            {!showForgotPassword && (
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
            )}

            {/* Forgot Password */}
            {showForgotPassword ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    🔑 Recuperar Contraseña
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Ingresa tu email y restableceremos tu contraseña
                  </p>
                </div>

                <Input
                  label="Email de tu cuenta"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="tu@empresa.com"
                  required
                />

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                  isLoading={resetLoading}
                  disabled={!resetEmail}
                >
                  Restablecer Contraseña
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetEmail('');
                    setError('');
                  }}
                  className="w-full text-gray-600 hover:text-gray-800 text-sm underline"
                >
                  ← Volver al login
                </button>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                  <p className="text-xs text-blue-700">
                    💡 Después del restablecimiento, tu nueva contraseña será tu email.
                    Podrás cambiarla desde tu perfil una vez que ingreses.
                  </p>
                </div>
              </form>
            ) : (
              <>
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

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(true);
                          setError('');
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm underline"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                  </form>
                )}
              </>
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