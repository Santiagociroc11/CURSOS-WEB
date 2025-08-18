import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminPage } from './pages/AdminPage';
import { StudentPage } from './pages/StudentPage';
import { LoginForm } from './components/auth/LoginForm';

const AppRoutes: React.FC = () => {
  const { userProfile, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/student/*"
        element={
          <ProtectedRoute requiredRole="student">
            <StudentPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/"
        element={
          userProfile ? (
            <Navigate 
              to={userProfile.role === 'admin' ? '/admin' : '/student'} 
              replace 
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;