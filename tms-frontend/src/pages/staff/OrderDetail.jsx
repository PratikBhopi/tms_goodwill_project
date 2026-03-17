import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ordersAPI } from '../../api/orders';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { MapPin, User, Truck, Lightbulb } from 'lucide-react';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [routeSuggestion, setRouteSuggestion] = useState('');
  
  const [form, setForm] = useState({ driverId: '', vehicleId: '', finalPrice: '' });

  useEffect(() => {
    const loadData = async () => {
      try {
        const orderRes = await ordersAPI.getOrderById(id);
        setOrder(orderRes.data.data);
        setForm({ ...form, finalPrice: orderRes.data.data.estimatedPrice });

        // Load drivers and vehicles
        const drvRes = await axios.get('http://localhost:5000/api/drivers/available');
        const vehRes = await axios.get('http://localhost:5000/api/vehicles/available');
        setDrivers(drvRes.data.data);
        setVehicles(vehRes.data.data);

        // Get AI Route
        if (orderRes.data.data.status === 'PENDING') {
          const aiRes = await axios.get(`http://localhost:5000/api/ai/route-suggestion?from=${orderRes.data.data.pickupAddress}&to=${orderRes.data.data.dropoffAddress}`);
          setRouteSuggestion(aiRes.data.data.suggestion);
        }
      } catch (e) {
        console.error('Failed to load order details');
      }
    };
    loadData();
  }, [id]);

  const handleAssign = async () => {
    try {
      if(!form.driverId || !form.vehicleId) return alert('Select Driver and Vehicle');
      await ordersAPI.assignOrder(id, form);
      navigate('/staff/orders');
    } catch(e) {
      alert(e.response?.data?.error || 'Assignment Failed');
    }
  }

  if (!order) return <p>Loading...</p>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Order #{order.id.slice(0,8)}</h1>
        <Badge status={order.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <h3 className="font-semibold mb-4 border-b pb-2">Delivery Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex gap-2 text-neutral-600"><User className="w-4 h-4"/> Customer: {order.customer?.name}</div>
              <div className="flex gap-2 text-neutral-600 mt-2"><MapPin className="w-4 h-4"/> From: <span className="text-neutral-900">{order.pickupAddress}</span></div>
              <div className="flex gap-2 text-neutral-600"><MapPin className="w-4 h-4"/> To: <span className="text-neutral-900">{order.dropoffAddress}</span></div>
              <div className="flex gap-2 text-neutral-600 mt-2"><Truck className="w-4 h-4"/> Goods: {order.goodsType} ({order.weightKg} kg)</div>
            </div>
            
            {routeSuggestion && (
              <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm flex gap-2 items-start border border-blue-100">
                <Lightbulb className="w-5 h-5 flex-shrink-0 text-amber-500" />
                <span><span className="font-semibold font-medium block">Gemini Suggestion:</span> {routeSuggestion}</span>
              </div>
            )}
          </Card>
        </div>

        <div className="md:col-span-1 space-y-4">
          {order.status === 'PENDING' ? (
            <Card>
              <h3 className="font-semibold mb-4">Assign Driver & Vehicle</h3>
              <div className="space-y-4">
                <Select 
                  label="Available Drivers" 
                  options={drivers.map(d => ({label: d.user?.name, value: d.id}))} 
                  value={form.driverId} onChange={e => setForm({...form, driverId: e.target.value})} 
                />
                <Select 
                  label="Available Vehicles" 
                  options={vehicles.map(v => ({label: `${v.registrationNo} (${v.type})`, value: v.id}))} 
                  value={form.vehicleId} onChange={e => setForm({...form, vehicleId: e.target.value})} 
                />
                <Input 
                  label="Final Price (₹)" 
                  type="number" 
                  value={form.finalPrice} onChange={e => setForm({...form, finalPrice: e.target.value})} 
                />
                <Button className="w-full" onClick={handleAssign}>Confirm Assignment</Button>
              </div>
            </Card>
          ) : (
            <Card>
              <h3 className="font-semibold mb-2">Assignment Info</h3>
              <p className="text-sm">Driver: {order.driver?.user?.name || 'Assigned'}</p>
              <p className="text-sm">Vehicle: {order.vehicle?.registrationNo || 'Assigned'}</p>
              <p className="text-sm font-semibold mt-2">Final Price: ₹ {order.finalPrice}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
