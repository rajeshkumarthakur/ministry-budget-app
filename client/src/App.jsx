// src/App.jsx - UPDATED FOR PHASE 3.3
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';

// Phase 3.2 - Form Components
import FormCreate from './components/Forms/FormCreate';
import FormBuilder from './components/Forms/FormBuilder';
import FormView from './components/Forms/FormView';
import FormApproval from './components/Forms/FormApproval';

// Phase 3.3 - Admin Components
import AdminDashboard from './components/Admin/AdminDashboard';
import AdminMinistries from './components/Admin/AdminMinistries';
import AdminEventTypes from './components/Admin/AdminEventTypes';
import AdminUsers from './components/Admin/AdminUsers';

// Root route component - always redirect to login first
const RootRoute = () => {
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Form Routes - Phase 3.2 */}
          <Route
            path="/forms/create"
            element={
              <ProtectedRoute allowedRoles={['ministry_leader', 'admin']}>
                <FormCreate />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/forms/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['ministry_leader', 'admin']}>
                <FormBuilder />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/forms/:id/view"
            element={
              <ProtectedRoute>
                <FormView />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/forms/:id/approve"
            element={
              <ProtectedRoute allowedRoles={['pillar', 'pastor', 'admin']}>
                <FormApproval />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes - Phase 3.3 */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin/ministries"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminMinistries />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin/event-types"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminEventTypes />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />

          {/* Default Route - redirects based on auth status */}
          <Route path="/" element={<RootRoute />} />
          
          {/* 404 Route - redirect to login if not authenticated */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
