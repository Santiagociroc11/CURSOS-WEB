import { useState, useEffect } from 'react';
import supabase from '../lib/supabase';
import { PublicUser } from '../types/database';

export const useAuth = () => {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('auth_user');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, role, avatar_url, created_at, updated_at')
        .eq('email', email)
        .eq('password', password)
        .single();

      if (error) {
        return { 
          data: null, 
          error: { message: `Error de base de datos: ${error.message}` } 
        };
      }

      if (!data) {
        return { 
          data: null, 
          error: { message: 'Credenciales inválidas' } 
        };
      }

      // Store user in localStorage and state
      localStorage.setItem('auth_user', JSON.stringify(data));
      setUser(data);
      return { data, error: null };
    } catch (error) {

      return { 
        data: null, 
        error: { message: `Error de conexión: ${error}` } 
      };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'admin' | 'student' = 'student') => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            email,
            password,
            full_name: fullName,
            role,
          },
        ])
        .select('id, email, full_name, role, avatar_url, created_at, updated_at')
        .single();

      if (error) {
        return { 
          data: null, 
          error: { message: 'Error al crear usuario' } 
        };
      }

      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: { message: 'Error de conexión' } 
      };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('auth_user');
    setUser(null);
    return { error: null };
  };

  return {
    user,
    userProfile: user, // For compatibility
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin: user?.role === 'admin',
    isStudent: user?.role === 'student',
  };
};