import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Customer Portal
import CustomerLogin from './pages/customer/Login';
import Register from './pages/customer/Register';
import ForgotPassword from './pages/customer/ForgotPassword';
import ResetPassword from './pages/customer/ResetPassword';
import OrderHistory from './pages/customer/OrderHistory';
import OrderDetail from './pages/customer/OrderDetail';
import PlaceOrder from './pages/customer/PlaceOrder';

// Staff Panel
import StaffLogin from './pages/staff/Login';
import StaffDashboard from './pages/staff/Dashboard';
import StaffOrderDetail from './pages/staff/OrderDetail';
import StaffDrivers from './pages/staff/Drivers';
import StaffVehicles from './pages/staff/Vehicles';
import StaffTransactions from './pages/staff/Transactions';

// Driver Interface
import DriverLogin from './pages/driver/Login';
import MyTrips from './pages/driver/MyTrips';
import TripDetail from './pages/driver/TripDetail';

// Owner Dashboard
import OwnerLogin from './pages/owner/Login';
import OwnerDashboard from './pages/owner/Dashboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/customer/login" replace />} />

          {/* Customer Portal */}
          <Route path="/customer/login" element={<CustomerLogin />} />
          <Route path="/customer/register" element={<Register />} />
          <Route path="/customer/forgot-password" element={<ForgotPassword />} />
          <Route path="/customer/reset-password" element={<ResetPassword />} />
          <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
            <Route path="/customer/dashboard" element={<OrderHistory />} />
            <Route path="/customer/orders" element={<OrderHistory />} />
            <Route path="/customer/orders/:id" element={<OrderDetail />} />
            <Route path="/customer/place-order" element={<PlaceOrder />} />
          </Route>

          {/* Staff Panel */}
          <Route path="/staff/login" element={<StaffLogin />} />
          <Route element={<ProtectedRoute allowedRoles={['staff']} />}>
            <Route path="/staff/dashboard" element={<StaffDashboard />} />
            <Route path="/staff/orders/:id" element={<StaffOrderDetail />} />
            <Route path="/staff/drivers" element={<StaffDrivers />} />
            <Route path="/staff/vehicles" element={<StaffVehicles />} />
            <Route path="/staff/transactions" element={<StaffTransactions />} />
          </Route>

          {/* Driver Interface */}
          <Route path="/driver/login" element={<DriverLogin />} />
          <Route element={<ProtectedRoute allowedRoles={['driver']} />}>
            <Route path="/driver/trips" element={<MyTrips />} />
            <Route path="/driver/trips/:id" element={<TripDetail />} />
          </Route>

          {/* Owner Dashboard */}
          <Route path="/owner/login" element={<OwnerLogin />} />
          <Route element={<ProtectedRoute allowedRoles={['owner']} />}>
            <Route path="/owner/dashboard" element={<OwnerDashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
