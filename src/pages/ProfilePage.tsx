
import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import supabase from '../lib/supabase';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Eye, EyeOff, Lock, Save, User } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { userProfile, loading: authLoading } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [phone, setPhone] = useState('');
  
  // Estados para contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFullName(userProfile.full_name);
      setAvatarUrl(userProfile.avatar_url || '');
      setPhone(userProfile.phone || '');
      // Cargar contraseña actual para mostrarla
      loadCurrentPassword();
    }
  }, [userProfile]);

  const loadCurrentPassword = async () => {
    if (!userProfile) return;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('password')
        .eq('id', userProfile.id)
        .single();
      
      if (error) throw error;
      setCurrentPassword(data.password || '');
    } catch (error) {
      console.error('Error loading current password:', error);
    }
  };

  const handleUpdateProfile = async () => {
    if (!userProfile) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          full_name: fullName, 
          avatar_url: avatarUrl,
          phone: phone
        })
        .eq('id', userProfile.id);
      if (error) throw error;
      alert('Perfil actualizado exitosamente');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!userProfile) return;
    
    // Validaciones
    if (!newPassword || newPassword.length < 6) {
      alert('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    
    setPasswordLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ password: newPassword })
        .eq('id', userProfile.id);
        
      if (error) throw error;
      
      // Actualizar contraseña actual mostrada
      setCurrentPassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      alert('Contraseña actualizada exitosamente');
    } catch (error) {
      console.error('Error updating password:', error);
      alert('Error al actualizar la contraseña');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (authLoading) {
    return <div className="text-center p-8">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <User className="h-8 w-8 text-gray-600" />
        <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
      </div>
      
      {/* Información Personal */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold flex items-center">
            <User className="h-5 w-5 mr-2" />
            Información Personal
          </h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Nombre Completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Tu nombre completo"
          />
          <Input
            label="Email"
            value={userProfile?.email || ''}
            disabled
            className="bg-gray-50"
          />
          <Input
            label="Teléfono"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1234567890"
          />
          <Input
            label="URL del Avatar"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://ejemplo.com/avatar.jpg"
          />
          <div className="pt-2">
            <Button onClick={handleUpdateProfile} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Actualizando...' : 'Actualizar Perfil'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Seguridad y Contraseña */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold flex items-center">
            <Lock className="h-5 w-5 mr-2" />
            Seguridad y Contraseña
          </h2>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Contraseña Actual */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña Actual
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 pr-10"
                placeholder="Tu contraseña actual"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cambiar Contraseña</h3>
            <div className="space-y-4">
              {/* Nueva Contraseña */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirmar Contraseña */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Repite la nueva contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  onClick={handleChangePassword} 
                  disabled={passwordLoading || !newPassword || !confirmPassword}
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  {passwordLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
