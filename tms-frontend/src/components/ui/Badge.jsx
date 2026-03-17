import React from 'react';

export default function Badge({ status }) {
  const getBadgeClass = (s) => {
    switch (s?.toUpperCase()) {
      case 'PENDING': return 'badge-pending';
      case 'ASSIGNED': return 'badge-assigned';
      case 'PICKED_UP':
      case 'IN_TRANSIT': return 'badge-transit';
      case 'DELIVERED': return 'badge-delivered';
      default: return 'bg-neutral-100 text-neutral-600 text-xs px-2 py-0.5 rounded-full font-medium inline-block';
    }
  };

  return (
    <span className={getBadgeClass(status)}>
      {status?.replace('_', ' ') || 'UNKNOWN'}
    </span>
  );
}
