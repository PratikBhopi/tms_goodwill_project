import React, { useEffect, useState } from 'react';
import { ordersAPI } from '../../api/orders';
import StatCard from '../../components/ui/StatCard';
import { ClipboardList, Truck, Users } from 'lucide-react';

export default function StaffDashboard() {
  const [stats, setStats] = useState({ pending: 0, active: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await ordersAPI.getAllOrders();
        const pending = data.data.filter(o => o.status === 'PENDING').length;
        const active = data.data.filter(o => ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(o.status)).length;
        setStats({ pending, active });
      } catch (e) { console.error(e); }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Staff Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Pending Assignment" value={stats.pending} icon={ClipboardList} />
        <StatCard label="Active Trips" value={stats.active} icon={Truck} />
      </div>
    </div>
  );
}
