import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../../api/orders';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';

export default function PlaceOrder() {
  const [form, setForm] = useState({
    pickupAddress: '', dropoffAddress: '', goodsType: '', weightKg: '', preferredDate: ''
  });
  const [estimate, setEstimate] = useState(null);
  const navigate = useNavigate();

  const handleEstimate = async () => {
    if (!form.pickupAddress || !form.dropoffAddress || !form.weightKg || !form.goodsType) return;
    try {
      const { data } = await ordersAPI.getEstimate({
        from: form.pickupAddress, to: form.dropoffAddress, weightKg: form.weightKg, goodsType: form.goodsType
      });
      setEstimate(data.data.estimate);
    } catch(e) { console.error('Estimation failed'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await ordersAPI.placeOrder(form);
      navigate('/customer/orders');
    } catch(e) { console.error('Order placement failed'); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-semibold">Place New Order</h1>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Pickup Address" value={form.pickupAddress} onChange={e => setForm({...form, pickupAddress: e.target.value})} onBlur={handleEstimate} required />
          <Input label="Drop-off Address" value={form.dropoffAddress} onChange={e => setForm({...form, dropoffAddress: e.target.value})} onBlur={handleEstimate} required />
          
          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Goods Type" 
              options={[
                {label: 'Furniture', value: 'Furniture'},
                {label: 'Electronics', value: 'Electronics'},
                {label: 'Parcels', value: 'Parcels'},
                {label: 'FMCG', value: 'FMCG'},
              ]}
              value={form.goodsType} onChange={e => setForm({...form, goodsType: e.target.value})} required onBlur={handleEstimate}
            />
            <Input label="Weight (Kg)" type="number" value={form.weightKg} onChange={e => setForm({...form, weightKg: e.target.value})} required onBlur={handleEstimate} />
          </div>

          <Input label="Preferred Pickup Date" type="date" value={form.preferredDate} onChange={e => setForm({...form, preferredDate: e.target.value})} required />

          {estimate && (
            <div className="p-4 bg-brand-50 border border-brand-200 rounded-lg">
              <p className="text-brand-700 text-sm font-medium">✨ AI Price Estimate</p>
              <p className="text-2xl font-bold mt-1">₹ {estimate?.min || 'N/A'} - ₹ {estimate?.max || 'N/A'}</p>
              <p className="text-xs text-neutral-500 mt-1">Final price confirmed by staff after review.</p>
            </div>
          )}

          <Button type="submit" className="w-full">Place Order</Button>
        </form>
      </Card>
    </div>
  );
}
