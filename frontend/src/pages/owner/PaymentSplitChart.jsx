import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../lib/api';

const COLORS = ['#2563EB', '#16A34A'];

function PaymentSplitChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    api.get('/dashboard/revenue')
      .then(({ data: res }) => {
        // Aggregate online vs COD from transactions
        const online = (res.revenue ?? []).reduce((s, r) => s + (r.online ?? 0), 0);
        const cod = (res.revenue ?? []).reduce((s, r) => s + (r.cod ?? 0), 0);
        // Fallback: just show total revenue as one slice if breakdown not available
        const total = (res.revenue ?? []).reduce((s, r) => s + (r.amount ?? 0), 0);
        setData([
          { name: 'Online', value: online || total },
          { name: 'COD', value: cod },
        ].filter((d) => d.value > 0));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-base font-semibold text-gray-800 mb-4">Payment Split</h2>
      {data.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10">No revenue data yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v) => `₹${v}`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default PaymentSplitChart;
