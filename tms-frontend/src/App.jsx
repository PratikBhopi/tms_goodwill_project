import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import AppShell from './components/layout/AppShell';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

import CustomerDashboard from './pages/customer/CustomerDashboard';
import PlaceOrder from './pages/customer/PlaceOrder';
import MyOrders from './pages/customer/MyOrders';

import StaffDashboard from './pages/staff/StaffDashboard';
import OrdersList from './pages/staff/OrdersList';
import OrderDetail from './pages/staff/OrderDetail';
import DriversPage from './pages/staff/DriversPage';
import VehiclesPage from './pages/staff/VehiclesPage';

import DriverDashboard from './pages/driver/DriverDashboard';
import TripDetail from './pages/driver/TripDetail';

import BusinessDashboard from './pages/dashboard/BusinessDashboard';

// Create a small placeholder for TransactionLog since it was just referenced
const TransactionsPlaceholder = () => <div className="p-4 bg-white m-4 rounded-xl border">Transaction Log Table (MVP Feature deferred)</div>;

function PrivateRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading Application...</div>;
  if (!user) return <Navigate to="/login" />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<div className="p-10 text-center text-red-600 bg-red-50 m-10 rounded-xl font-medium">Access Denied. You do not have permission to view this page.</div>} />

        <Route path="/" element={<AppShell />}>
          {/* Default redirect based on role could go here, for now it relies on Login routing */}
          
          {/* CUSTOMER */}
          <Route path="customer/dashboard" element={<PrivateRoute allowedRoles={['CUSTOMER']}><CustomerDashboard /></PrivateRoute>} />
          <Route path="customer/new-order"  element={<PrivateRoute allowedRoles={['CUSTOMER']}><PlaceOrder /></PrivateRoute>} />
          <Route path="customer/orders"     element={<PrivateRoute allowedRoles={['CUSTOMER']}><MyOrders /></PrivateRoute>} />

          {/* STAFF */}
          <Route path="staff/dashboard"    element={<PrivateRoute allowedRoles={['STAFF', 'OWNER']}><StaffDashboard /></PrivateRoute>} />
          <Route path="staff/orders"       element={<PrivateRoute allowedRoles={['STAFF', 'OWNER']}><OrdersList /></PrivateRoute>} />
          <Route path="staff/orders/:id"   element={<PrivateRoute allowedRoles={['STAFF', 'OWNER']}><OrderDetail /></PrivateRoute>} />
          <Route path="staff/drivers"      element={<PrivateRoute allowedRoles={['STAFF', 'OWNER']}><DriversPage /></PrivateRoute>} />
          <Route path="staff/vehicles"     element={<PrivateRoute allowedRoles={['STAFF', 'OWNER']}><VehiclesPage /></PrivateRoute>} />
          <Route path="staff/transactions" element={<PrivateRoute allowedRoles={['STAFF', 'OWNER']}><TransactionsPlaceholder /></PrivateRoute>} />

          {/* DRIVER */}
          <Route path="driver/dashboard"     element={<PrivateRoute allowedRoles={['DRIVER']}><DriverDashboard /></PrivateRoute>} />
          <Route path="driver/trip/:orderId" element={<PrivateRoute allowedRoles={['DRIVER']}><TripDetail /></PrivateRoute>} />

          {/* OWNER */}
          <Route path="owner/dashboard" element={<PrivateRoute allowedRoles={['OWNER']}><BusinessDashboard /></PrivateRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
