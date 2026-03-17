import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../../api/orders';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

export default function OrdersList() {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await ordersAPI.getAllOrders();
        setOrders(data.data);
      } catch (e) { console.error(e); }
    };
    fetchOrders();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">All Orders</h1>
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="p-4 font-medium text-sm text-neutral-600">ID</th>
              <th className="p-4 font-medium text-sm text-neutral-600">Customer</th>
              <th className="p-4 font-medium text-sm text-neutral-600">Route</th>
              <th className="p-4 font-medium text-sm text-neutral-600">Status</th>
              <th className="p-4 font-medium text-sm text-neutral-600 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-neutral-100 hover:bg-brand-50/50 transition-colors">
                <td className="p-4 text-sm font-medium">#{o.id.slice(0, 6)}</td>
                <td className="p-4 text-sm">{o.customer?.name}</td>
                <td className="p-4 text-xs text-neutral-500 max-w-xs truncate">{o.pickupAddress} → {o.dropoffAddress}</td>
                <td className="p-4"><Badge status={o.status} /></td>
                <td className="p-4 text-right">
                  <Button variant="secondary" onClick={() => navigate(`/staff/orders/${o.id}`)}>Review</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
