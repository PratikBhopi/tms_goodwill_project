import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ordersAPI } from '../../api/orders';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

export default function TripDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [podFile, setPodFile] = useState(null);

  useEffect(() => {
    const loadTrip = async () => {
      try {
        const { data } = await ordersAPI.getOrderById(orderId);
        setTrip(data.data);
      } catch (e) { console.error('Failed to load trip'); }
    };
    loadTrip();
  }, [orderId]);

  const updateStatus = async (newStatus) => {
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
      setTrip({ ...trip, status: newStatus });
    } catch (e) { alert('Failed to update status'); }
  };

  const handleUploadPOD = async () => {
    if (!podFile) return alert('Please select a file first.');
    const formData = new FormData();
    formData.append('pod', podFile);
    try {
      await ordersAPI.uploadPOD(orderId, formData);
      navigate('/driver/dashboard');
    } catch (e) { alert('POD Upload failed'); }
  };

  if (!trip) return <p className="p-4 text-center">Loading...</p>;

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-20">
      <div className="text-center">
        <h1 className="text-xl font-semibold mb-2">Trip #{trip.id.slice(0,6)}</h1>
        <Badge status={trip.status} />
      </div>

      <Card className="space-y-4">
        <div>
          <p className="text-xs text-neutral-500 uppercase font-semibold tracking-wider">Pickup</p>
          <p className="text-lg font-medium mt-1">{trip.pickupAddress}</p>
        </div>
        <div className="border-t border-neutral-100 pt-4">
          <p className="text-xs text-neutral-500 uppercase font-semibold tracking-wider">Drop-off</p>
          <p className="text-lg font-medium mt-1">{trip.dropoffAddress}</p>
        </div>
        <div className="border-t border-neutral-100 pt-4">
          <p className="text-xs text-neutral-500 uppercase font-semibold tracking-wider">Customer Contact</p>
          <p className="text-base font-medium mt-1">{trip.customer?.name} - {trip.customer?.phone}</p>
        </div>
      </Card>

      <div className="space-y-3">
        {trip.status === 'ASSIGNED' && (
          <Button className="w-full py-3 text-lg" onClick={() => updateStatus('PICKED_UP')}>Mark as Picked Up</Button>
        )}
        {trip.status === 'PICKED_UP' && (
          <Button className="w-full py-3 text-lg" onClick={() => updateStatus('IN_TRANSIT')}>Start Transit</Button>
        )}
        {trip.status === 'IN_TRANSIT' && (
          <Card className="border-green-200 bg-green-50 shadow-none">
            <h3 className="font-semibold text-green-800 mb-3 block">Complete Delivery</h3>
            <div className="space-y-4">
              <input 
                type="file" 
                accept="image/*" 
                capture="environment"
                onChange={(e) => setPodFile(e.target.files[0])}
                className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-100 file:text-green-700 hover:file:bg-green-200"
              />
              <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleUploadPOD}>Upload POD & Finish</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
