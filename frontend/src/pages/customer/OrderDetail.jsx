import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import api from '../../lib/api';

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4">
      <span className="text-sm font-medium text-gray-500 sm:w-40 shrink-0">{label}</span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  );
}

function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState('');

  const fetchOrder = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/orders/${id}`);
      setOrder(data.order ?? data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load order.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const handlePayOnline = async () => {
    setPayError('');
    setPayLoading(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) { setPayError('Failed to load payment gateway. Please try again.'); setPayLoading(false); return; }

      const { data } = await api.post('/payments/create-order', { order_id: order.id });

      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency ?? 'INR',
        name: 'GoodWill TMS',
        description: `Order #${order.id}`,
        order_id: data.razorpay_order_id,
        handler: async (response) => {
          try {
            await api.post('/payments/verify', {
              order_id: order.id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            fetchOrder();
          } catch {
            setPayError('Payment verification failed. Please contact support.');
          }
        },
        prefill: {},
        theme: { color: '#2563EB' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setPayError(err.response?.data?.message || 'Could not initiate payment.');
    } finally {
      setPayLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50"><Navbar /><LoadingSpinner /></div>;

  if (error) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
        <Link to="/customer/orders" className="mt-4 inline-block text-blue-600 hover:underline text-sm">← Back to orders</Link>
      </div>
    </div>
  );

  const statusLog = order.status_log ?? order.statusLog ?? [];
  const showPayButton = order.payment_status === 'pending' && order.payment_mode === 'online';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link to="/customer/orders" className="text-sm text-blue-600 hover:underline">← Back to orders</Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">Order #{order.id}</h1>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        {/* Order Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-3">
          <h2 className="text-base font-semibold text-gray-800 mb-2">Order Details</h2>
          <InfoRow label="Pickup Address" value={order.pickup_address} />
          <InfoRow label="Dropoff Address" value={order.dropoff_address} />
          <InfoRow label="Goods Type" value={order.goods_type} />
          <InfoRow label="Weight" value={order.weight_kg ? `${order.weight_kg} kg` : null} />
          <InfoRow label="Preferred Date" value={order.preferred_date} />
          <InfoRow label="Preferred Time" value={order.preferred_time} />
          <InfoRow label="Special Instructions" value={order.special_instructions} />
          <InfoRow label="Payment Mode" value={order.payment_mode === 'cod' ? 'Cash on Delivery' : 'Online'} />
          <InfoRow label="Payment Status" value={order.payment_status} />
          <InfoRow label="Estimated Price" value={order.estimated_price ? `₹${order.estimated_price}` : null} />
          <InfoRow label="Final Price" value={order.final_price ? `₹${order.final_price}` : null} />
        </div>

        {/* Driver & Vehicle (assigned+) */}
        {order.driver_name && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-3">
            <h2 className="text-base font-semibold text-gray-800 mb-2">Driver & Vehicle</h2>
            <InfoRow label="Driver Name" value={order.driver_name} />
            <InfoRow label="Vehicle Reg." value={order.vehicle_registration} />
          </div>
        )}

        {/* POD Photo (delivered) */}
        {order.pod_photo_url && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-3">Proof of Delivery</h2>
            <img
              src={order.pod_photo_url}
              alt="Proof of Delivery"
              className="max-w-full rounded-lg border border-gray-200"
            />
          </div>
        )}

        {/* Status Timeline */}
        {statusLog.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Status Timeline</h2>
            <ol className="relative border-l border-gray-200 space-y-4 ml-3">
              {statusLog.map((entry, idx) => (
                <li key={idx} className="ml-4">
                  <div className="absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
                  <div className="flex flex-col">
                    <OrderStatusBadge status={entry.status} />
                    <span className="text-xs text-gray-500 mt-1">
                      {new Date(entry.created_at ?? entry.timestamp).toLocaleString()}
                    </span>
                    {entry.note && <span className="text-xs text-gray-600 mt-0.5">{entry.note}</span>}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Pay Online */}
        {showPayButton && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-3">Payment</h2>
            {payError && (
              <div className="mb-3 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{payError}</div>
            )}
            <button
              onClick={handlePayOnline}
              disabled={payLoading}
              className="px-6 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
            >
              {payLoading ? 'Processing…' : 'Pay Online'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderDetail;
