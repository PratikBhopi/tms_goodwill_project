import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Assign form
  const [assignForm, setAssignForm] = useState({ driver_id: '', vehicle_id: '' });
  const [assignError, setAssignError] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  // Price form
  const [priceForm, setPriceForm] = useState({ final_price: '', price_override_reason: '' });
  const [priceError, setPriceError] = useState('');
  const [priceLoading, setPriceLoading] = useState(false);

  // Cancel
  const [cancelError, setCancelError] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [orderRes, driversRes, vehiclesRes] = await Promise.all([
          api.get(`/orders/${id}`),
          api.get('/fleet/drivers'),
          api.get('/fleet/vehicles'),
        ]);
        const o = orderRes.data.order ?? orderRes.data;
        setOrder(o);
        setPriceForm({ final_price: o.final_price ?? '', price_override_reason: o.price_override_reason ?? '' });
        setDrivers(driversRes.data.drivers ?? driversRes.data);
        setVehicles(vehiclesRes.data.vehicles ?? vehiclesRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load order.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignForm.driver_id || !assignForm.vehicle_id) { setAssignError('Select both a driver and a vehicle.'); return; }
    setAssignError('');
    setAssignLoading(true);
    try {
      const { data } = await api.patch(`/orders/${id}/assign`, assignForm);
      setOrder(data.order ?? data);
    } catch (err) {
      setAssignError(err.response?.data?.message || 'Assignment failed.');
    } finally {
      setAssignLoading(false);
    }
  };

  const handlePrice = async (e) => {
    e.preventDefault();
    if (!priceForm.final_price) { setPriceError('Final price is required.'); return; }
    setPriceError('');
    setPriceLoading(true);
    try {
      const { data } = await api.patch(`/orders/${id}/price`, priceForm);
      setOrder(data.order ?? data);
    } catch (err) {
      setPriceError(err.response?.data?.message || 'Price update failed.');
    } finally {
      setPriceLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    setCancelError('');
    setCancelLoading(true);
    try {
      const { data } = await api.patch(`/orders/${id}/cancel`);
      setOrder(data.order ?? data);
    } catch (err) {
      setCancelError(err.response?.data?.message || 'Cancel failed.');
    } finally {
      setCancelLoading(false);
    }
  };

  const canAssign = order?.status === 'pending';
  const canPrice = ['pending', 'assigned'].includes(order?.status) && order?.payment_status !== 'paid' && order?.payment_status !== 'cod_paid';
  const canCancel = ['pending', 'assigned'].includes(order?.status);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar links={SIDEBAR_LINKS} />
        <main className="flex-1 p-6 max-w-4xl">
          <button onClick={() => navigate('/staff/dashboard')} className="text-sm text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Dashboard
          </button>

          {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
          {loading ? <LoadingSpinner /> : order && (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800">Order #{order.id}</h2>
                  <OrderStatusBadge status={order.status} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
                  <div><span className="font-medium">Pickup:</span> {order.pickup_address}</div>
                  <div><span className="font-medium">Dropoff:</span> {order.dropoff_address}</div>
                  <div><span className="font-medium">Goods Type:</span> {order.goods_type}</div>
                  <div><span className="font-medium">Weight:</span> {order.weight} kg</div>
                  <div><span className="font-medium">Preferred Date:</span> {order.preferred_date}</div>
                  {order.preferred_time && <div><span className="font-medium">Preferred Time:</span> {order.preferred_time}</div>}
                  {order.special_instructions && <div className="col-span-2"><span className="font-medium">Instructions:</span> {order.special_instructions}</div>}
                  <div><span className="font-medium">Estimated Price:</span> ₹{order.estimated_price ?? '—'}</div>
                  <div><span className="font-medium">Final Price:</span> ₹{order.final_price ?? '—'}</div>
                  <div><span className="font-medium">Payment Mode:</span> {order.payment_mode ?? '—'}</div>
                  <div><span className="font-medium">Payment Status:</span> {order.payment_status ?? '—'}</div>
                  {order.driver_name && <div><span className="font-medium">Driver:</span> {order.driver_name}</div>}
                  {order.vehicle_reg && <div><span className="font-medium">Vehicle:</span> {order.vehicle_reg}</div>}
                </div>
              </div>

              {/* Assign Section */}
              {canAssign && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-base font-semibold text-gray-800 mb-4">Assign Driver & Vehicle</h3>
                  {assignError && <div className="mb-3 text-sm text-red-600">{assignError}</div>}
                  <form onSubmit={handleAssign} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
                      <select
                        value={assignForm.driver_id}
                        onChange={(e) => setAssignForm((f) => ({ ...f, driver_id: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select driver…</option>
                        {drivers.map((d) => (
                          <option key={d.id} value={d.id}>{d.name} — {d.status}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                      <select
                        value={assignForm.vehicle_id}
                        onChange={(e) => setAssignForm((f) => ({ ...f, vehicle_id: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select vehicle…</option>
                        {vehicles.map((v) => (
                          <option key={v.id} value={v.id}>{v.registration_number} — {v.type} ({v.status})</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={assignLoading}
                      className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
                    >
                      {assignLoading ? 'Assigning…' : 'Assign'}
                    </button>
                  </form>
                </div>
              )}

              {/* Price Section */}
              {canPrice && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-base font-semibold text-gray-800 mb-4">Set Final Price</h3>
                  {priceError && <div className="mb-3 text-sm text-red-600">{priceError}</div>}
                  <form onSubmit={handlePrice} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Final Price (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={priceForm.final_price}
                        onChange={(e) => setPriceForm((f) => ({ ...f, final_price: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Override Reason (required if different from estimate)</label>
                      <textarea
                        value={priceForm.price_override_reason}
                        onChange={(e) => setPriceForm((f) => ({ ...f, price_override_reason: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Reason for price adjustment…"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={priceLoading}
                      className="px-5 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
                    >
                      {priceLoading ? 'Saving…' : 'Save Price'}
                    </button>
                  </form>
                </div>
              )}

              {/* Cancel */}
              {canCancel && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-base font-semibold text-gray-800 mb-2">Cancel Order</h3>
                  {cancelError && <div className="mb-3 text-sm text-red-600">{cancelError}</div>}
                  <button
                    onClick={handleCancel}
                    disabled={cancelLoading}
                    className="px-5 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors"
                  >
                    {cancelLoading ? 'Cancelling…' : 'Cancel Order'}
                  </button>
                </div>
              )}

              {/* Status Timeline */}
              {order.status_log?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-base font-semibold text-gray-800 mb-4">Status Timeline</h3>
                  <ol className="relative border-l border-gray-200 space-y-4 ml-3">
                    {order.status_log.map((entry, i) => (
                      <li key={i} className="ml-4">
                        <div className="absolute -left-1.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
                        <div className="flex items-center gap-2">
                          <OrderStatusBadge status={entry.status} />
                          <span className="text-xs text-gray-500">{new Date(entry.created_at).toLocaleString()}</span>
                        </div>
                        {entry.note && <p className="text-xs text-gray-600 mt-1">{entry.note}</p>}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default OrderDetail;
