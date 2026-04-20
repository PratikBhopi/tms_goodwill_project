const STATUS_STYLES = {
  pending:    'bg-yellow-100 text-yellow-800',
  assigned:   'bg-blue-100 text-blue-800',
  picked_up:  'bg-orange-100 text-orange-800',
  in_transit: 'bg-purple-100 text-purple-800',
  delivered:  'bg-green-100 text-green-800',
  cancelled:  'bg-red-100 text-red-800',
};

const STATUS_LABELS = {
  pending: 'Pending', assigned: 'Assigned', picked_up: 'Picked Up',
  in_transit: 'In Transit', delivered: 'Delivered', cancelled: 'Cancelled',
};

function OrderStatusBadge({ status }) {
  const style = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-800';
  const label = STATUS_LABELS[status] ?? status;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}

export default OrderStatusBadge;
