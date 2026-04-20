import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import api from '../../lib/api';

const INITIAL_FORM = {
  pickup_address: '',
  dropoff_address: '',
  goods_type: '',
  weight_kg: '',
  preferred_date: '',
  preferred_time: '',
  special_instructions: '',
  payment_mode: 'online',
};

function PlaceOrder() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState(null);
  const [estimating, setEstimating] = useState(false);
  const debounceRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // AI price estimate — debounced 800ms when the three key fields are filled
  useEffect(() => {
    const { pickup_address, dropoff_address, weight_kg } = form;
    if (!pickup_address.trim() || !dropoff_address.trim() || !weight_kg) {
      setEstimate(null);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setEstimating(true);
      try {
        const { data } = await api.post('/ai/estimate', {
          pickup_address,
          dropoff_address,
          goods_type: form.goods_type,
          weight_kg: parseFloat(weight_kg),
        });
        setEstimate(data);
      } catch {
        setEstimate(null);
      } finally {
        setEstimating(false);
      }
    }, 800);
    return () => clearTimeout(debounceRef.current);
  }, [form.pickup_address, form.dropoff_address, form.weight_kg, form.goods_type]);

  const validate = () => {
    if (!form.pickup_address.trim()) return 'Pickup address is required.';
    if (!form.dropoff_address.trim()) return 'Dropoff address is required.';
    if (!form.goods_type.trim()) return 'Goods type is required.';
    if (!form.weight_kg || isNaN(parseFloat(form.weight_kg))) return 'Valid weight is required.';
    if (!form.preferred_date) return 'Preferred date is required.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError('');
    setLoading(true);
    try {
      await api.post('/orders', {
        ...form,
        weight_kg: parseFloat(form.weight_kg),
      });
      navigate('/customer/orders');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Place New Order</h1>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
          {/* Addresses */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="pickup_address">Pickup Address</label>
            <input
              id="pickup_address"
              name="pickup_address"
              type="text"
              value={form.pickup_address}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="123 Main St, City"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="dropoff_address">Dropoff Address</label>
            <input
              id="dropoff_address"
              name="dropoff_address"
              type="text"
              value={form.dropoff_address}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="456 Park Ave, City"
            />
          </div>

          {/* Goods */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="goods_type">Goods Type</label>
              <input
                id="goods_type"
                name="goods_type"
                type="text"
                value={form.goods_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Electronics"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="weight_kg">Weight (kg)</label>
              <input
                id="weight_kg"
                name="weight_kg"
                type="number"
                min="0.1"
                step="0.1"
                value={form.weight_kg}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="10"
              />
            </div>
          </div>

          {/* AI Estimate Widget */}
          {(estimating || estimate) && (
            <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              {estimating ? (
                <span className="text-blue-600">Calculating price estimate…</span>
              ) : estimate?.min_price != null && estimate?.max_price != null ? (
                <span className="text-blue-800 font-medium">
                  Estimated price: ₹{estimate.min_price} – ₹{estimate.max_price}
                </span>
              ) : estimate?.raw_response ? (
                <span className="text-blue-700">{estimate.raw_response}</span>
              ) : null}
            </div>
          )}

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="preferred_date">Preferred Date</label>
              <input
                id="preferred_date"
                name="preferred_date"
                type="date"
                value={form.preferred_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="preferred_time">Preferred Time (optional)</label>
              <input
                id="preferred_time"
                name="preferred_time"
                type="time"
                value={form.preferred_time}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Special Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="special_instructions">Special Instructions (optional)</label>
            <textarea
              id="special_instructions"
              name="special_instructions"
              rows={3}
              value={form.special_instructions}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Handle with care, fragile items…"
            />
          </div>

          {/* Payment Mode */}
          <div>
            <span className="block text-sm font-medium text-gray-700 mb-2">Payment Mode</span>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="payment_mode"
                  value="online"
                  checked={form.payment_mode === 'online'}
                  onChange={handleChange}
                  className="accent-blue-600"
                />
                Online Payment
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="payment_mode"
                  value="cod"
                  checked={form.payment_mode === 'cod'}
                  onChange={handleChange}
                  className="accent-blue-600"
                />
                Cash on Delivery
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {loading ? 'Placing order…' : 'Place Order'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PlaceOrder;
