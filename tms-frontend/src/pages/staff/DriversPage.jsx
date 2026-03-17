import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Card from '../../components/ui/Card';

export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/drivers').then(res => setDrivers(res.data.data)).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Manage Drivers</h1>
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="p-4 font-medium text-sm text-neutral-600">Name</th>
              <th className="p-4 font-medium text-sm text-neutral-600">License</th>
              <th className="p-4 font-medium text-sm text-neutral-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr key={d.id} className="border-b border-neutral-100">
                <td className="p-4 text-sm font-medium">{d.user?.name}</td>
                <td className="p-4 text-sm text-neutral-500">{d.licenseNumber}</td>
                <td className="p-4 text-sm">{d.isAvailable ? <span className="text-green-600 font-medium">Available</span> : <span className="text-amber-600 font-medium">On Trip</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
