import React from 'react';

export default function StatCard({ label, value, change, icon: Icon }) {
  return (
    <div className="card border-t-2 border-brand-500">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-neutral-500 uppercase tracking-wide font-medium">{label}</p>
          <p className="text-2xl font-semibold text-neutral-900 mt-1">{value}</p>
          {change && <p className="text-xs text-green-600 mt-1">{change}</p>}
        </div>
        <div className="bg-brand-50 p-2 rounded-lg">
          {Icon && <Icon className="w-5 h-5 text-brand-500" />}
        </div>
      </div>
    </div>
  );
}
