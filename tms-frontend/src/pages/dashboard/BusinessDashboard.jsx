import React, { useEffect, useState } from 'react';
import axios from 'axios';
import StatCard from '../../components/ui/StatCard';
import { TrendingUp, Truck, DollarSign, PackageCheck } from 'lucide-react';

export default function BusinessDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/dashboard/summary');
        setData(res.data.data);
      } catch (e) { console.error('Failed to load dashboard', e); }
    };
    fetchSummary();
  }, []);

  if (!data) return <p>Loading dashboard...</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Business Overview</h1>
        <p className="text-sm text-neutral-500">Today's high-level metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Orders Today" value={data.totalOrdersToday} icon={TrendingUp} />
        <StatCard label="In Transit" value={data.ordersInTransit} icon={Truck} />
        <StatCard label="Revenue Today" value={`₹ ${data.revenueToday.toLocaleString()}`} icon={DollarSign} />
        <StatCard label="Fleet Available" value={data.fleet?.AVAILABLE || 0} icon={PackageCheck} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Placeholder for complex charts, simulating with visual boxes for MVP */}
        <div className="bg-white p-6 rounded-xl border border-neutral-200 min-h-[300px] flex items-center justify-center">
           <div className="text-center">
             <BarChart3 className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
             <p className="text-neutral-500 font-medium text-sm">Revenue Trend Chart (Coming Soon)</p>
           </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-neutral-200 min-h-[300px] flex items-center justify-center">
           <div className="text-center">
             <PieChart className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
             <p className="text-neutral-500 font-medium text-sm">Payment Split Chart (Coming Soon)</p>
           </div>
        </div>
      </div>
    </div>
  );
}

// Minimal Icons just for this file placeholder
const BarChart3 = (p) => <svg {...p} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>;
const PieChart = (p) => <svg {...p} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>;
