import { BellIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function TopBar() {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-6 flex-shrink-0 shadow-sm z-10">
      <div className="flex items-center">
        <h2 className="text-sm font-medium text-neutral-600">Welcome back, {user?.name?.split(' ')[0]}</h2>
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 text-neutral-400 hover:bg-neutral-50 rounded-full transition-colors relative">
          <BellIcon className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-medium text-sm border border-brand-200">
          {user?.name?.charAt(0)}
        </div>
      </div>
    </header>
  );
}
