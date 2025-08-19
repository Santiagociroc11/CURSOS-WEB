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
    <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100/50 px-6 py-4 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="p-3 rounded-2xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 lg:hidden transition-all duration-200 hover:scale-105"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-6 lg:ml-0">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {userProfile?.role === 'admin' ? 'Panel de Administración' : 'Campus Virtual'}
            </h1>
            <p className="text-sm text-gray-500 font-medium mt-0.5">
              Bienvenido de vuelta, {userProfile?.full_name?.split(' ')[0]}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* User Profile Card */}
          <div className="hidden md:flex items-center bg-gray-50/80 rounded-2xl px-4 py-2.5 border border-gray-200/50">
            <div className="w-8 h-8 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl flex items-center justify-center mr-3">
              <User className="h-4 w-4 text-gray-600" />
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900 leading-none">
                {userProfile?.full_name}
              </p>
              <p className="text-xs text-gray-500 capitalize mt-0.5">
                {userProfile?.role}
              </p>
            </div>
          </div>

          {/* Sign Out Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSignOut}
            className="px-4 py-2.5 rounded-2xl hover:bg-gray-100 transition-all duration-200 hover:scale-105 group"
          >
            <LogOut className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:rotate-12" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </Button>
        </div>
      </div>
    </header>
  );
};