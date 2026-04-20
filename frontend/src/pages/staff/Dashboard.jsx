import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';

const SIDEBAR_LINKS = [
  { label: 'Dashboard', to: '/staff/dashboard' },
  { label: 'Drivers', to: '/staff/drivers' },
  { label: 'Vehicles', to: '/staff/vehicles' },
  { label: 'Transactions', to: '/staff/transactions' },
];

const STATUS_COLUMNS = ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'];

function Dashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await api.get('/orders/all');
      setOrders(data.orders ?? []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 60000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const grouped = STATUS_COLUMNS.reduce((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s);
    return acc;
  }, {});

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar links={SIDEBAR_LINKS} />
        <main className="flex-1 p-6 overflow-auto">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Orders Dashboard</h2>
          {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
          {loading ? <LoadingSpinner /> : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {STATUS_COLUMNS.map((status) => (
                <div key={status} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{status.replace('_', ' ')}</span>
                    <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-2 py-0.5">{grouped[status].length}</span>
                  </div>
                  {grouped[status].length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No orders</p>
                  ) : grouped[status].map((order) => (
                    <div key={order._id} onClick={() => navigate(`/staff/orders/${order._id}`)}
                      className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500">#{String(order._id).slice(-6)}</span>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <p className="text-xs text-gray-700 truncate"><span className="font-medium">From:</span> {order.pickup_address}</p>
                      <p className="text-xs text-gray-700 truncate"><span className="font-medium">To:</span> {order.dropoff_address}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
