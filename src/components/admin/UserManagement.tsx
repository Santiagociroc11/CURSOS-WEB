
import React, { useState, useEffect } from 'react';
import supabase from '../../lib/supabase';
import { User } from '../../types/database';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Plus, Edit, Trash2 } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({
    full_name: '',
    email: '',
    role: 'student',
    password: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUser = async () => {
    // Note: Supabase Auth is not used here for simplicity.
    // In a real app, you'd use supabase.auth.admin.createUser etc.
    try {
      if (editingUser) {
        const { error } = await supabase
          .from('users')
          .update({ 
            full_name: formData.full_name, 
            email: formData.email, 
            role: formData.role 
          })
          .eq('id', editingUser.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('users').insert([formData as User]);
        if (error) throw error;
      }
      await fetchUsers();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    try {
      await supabase.from('users').delete().eq('id', userId);
      await fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ full_name: '', email: '', role: 'student', password: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({ full_name: user.full_name, email: user.email, role: user.role });
    setIsModalOpen(true);
  };

  if (loading) return <div className="text-center p-8">Cargando usuarios...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
        <Button onClick={openCreateModal}><Plus className="h-4 w-4 mr-2" />Nuevo Usuario</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de Creación</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.full_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{user.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEditModal(user)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="danger" size="sm" onClick={() => handleDeleteUser(user.id)}><Trash2 className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? 'Editar Usuario' : 'Crear Usuario'}>
        <div className="space-y-4">
          <Input label="Nombre Completo" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
          <Input label="Email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          {!editingUser && <Input label="Contraseña" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              value={formData.role}
              onChange={e => setFormData({...formData, role: e.target.value as 'admin' | 'student'})}
            >
              <option value="student">Estudiante</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveUser}>{editingUser ? 'Guardar Cambios' : 'Crear Usuario'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
