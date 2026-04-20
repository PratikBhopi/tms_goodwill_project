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

const VEHICLE_STATUSES = ['available', 'in_use', 'under_maintenance'];
const EMPTY_FORM = { registration_number: '', type: '', capacity: '', owner_name: '', status: 'available' };

function VehicleForm({ initial = EMPTY_FORM, onSubmit, onCancel, loading, error, submitLabel }) {
  const [form, setForm] = useState(initial);
  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const handleSubmit = (e) => { e.preventDefault(); onSubmit(form); };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Registration Number</label>
          <input name="registration_number" type="text" value={form.registration_number} onChange={handleChange}
            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
          <input name="type" type="text" value={form.type} onChange={handleChange}
            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Truck, Van" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Capacity (tons)</label>
          <input name="capacity" type="number" min="0" step="0.1" value={form.capacity} onChange={handleChange}
            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Owner Name (optional)</label>
          <input name="owner_name" type="text" value={form.owner_name} onChange={handleChange}
            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
          <select name="status" value={form.status} onChange={handleChange}
            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {VEHICLE_STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={loading}
          className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-60 transition-colors">
          {loading ? 'Saving…' : submitLabel}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded hover:bg-gray-300 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}

function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const fetchVehicles = async () => {
    try {
      const { data } = await api.get('/fleet/vehicles');
      setVehicles(data.vehicles ?? data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load vehicles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVehicles(); }, []);

  const handleAdd = async (form) => {
    setAddError('');
    setAddLoading(true);
    try {
      await api.post('/fleet/vehicles', form);
      setShowAddForm(false);
      fetchVehicles();
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to add vehicle.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleEdit = async (form) => {
    setEditError('');
    setEditLoading(true);
    try {
      await api.patch(`/fleet/vehicles/${editId}`, form);
      setEditId(null);
      fetchVehicles();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update vehicle.');
    } finally {
      setEditLoading(false);
    }
  };

  const statusBadge = (status) => {
    const styles = {
      available: 'bg-green-100 text-green-800',
      in_use: 'bg-blue-100 text-blue-800',
      under_maintenance: 'bg-yellow-100 text-yellow-800',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-gray-100 text-gray-800'}`}>
        {status?.replace('_', ' ')}
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
            <h2 className="text-xl font-bold text-gray-800">Vehicles</h2>
            <button
              onClick={() => { setShowAddForm((v) => !v); setAddError(''); }}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showAddForm ? 'Close' : 'Add Vehicle'}
            </button>
          </div>

          {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

          {showAddForm && (
            <div className="mb-6">
              <VehicleForm
                onSubmit={handleAdd}
                onCancel={() => setShowAddForm(false)}
                loading={addLoading}
                error={addError}
                submitLabel="Add Vehicle"
              />
            </div>
          )}

          {loading ? <LoadingSpinner /> : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Reg. Number', 'Type', 'Capacity (t)', 'Owner', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vehicles.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400 text-sm">No vehicles found.</td></tr>
                  ) : vehicles.map((vehicle) => (
                    <>
                      <tr key={vehicle.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{vehicle.registration_number}</td>
                        <td className="px-4 py-3 text-gray-600">{vehicle.type}</td>
                        <td className="px-4 py-3 text-gray-600">{vehicle.capacity}</td>
                        <td className="px-4 py-3 text-gray-600">{vehicle.owner_name ?? '—'}</td>
                        <td className="px-4 py-3">{statusBadge(vehicle.status)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => { setEditId(vehicle.id); setEditError(''); }}
                            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                      {editId === vehicle.id && (
                        <tr key={`edit-${vehicle.id}`}>
                          <td colSpan={6} className="px-4 py-3">
                            <VehicleForm
                              initial={{
                                registration_number: vehicle.registration_number,
                                type: vehicle.type,
                                capacity: vehicle.capacity,
                                owner_name: vehicle.owner_name ?? '',
                                status: vehicle.status,
                              }}
                              onSubmit={handleEdit}
                              onCancel={() => setEditId(null)}
                              loading={editLoading}
                              error={editError}
                              submitLabel="Save Changes"
                            />
                          </td>
                        </tr>
                      )}
                    </>
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

export default Vehicles;
