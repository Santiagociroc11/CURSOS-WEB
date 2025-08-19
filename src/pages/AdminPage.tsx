import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { CourseManagement } from '../components/admin/CourseManagement';
import { CourseEditor } from '../components/admin/CourseEditor';
import { UserManagement } from '../components/admin/UserManagement';
import { ProfilePage } from './ProfilePage';
import { QuestionManager } from '../components/admin/QuestionManager';
import { CertificateManagement } from '../components/admin/CertificateManagement';

export const AdminPage: React.FC = () => {
  return (
    <Layout>
      <Routes>
        <Route index element={<AdminDashboard />} />
        <Route path="courses" element={<CourseManagement />} />
        <Route path="courses/:courseId" element={<CourseEditor />} />
        <Route path="assessments/:assessmentId/questions" element={<QuestionManager />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="certificates" element={<CertificateManagement />} />
        <Route path="profile" element={<ProfilePage />} />
      </Routes>
    </Layout>
  );
};