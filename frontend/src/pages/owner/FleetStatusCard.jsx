import { useState, useEffect } from 'react';
import api from '../../lib/api';

function FleetStatusCard() {
  const [fleet, setFleet] = useState(null);

  useEffect(() => {
    api.get('/dashboard/fleet-status')
      .then(({ data }) => setFleet(data))
      .catch(() => {});
  }, []);

  const items = fleet ? [
    { label: 'Available', value: fleet.available, color: 'bg-green-100 text-green-800' },
    { label: 'In Use', value: fleet.in_use, color: 'bg-blue-100 text-blue-800' },
    { label: 'Under Maintenance', value: fleet.under_maintenance, color: 'bg-yellow-100 text-yellow-800' },
  ] : [];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-base font-semibold text-gray-800 mb-4">Fleet Status</h2>
      {!fleet ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : (
        <div className="space-y-3">
          {items.map(({ label, value, color }) => (
            <div key={label} className="flex items-center justify-between">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${color}`}>{label}</span>
              <span className="text-lg font-bold text-gray-800">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FleetStatusCard;
