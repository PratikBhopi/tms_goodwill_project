import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import Navbar from '../../components/Navbar';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';

function MyTrips() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/orders')
      .then(({ data }) => setOrders(data.orders ?? []))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load trips.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Trips</h1>
        {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
        {loading ? <LoadingSpinner /> : orders.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No trips assigned yet.</p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order._id} onClick={() => navigate(`/driver/trips/${order._id}`)}
                className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">#{String(order._id).slice(-8)}</span>
                  <OrderStatusBadge status={order.status} />
                </div>
                <p className="text-sm text-gray-600 truncate"><span className="font-medium">From:</span> {order.pickup_address}</p>
                <p className="text-sm text-gray-600 truncate"><span className="font-medium">To:</span> {order.dropoff_address}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyTrips;
