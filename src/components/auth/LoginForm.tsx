import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';
import supabase from '../../lib/supabase';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuthContext();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error: signInError } = await signIn(email, password);
    
    if (signInError) {
      setError(signInError.message || 'Error al iniciar sesión');
    } else {
      // Navegar según el rol del usuario
      if (data?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/student', { replace: true });
      }
    }
    
    setLoading(false);
  };

  const testConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (error) {
        setError(`Error de conexión: ${error.message}`);
      } else {
        setError('✅ Conexión a base de datos exitosa');
      }
    } catch (err) {
      setError(`Error inesperado: ${err}`);
    }
  };

  const fillAdminCredentials = () => {
    setEmail('admin@eduplatform.com');
    setPassword('admin123');
  };

  const fillStudentCredentials = () => {
    setEmail('estudiante@eduplatform.com');
    setPassword('student123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <GraduationCap className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Iniciar Sesión</h2>
            <p className="text-gray-600 mt-2">Accede a tu campus virtual</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
            
            <div className="relative">
              <Input
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              isLoading={loading}
            >
              Iniciar Sesión
            </Button>
          </form>

          {/* Test Connection Button */}
          <div className="mt-4">
            <Button
              type="button"
              onClick={testConnection}
              className="w-full bg-gray-600 hover:bg-gray-700"
            >
              🧪 Probar Conexión BD
            </Button>
          </div>

          {/* Demo accounts */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center mb-4">Cuentas de demostración:</p>
            <div className="space-y-2">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    <p className="font-medium">Administrador:</p>
                    <p>admin@eduplatform.com</p>
                  </div>
                  <Button
                    type="button"
                    onClick={fillAdminCredentials}
                    className="text-xs px-2 py-1 h-auto"
                  >
                    Usar
                  </Button>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    <p className="font-medium">Estudiante:</p>
                    <p>estudiante@eduplatform.com</p>
                  </div>
                  <Button
                    type="button"
                    onClick={fillStudentCredentials}
                    className="text-xs px-2 py-1 h-auto"
                  >
                    Usar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};