import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { StudentDashboard } from '../components/student/StudentDashboard';
import { CoursePlayer } from '../components/student/CoursePlayer';
import { ProfilePage } from './ProfilePage';
import { AssessmentPlayer } from '../components/student/AssessmentPlayer';
import { StudentCertificates } from '../components/student/StudentCertificates';
import { StudentProgress } from '../components/student/StudentProgress';

export const StudentPage: React.FC = () => {
  return (
    <Layout>
      <Routes>
        <Route index element={<StudentDashboard />} />
        <Route path="courses/:courseId" element={<CoursePlayer />} />
        <Route path="assessments/:assessmentId" element={<AssessmentPlayer />} />
        <Route path="progress" element={<StudentProgress />} />
        <Route path="certificates" element={<StudentCertificates />} />
        <Route path="profile" element={<ProfilePage />} />
      </Routes>
    </Layout>
  );
};