import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { CourseManagement } from '../components/admin/CourseManagement';

export const AdminPage: React.FC = () => {
  return (
    <Layout>
      <Routes>
        <Route index element={<AdminDashboard />} />
        <Route path="courses" element={<CourseManagement />} />
        <Route path="users" element={<div>Gestión de Usuarios (Próximamente)</div>} />
        <Route path="certificates" element={<div>Gestión de Certificados (Próximamente)</div>} />
        <Route path="settings" element={<div>Configuración (Próximamente)</div>} />
      </Routes>
    </Layout>
  );
};