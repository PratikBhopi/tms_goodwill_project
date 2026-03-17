import React, { useEffect, useState } from 'react';
import { ordersAPI } from '../../api/orders';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import { TruckIcon, PackageIcon } from 'lucide-react';

export default function CustomerDashboard() {
  const [stats, setStats] = useState({ active: 0, completed: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await ordersAPI.getMyOrders();
        const active = data.data.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status)).length;
        const completed = data.data.filter(o => o.status === 'DELIVERED').length;
        setStats({ active, completed });
      } catch (e) {
        console.error(e);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Customer Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard label="Active Orders" value={stats.active} icon={TruckIcon} />
        <StatCard label="Completed Orders" value={stats.completed} icon={PackageIcon} />
      </div>
    </div>
  );
}
