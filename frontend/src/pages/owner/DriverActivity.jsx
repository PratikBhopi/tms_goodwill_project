import { useState, useEffect } from 'react';
import api from '../../lib/api';

function DriverActivity() {
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    api.get('/dashboard/drivers')
      .then(({ data }) => setDrivers(data.drivers ?? []))
      .catch(() => {});
  }, []);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-base font-semibold text-gray-800 mb-4">Driver Activity</h2>
      {drivers.length === 0 ? (
        <p className="text-sm text-gray-400">No drivers found.</p>
      ) : (
        <div className="space-y-2">
          {drivers.map((d) => (
            <div key={d.driver_id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-800">{d.name ?? 'Unknown'}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${d.status === 'available' ? 'bg-green-100 text-green-700' : d.status === 'on_trip' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                  {d.status}
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-700">{d.trip_count} trips</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DriverActivity;
