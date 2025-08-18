import React from 'react';
import { Menu, LogOut, User } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { userProfile, signOut } = useAuthContext();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="ml-4 text-xl font-semibold text-gray-900 lg:ml-0">
            {userProfile?.role === 'admin' ? 'Panel de Administración' : 'Campus Virtual'}
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center text-sm text-gray-600">
            <User className="h-4 w-4 mr-2" />
            {userProfile?.full_name}
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </header>
  );
};