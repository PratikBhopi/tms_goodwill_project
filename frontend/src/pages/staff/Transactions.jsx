import { useState, useEffect } from 'react';
import api from '../../lib/api';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import LoadingSpinner from '../../components/LoadingSpinner';

const SIDEBAR_LINKS = [
  { label: 'Dashboard', to: '/staff/dashboard' },
  { label: 'Drivers', to: '/staff/drivers' },
  { label: 'Vehicles', to: '/staff/vehicles' },
  { label: 'Transactions', to: '/staff/transactions' },
];

const PAYMENT_STATUSES = ['', 'pending', 'paid', 'cod_pending', 'cod_paid', 'failed'];

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ from: '', to: '', payment_status: '' });

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      if (filters.payment_status) params.payment_status = filters.payment_status;
      const { data } = await api.get('/transactions', { params });
      setTransactions(data.transactions ?? data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load transactions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (e) => setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleFilterSubmit = (e) => { e.preventDefault(); fetchTransactions(); };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    if (filters.payment_status) params.set('payment_status', filters.payment_status);
    const token = localStorage.getItem('tms_token');
    const query = params.toString();
    const url = `/api/transactions/export${query ? `?${query}` : ''}`;
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', 'transactions.csv');
    // Pass auth header via fetch + blob for protected endpoints
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(objectUrl);
      })
      .catch(() => { window.open(url, '_blank'); });
  };

  const paymentStatusBadge = (status) => {
    const styles = {
      paid: 'bg-green-100 text-green-800',
      cod_paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cod_pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-gray-100 text-gray-800'}`}>
        {status?.replace('_', ' ') ?? '—'}
      </span>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar links={SIDEBAR_LINKS} />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Transactions</h2>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              Export CSV
            </button>
          </div>

          {/* Filters */}
          <form onSubmit={handleFilterSubmit} className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
              <input
                name="from"
                type="date"
                value={filters.from}
                onChange={handleFilterChange}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
              <input
                name="to"
                type="date"
                value={filters.to}
                onChange={handleFilterChange}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Payment Status</label>
              <select
                name="payment_status"
                value={filters.payment_status}
                onChange={handleFilterChange}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>{s ? s.replace('_', ' ') : 'All statuses'}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => { setFilters({ from: '', to: '', payment_status: '' }); }}
              className="px-4 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded hover:bg-gray-300 transition-colors"
            >
              Clear
            </button>
          </form>

          {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

          {loading ? <LoadingSpinner /> : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Order ID', 'Customer', 'Payment Mode', 'Payment Status', 'Amount', 'Date'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400 text-sm">No transactions found.</td></tr>
                  ) : transactions.map((tx) => (
                    <tr key={tx.id ?? tx.order_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">#{tx.order_id}</td>
                      <td className="px-4 py-3 text-gray-600">{tx.customer_name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600 capitalize">{tx.payment_mode ?? '—'}</td>
                      <td className="px-4 py-3">{paymentStatusBadge(tx.payment_status)}</td>
                      <td className="px-4 py-3 text-gray-800">₹{tx.amount ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{tx.created_at ? new Date(tx.created_at).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Transactions;
