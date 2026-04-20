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

const EMPTY_FORM = { name: '', email: '', phone: '', license_number: '', license_expiry: '' };

function DriverForm({ initial = EMPTY_FORM, onSubmit, onCancel, loading, error, submitLabel }) {
  const [form, setForm] = useState(initial);
  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const handleSubmit = (e) => { e.preventDefault(); onSubmit(form); };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="grid grid-cols-2 gap-3">
        {[
          { name: 'name', label: 'Name', type: 'text' },
          { name: 'email', label: 'Email', type: 'email' },
          { name: 'phone', label: 'Phone', type: 'text' },
          { name: 'license_number', label: 'License Number', type: 'text' },
          { name: 'license_expiry', label: 'License Expiry', type: 'date' },
        ].map(({ name, label, type }) => (
          <div key={name}>
            <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
            <input
              name={name}
              type={type}
              value={form[name]}
              onChange={handleChange}
              className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {loading ? 'Saving…' : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded hover:bg-gray-300 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}

function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState(null);

  const fetchDrivers = async () => {
    try {
      const { data } = await api.get('/fleet/drivers');
      setDrivers(data.drivers ?? data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load drivers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDrivers(); }, []);

  const handleAdd = async (form) => {
    setAddError('');
    setAddLoading(true);
    try {
      await api.post('/fleet/drivers', form);
      setShowAddForm(false);
      fetchDrivers();
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to add driver.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleEdit = async (form) => {
    setEditError('');
    setEditLoading(true);
    try {
      await api.patch(`/fleet/drivers/${editId}`, form);
      setEditId(null);
      fetchDrivers();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update driver.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this driver?')) return;
    setDeactivatingId(id);
    try {
      await api.patch(`/fleet/drivers/${id}/deactivate`);
      fetchDrivers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate driver.');
    } finally {
      setDeactivatingId(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar links={SIDEBAR_LINKS} />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Drivers</h2>
            <button
              onClick={() => { setShowAddForm((v) => !v); setAddError(''); }}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showAddForm ? 'Close' : 'Add Driver'}
            </button>
          </div>

          {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

          {showAddForm && (
            <div className="mb-6">
              <DriverForm
                onSubmit={handleAdd}
                onCancel={() => setShowAddForm(false)}
                loading={addLoading}
                error={addError}
                submitLabel="Add Driver"
              />
            </div>
          )}

          {loading ? <LoadingSpinner /> : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Name', 'Email', 'Phone', 'License No.', 'Expiry', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {drivers.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400 text-sm">No drivers found.</td></tr>
                  ) : drivers.map((driver) => (
                    <>
                      <tr key={driver.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{driver.name}</td>
                        <td className="px-4 py-3 text-gray-600">{driver.email}</td>
                        <td className="px-4 py-3 text-gray-600">{driver.phone}</td>
                        <td className="px-4 py-3 text-gray-600">{driver.license_number}</td>
                        <td className="px-4 py-3 text-gray-600">{driver.license_expiry ? new Date(driver.license_expiry).toLocaleDateString() : '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${driver.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {driver.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 flex gap-2">
                          <button
                            onClick={() => { setEditId(driver.id); setEditError(''); }}
                            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                          >
                            Edit
                          </button>
                          {driver.is_active && (
                            <button
                              onClick={() => handleDeactivate(driver.id)}
                              disabled={deactivatingId === driver.id}
                              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-60 transition-colors"
                            >
                              {deactivatingId === driver.id ? '…' : 'Deactivate'}
                            </button>
                          )}
                        </td>
                      </tr>
                      {editId === driver.id && (
                        <tr key={`edit-${driver.id}`}>
                          <td colSpan={7} className="px-4 py-3">
                            <DriverForm
                              initial={{
                                name: driver.name,
                                email: driver.email,
                                phone: driver.phone,
                                license_number: driver.license_number,
                                license_expiry: driver.license_expiry ? driver.license_expiry.split('T')[0] : '',
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

export default Drivers;
