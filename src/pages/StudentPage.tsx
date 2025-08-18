import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { StudentDashboard } from '../components/student/StudentDashboard';
import { CoursePlayer } from '../components/student/CoursePlayer';

export const StudentPage: React.FC = () => {
  return (
    <Layout>
      <Routes>
        <Route index element={<StudentDashboard />} />
        <Route path="course/:courseId" element={<CoursePlayer />} />
        <Route path="progress" element={<div>Progreso Detallado (Próximamente)</div>} />
        <Route path="certificates" element={<div>Mis Certificados (Próximamente)</div>} />
        <Route path="profile" element={<div>Mi Perfil (Próximamente)</div>} />
      </Routes>
    </Layout>
  );
};