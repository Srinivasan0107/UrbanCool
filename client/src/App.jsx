import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import PlannerDashboard from './pages/PlannerDashboard.jsx';
import CoolingTracker from './pages/CoolingTracker.jsx';
import CitizenView from './pages/CitizenView.jsx';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const hasRealGoogleId = Boolean(
  googleClientId && googleClientId.includes('.apps.googleusercontent.com')
);

function GoogleAuthWrapper({ children }) {
  if (hasRealGoogleId) {
    return <GoogleOAuthProvider clientId={googleClientId}>{children}</GoogleOAuthProvider>;
  }
  return children;
}

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
          <Route
            path="/login"
            element={
              <GoogleAuthWrapper>
                <LoginPage />
              </GoogleAuthWrapper>
            }
          />
          <Route
            path="/register"
            element={
              <GoogleAuthWrapper>
                <RegisterPage />
              </GoogleAuthWrapper>
            }
          />
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
