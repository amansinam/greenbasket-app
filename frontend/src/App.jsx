import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Inventory from './pages/Inventory';
import { Warehouse, Delivery, Accounting, Customers, MyDeliveries } from './pages/Operations';
import { Reports, Users } from './pages/ReportsUsers';
import { Spinner } from './components/UI';

function getDefaultRoute(role) {
  switch (role) {
    case 'customer': return '/my-orders';
    case 'driver': return '/my-deliveries';
    case 'warehouse_worker': return '/warehouse';
    default: return '/';
  }
}

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5faf6' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🌿</div>
        <Spinner />
        <div style={{ marginTop: 12, color: '#6b8f71', fontSize: 13 }}>Loading GreenBasket…</div>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={getDefaultRoute(user.role)} replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={getDefaultRoute(user.role)} /> : <Login />} />

      <Route path="/" element={
        <ProtectedRoute roles={['director','sales','warehouse_supervisor','accounting']}>
          <Dashboard />
        </ProtectedRoute>
      } />

      <Route path="/orders" element={
        <ProtectedRoute roles={['director','sales','warehouse_supervisor','accounting']}>
          <Orders />
        </ProtectedRoute>
      } />

      <Route path="/inventory" element={
        <ProtectedRoute roles={['director','sales','warehouse_supervisor']}>
          <Inventory />
        </ProtectedRoute>
      } />

      <Route path="/warehouse" element={
        <ProtectedRoute roles={['director','warehouse_supervisor','warehouse_worker']}>
          <Warehouse />
        </ProtectedRoute>
      } />

      <Route path="/delivery" element={
        <ProtectedRoute roles={['director','warehouse_supervisor']}>
          <Delivery />
        </ProtectedRoute>
      } />

      <Route path="/my-deliveries" element={
        <ProtectedRoute roles={['driver']}>
          <MyDeliveries />
        </ProtectedRoute>
      } />

      <Route path="/accounting" element={
        <ProtectedRoute roles={['director','accounting']}>
          <Accounting />
        </ProtectedRoute>
      } />

      <Route path="/customers" element={
        <ProtectedRoute roles={['director','sales','customer']}>
          <Customers />
        </ProtectedRoute>
      } />

      <Route path="/my-orders" element={
        <ProtectedRoute roles={['customer']}>
          <Orders />
        </ProtectedRoute>
      } />

      <Route path="/new-order" element={
        <ProtectedRoute roles={['customer']}>
          <Orders openCreate={true} />
        </ProtectedRoute>
      } />

      <Route path="/reports" element={
        <ProtectedRoute roles={['director','accounting']}>
          <Reports />
        </ProtectedRoute>
      } />

      <Route path="/users" element={
        <ProtectedRoute roles={['director']}>
          <Users />
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
