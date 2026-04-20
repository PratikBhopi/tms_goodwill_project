function StatCard({ title, value, icon }) {
  return (
    <div className="flex items-center gap-4 p-5 bg-white border border-gray-200 rounded-lg shadow-sm">
      {icon && <div className="text-3xl text-blue-600">{icon}</div>}
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</span>
        <span className="text-2xl font-bold text-gray-900">{value}</span>
      </div>
    </div>
  );
}

export default StatCard;
