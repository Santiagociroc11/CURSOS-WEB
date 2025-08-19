import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { EnhancedCourseManagement } from '../components/admin/EnhancedCourseManagement';
import { EnhancedCourseEditor } from '../components/admin/EnhancedCourseEditor';
import { UserManagement } from '../components/admin/UserManagement';
import { EnrollmentManagement } from '../components/admin/EnrollmentManagement';
import { AssessmentManagement } from '../components/admin/AssessmentManagement';
import { ProfilePage } from './ProfilePage';
import { QuestionManager } from '../components/admin/QuestionManager';
import { CertificateManagement } from '../components/admin/CertificateManagement';

// Updated to use enhanced components
export const AdminPage: React.FC = () => {
  return (
    <Layout>
      <Routes>
        <Route index element={<AdminDashboard />} />
        <Route path="courses" element={<EnhancedCourseManagement />} />
        <Route path="courses/:courseId" element={<EnhancedCourseEditor />} />
        <Route path="assessments" element={<AssessmentManagement />} />
        <Route path="assessments/:assessmentId/questions" element={<QuestionManager />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="enrollments" element={<EnrollmentManagement />} />
        <Route path="certificates" element={<CertificateManagement />} />
        <Route path="profile" element={<ProfilePage />} />
      </Routes>
    </Layout>
  );
};