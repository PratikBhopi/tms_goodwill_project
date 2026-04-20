import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { logout } = useAuth();
  return (
    <nav className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-sm">
      <span className="text-xl font-bold text-gray-800">GoodWill TMS</span>
      <button onClick={logout} className="px-4 py-1.5 text-sm font-medium text-white bg-red-500 rounded hover:bg-red-600 transition-colors">
        Logout
      </button>
    </nav>
  );
}

export default Navbar;
