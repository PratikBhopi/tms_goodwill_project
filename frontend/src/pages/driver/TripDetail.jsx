import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../lib/api';
import Navbar from '../../components/Navbar';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';

function TripDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [podFile, setPodFile] = useState(null);
  const [podError, setPodError] = useState('');
  const [podLoading, setPodLoading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchOrder = () => {
    api.get(`/orders/${id}`)
      .then(({ data }) => setOrder(data.order ?? data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load trip.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const updateStatus = async (newStatus) => {
    setActionError('');
    setActionLoading(true);
    try {
      const { data } = await api.patch(`/orders/${id}/status`, { status: newStatus });
      setOrder(data.order ?? data);
    } catch (err) {
      setActionError(err.response?.data?.error || 'Status update failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setPodError('Only JPEG and PNG files are allowed.');
      setPodFile(null);
      return;
    }
    setPodError('');
    setPodFile(file);
  };

  const handlePodUpload = async (e) => {
    e.preventDefault();
    if (!podFile) { setPodError('Please select a JPEG or PNG file.'); return; }
    setPodError('');
    setPodLoading(true);
    try {
      const formData = new FormData();
      formData.append('photo', podFile);
      const { data } = await api.post(`/orders/${id}/pod`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setOrder((prev) => ({ ...prev, status: data.status, pod_photo_url: data.pod_url }));
      setPodFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setPodError(err.response?.data?.error || 'Upload failed.');
    } finally {
      setPodLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50"><Navbar /><LoadingSpinner /></div>;

  if (error) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
        <Link to="/driver/trips" className="mt-4 inline-block text-blue-600 hover:underline text-sm">← Back to trips</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-5">
        <div className="flex items-center justify-between">
          <Link to="/driver/trips" className="text-sm text-blue-600 hover:underline">← Back to trips</Link>
          <OrderStatusBadge status={order.status} />
        </div>

        {/* Trip Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3 text-sm">
          <h2 className="text-base font-semibold text-gray-800">Trip Details</h2>
          <div><span className="font-medium text-gray-600">Pickup:</span> <span className="text-gray-800">{order.pickup_address}</span></div>
          <div><span className="font-medium text-gray-600">Dropoff:</span> <span className="text-gray-800">{order.dropoff_address}</span></div>
          <div><span className="font-medium text-gray-600">Goods Type:</span> <span className="text-gray-800">{order.goods_type}</span></div>
          <div><span className="font-medium text-gray-600">Weight:</span> <span className="text-gray-800">{order.weight_kg} kg</span></div>
          {order.special_instructions && (
            <div><span className="font-medium text-gray-600">Instructions:</span> <span className="text-gray-800">{order.special_instructions}</span></div>
          )}
          <div><span className="font-medium text-gray-600">Preferred Date:</span> <span className="text-gray-800">{order.preferred_date}</span></div>
        </div>

        {/* Status Actions */}
        {(order.status === 'assigned' || order.status === 'picked_up') && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-800 mb-3">Update Status</h2>
            {actionError && <div className="mb-3 text-sm text-red-600">{actionError}</div>}
            {order.status === 'assigned' && (
              <button onClick={() => updateStatus('picked_up')} disabled={actionLoading}
                className="px-5 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 disabled:opacity-60 transition-colors">
                {actionLoading ? 'Updating…' : 'Mark Picked Up'}
              </button>
            )}
            {order.status === 'picked_up' && (
              <button onClick={() => updateStatus('in_transit')} disabled={actionLoading}
                className="px-5 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-60 transition-colors">
                {actionLoading ? 'Updating…' : 'Mark In Transit'}
              </button>
            )}
          </div>
        )}

        {/* POD Upload — only shown when in_transit */}
        {order.status === 'in_transit' && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-800 mb-3">Upload Proof of Delivery</h2>
            {podError && <div className="mb-3 text-sm text-red-600">{podError}</div>}
            <form onSubmit={handlePodUpload} className="space-y-3">
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" onChange={handleFileChange}
                className="block w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              <p className="text-xs text-gray-400">JPEG or PNG only, max 5 MB</p>
              <button type="submit" disabled={podLoading || !podFile}
                className="px-5 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors">
                {podLoading ? 'Uploading…' : 'Submit POD'}
              </button>
            </form>
          </div>
        )}

        {/* Delivered confirmation */}
        {order.status === 'delivered' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
            <p className="text-green-800 font-semibold">Trip completed — delivery confirmed.</p>
            {order.pod_photo_url && (
              <img src={order.pod_photo_url} alt="POD" className="mt-3 max-w-full rounded-lg border border-green-200 mx-auto" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TripDetail;
