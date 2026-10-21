import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import PlannerDashboard from './pages/PlannerDashboard.jsx';
import CoolingTracker from './pages/CoolingTracker.jsx';
import CitizenView from './pages/CitizenView.jsx';

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'planner' ? '/dashboard' : '/citizen'} replace />;
  }
  return children;
}

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'planner' ? '/dashboard' : '/citizen'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<RoleRedirect />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['planner']}>
                <PlannerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cooling"
            element={
              <ProtectedRoute allowedRoles={['planner']}>
                <CoolingTracker />
              </ProtectedRoute>
            }
          />
          <Route
            path="/citizen"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <CitizenView />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
