import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../../api/orders';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { MapIcon } from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState';

export default function DriverDashboard() {
  const [trips, setTrips] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const { data } = await ordersAPI.getMyTrips();
        setTrips(data.data.filter(t => t.status !== 'DELIVERED'));
      } catch (e) { console.error(e); }
    };
    fetchTrips();
  }, []);

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-20">
      <h1 className="text-xl font-semibold px-2">My Active Trips</h1>
      {trips.length === 0 ? (
         <EmptyState icon={MapIcon} title="No Active Trips" message="You don't have any pending assignments right now." />
      ) : (
        <div className="space-y-4">
          {trips.map(trip => (
            <Card 
              key={trip.id} 
              className="cursor-pointer hover:border-brand-500 transition-colors"
              onClick={() => navigate(`/driver/trip/${trip.id}`)}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-medium">Trip #{trip.id.slice(0,6)}</span>
                <Badge status={trip.status} />
              </div>
              <div className="text-sm text-neutral-600 space-y-1">
                <p><span className="font-medium text-neutral-900">From:</span> {trip.pickupAddress}</p>
                <p><span className="font-medium text-neutral-900">To:</span> {trip.dropoffAddress}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
