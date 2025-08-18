import React, { useState } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuthContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: signInError } = await signIn(email, password);
    
    if (signInError) {
      setError('Credenciales inválidas. Por favor, verifica tu email y contraseña.');
    }
    
    setLoading(false);
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

          {/* Demo accounts */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center mb-4">Cuentas de demostración:</p>
            <div className="space-y-2 text-xs text-gray-500">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium">Administrador:</p>
                <p>Email: admin@eduplatform.com</p>
                <p>Contraseña: admin123</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium">Estudiante:</p>
                <p>Email: estudiante@eduplatform.com</p>
                <p>Contraseña: student123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};