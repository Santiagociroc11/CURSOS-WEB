import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BookOpen, 
  Users, 
  BarChart3, 
  Settings, 
  GraduationCap,
  Library,
  Award,
  User,
  UserCheck,
  FileCheck
} from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { userProfile, isAdmin } = useAuthContext();
  const location = useLocation();

  const adminNavItems = [
    { icon: BarChart3, label: 'Dashboard', href: '/admin' },
    { icon: BookOpen, label: 'Cursos', href: '/admin/courses' },
    { icon: Users, label: 'Usuarios', href: '/admin/users' },
    { icon: UserCheck, label: 'Inscripciones', href: '/admin/enrollments' },
    { icon: FileCheck, label: 'Evaluaciones', href: '/admin/assessments' },
    { icon: Award, label: 'Certificados', href: '/admin/certificates' },
    { icon: User, label: 'Perfil', href: '/admin/profile' },
  ];

  const studentNavItems = [
    { icon: Library, label: 'Mis Cursos', href: '/student' },
    { icon: GraduationCap, label: 'Progreso', href: '/student/progress' },
    { icon: Award, label: 'Certificados', href: '/student/certificates' },
    { icon: User, label: 'Perfil', href: '/student/profile' },
  ];

  const navItems = isAdmin ? adminNavItems : studentNavItems;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" 
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 z-50 h-full w-72 bg-white/95 backdrop-blur-xl border-r border-gray-200/50 
        shadow-2xl shadow-gray-900/10 transform transition-all duration-500 ease-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:h-screen
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-8 border-b border-gray-100/50">
            <div className="flex items-center group">
              <div className="relative">
                <GraduationCap className="h-10 w-10 text-gray-800 transition-transform duration-300 group-hover:scale-110" />
                <div className="absolute -inset-1 bg-gradient-to-r from-gray-600 to-gray-400 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur"></div>
              </div>
              <div className="ml-4">
                <span className="text-2xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  EduPlatform
                </span>
                <div className="text-xs font-medium text-gray-500 mt-0.5 tracking-wider uppercase">
                  Campus Virtual
                </div>
              </div>
            </div>
          </div>

          {/* User info */}
          <div className="p-6 border-b border-gray-100/50">
            <div className="flex items-center group cursor-pointer">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:scale-105">
                  <User className="h-6 w-6 text-gray-700" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gray-800 rounded-full border-2 border-white"></div>
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{userProfile?.full_name}</p>
                <div className="flex items-center mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                    {userProfile?.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-6 space-y-3 overflow-y-auto">
            {navItems.map((item, index) => {
              const isActive = location.pathname === item.href || 
                (item.href !== '/admin' && item.href !== '/student' && location.pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`
                    group flex items-center px-4 py-3.5 rounded-2xl text-sm font-semibold 
                    transition-all duration-300 ease-out transform hover:scale-[1.02]
                    ${isActive 
                      ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/25' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/80 hover:shadow-md'
                    }
                  `}
                  onClick={onClose}
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300
                    ${isActive 
                      ? 'bg-white/20 text-white' 
                      : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200 group-hover:scale-110'
                    }
                  `}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="ml-4 tracking-wide">{item.label}</span>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
};