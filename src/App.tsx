import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';

// Admin Pages
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Users from './pages/admin/Users';
import Categories from './pages/admin/Categories';
import Products from './pages/admin/Products';
import Reports from './pages/admin/Reports';

// Operator Pages
import OperatorLayout from './components/OperatorLayout';
import POS from './pages/operator/POS';
import History from './pages/operator/History';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="users" element={<Users />} />
              <Route path="categories" element={<Categories />} />
              <Route path="products" element={<Products />} />
              <Route path="reports" element={<Reports />} />
            </Route>
          </Route>

          {/* Operator Routes (Also accessible by admin for testing) */}
          <Route path="/pos" element={<ProtectedRoute allowedRoles={['admin', 'operator']} />}>
            <Route element={<OperatorLayout />}>
              <Route index element={<POS />} />
              <Route path="history" element={<History />} />
            </Route>
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
