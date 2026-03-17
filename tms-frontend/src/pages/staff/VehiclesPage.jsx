import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/vehicles').then(res => setVehicles(res.data.data)).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Manage Vehicles</h1>
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="p-4 font-medium text-sm text-neutral-600">Registration No</th>
              <th className="p-4 font-medium text-sm text-neutral-600">Type</th>
              <th className="p-4 font-medium text-sm text-neutral-600">Capacity</th>
              <th className="p-4 font-medium text-sm text-neutral-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id} className="border-b border-neutral-100">
                <td className="p-4 text-sm font-medium">{v.registrationNo}</td>
                <td className="p-4 text-sm capitalize">{v.type}</td>
                <td className="p-4 text-sm">{v.capacityTons} Tons</td>
                <td className="p-4"><Badge status={v.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
