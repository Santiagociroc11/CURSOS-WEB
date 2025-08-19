
import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import supabase from '../../lib/supabase';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export const ProfilePage: React.FC = () => {
  const { userProfile, loading: authLoading } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    if (userProfile) {
      setFullName(userProfile.full_name);
      setAvatarUrl(userProfile.avatar_url || '');
    }
  }, [userProfile]);

  const handleUpdateProfile = async () => {
    if (!userProfile) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ full_name: fullName, avatar_url: avatarUrl })
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

  if (authLoading) {
    return <div className="text-center p-8">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Mi Perfil</h1>
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Información Personal</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Nombre Completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Input
            label="Email"
            value={userProfile?.email || ''}
            disabled
          />
          <Input
            label="URL del Avatar"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
          />
          <Button onClick={handleUpdateProfile} disabled={loading}>
            {loading ? 'Actualizando...' : 'Actualizar Perfil'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
