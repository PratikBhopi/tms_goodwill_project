import { Link, useLocation } from 'react-router-dom';
import { Home, Plus, Truck, ClipboardList, Users, CreditCard, LogOut, Map, BarChart3 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const navMap = {
  CUSTOMER: [
    { label: "Dashboard", href: "/customer/dashboard", icon: Home },
    { label: "New Order",  href: "/customer/new-order", icon: Plus },
    { label: "My Orders",  href: "/customer/orders",    icon: Truck },
  ],
  STAFF: [
    { label: "Dashboard", href: "/staff/dashboard",    icon: Home },
    { label: "Orders",    href: "/staff/orders",       icon: ClipboardList },
    { label: "Drivers",   href: "/staff/drivers",      icon: Users },
    { label: "Vehicles",  href: "/staff/vehicles",     icon: Truck },
    { label: "Payments",  href: "/staff/transactions", icon: CreditCard },
  ],
  DRIVER: [
    { label: "My Trips", href: "/driver/dashboard", icon: Map },
  ],
  OWNER: [
    { label: "Dashboard", href: "/owner/dashboard", icon: BarChart3 },
    { label: "Orders",    href: "/staff/orders",       icon: ClipboardList },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const links = navMap[user?.role] || [];

  return (
    <aside className="w-64 bg-brand-900 text-white flex flex-col h-full flex-shrink-0">
      <div className="p-6">
        <h1 className="text-xl font-bold tracking-tight">GoodWill<span className="text-brand-500 font-medium">TMS</span></h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto mt-4">
        {links.map((link) => {
          const active = location.pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              to={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                active 
                  ? 'bg-white/10 text-white font-medium border-l-2 border-brand-500' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-5 h-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="mb-4 px-3 flex flex-col">
          <span className="text-sm font-medium">{user?.name}</span>
          <span className="text-xs text-brand-500 uppercase font-semibold tracking-wider">{user?.role}</span>
        </div>
        <button 
          onClick={logout}
          className="flex w-full items-center gap-3 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </div>
    </aside>
  );
}
