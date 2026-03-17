import React, { useEffect, useState } from 'react';
import { ordersAPI } from '../../api/orders';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { PackageOpen } from 'lucide-react';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await ordersAPI.getMyOrders();
        setOrders(data.data);
      } catch (e) { console.error(e); }
    };
    fetchOrders();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">My Orders</h1>
      {orders.length === 0 ? (
        <EmptyState icon={PackageOpen} title="No Orders Yet" message="You haven't placed any transport orders." />
      ) : (
        <div className="grid gap-4">
          {orders.map(order => (
            <Card key={order.id} className="flex justify-between items-center">
              <div>
                <p className="font-medium text-sm">Order #{order.id.slice(0,8)}</p>
                <p className="text-xs text-neutral-500 mt-1">{order.pickupAddress} → {order.dropoffAddress}</p>
                <p className="text-xs font-medium mt-1">₹ {order.finalPrice || order.estimatedPrice || 'Pending Quote'}</p>
              </div>
              <Badge status={order.status} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
