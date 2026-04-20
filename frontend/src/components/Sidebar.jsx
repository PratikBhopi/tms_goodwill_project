import { NavLink } from 'react-router-dom';

function Sidebar({ links = [] }) {
  return (
    <aside className="w-56 min-h-screen bg-gray-900 text-gray-100 flex flex-col py-6 px-3 gap-1">
      {links.map(({ label, to }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `px-4 py-2 rounded text-sm font-medium transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
          }
        >
          {label}
        </NavLink>
      ))}
    </aside>
  );
}

export default Sidebar;
