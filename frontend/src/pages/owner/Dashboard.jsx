import { useState, useEffect } from 'react';
import api from '../../lib/api';
import Navbar from '../../components/Navbar';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import OrderTrendChart from './OrderTrendChart';
import PaymentSplitChart from './PaymentSplitChart';
import DriverActivity from './DriverActivity';
import FleetStatusCard from './FleetStatusCard';

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard/summary')
      .then(({ data }) => setSummary(data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
        <h1 className="text-2xl font-bold text-gray-900">Owner Dashboard</h1>

        {error && <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

        {loading ? <LoadingSpinner /> : summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Today's Orders" value={summary.today_orders ?? 0} />
            <StatCard title="In Transit" value={summary.in_transit_count ?? 0} />
            <StatCard title="Today's Revenue" value={`₹${summary.today_revenue ?? 0}`} />
            <StatCard title="Available Vehicles" value={summary.available_vehicles ?? 0} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OrderTrendChart />
          <PaymentSplitChart />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FleetStatusCard />
          <DriverActivity />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
