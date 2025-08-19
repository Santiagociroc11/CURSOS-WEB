import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:ml-72 transition-all duration-300 ease-in-out">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="w-full h-full">
          <div className="animate-in fade-in duration-500 w-full h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};