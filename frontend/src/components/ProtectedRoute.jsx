import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const loginPathForRole = (role) => {
  const map = { customer: '/customer/login', staff: '/staff/login', driver: '/driver/login', owner: '/owner/login' };
  return map[role] ?? '/customer/login';
};

function ProtectedRoute({ allowedRoles = [] }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to={loginPathForRole(allowedRoles[0])} replace />;
  if (!allowedRoles.includes(user?.role)) return <Navigate to={loginPathForRole(user?.role)} replace />;
  return <Outlet />;
}

export default ProtectedRoute;
