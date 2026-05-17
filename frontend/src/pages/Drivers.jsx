import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import FormModal from '../components/FormModal';
import { Plus, Search, User, Phone, Car, CheckCircle, XCircle, MoreVertical, Edit2, Trash2 } from 'lucide-react';

const fieldClass = 'w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20';

const initialForm = {
  name: '',
  phone: '',
  vehicleNumber: '',
  status: 'AVAILABLE'
};

const Drivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [activeMenu, setActiveMenu] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/drivers');
      setDrivers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load drivers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
    
    // Close menu when clicking outside
    const handleClickOutside = () => setActiveMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const filteredDrivers = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return drivers.filter((driver) =>
      driver.name.toLowerCase().includes(query) ||
      driver.phone.toLowerCase().includes(query) ||
      driver.vehicleNumber.toLowerCase().includes(query)
    );
  }, [drivers, searchTerm]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleCreate = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowModal(true);
  };

  const handleEdit = (driver) => {
    setForm({
      name: driver.name,
      phone: driver.phone,
      vehicleNumber: driver.vehicleNumber,
      status: driver.status
    });
    setEditingId(driver.id);
    setShowModal(true);
    setActiveMenu(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this driver?')) return;
    
    try {
      await api.delete(`/drivers/${id}`);
      setDrivers((current) => current.filter((d) => d.id !== id));
      setActiveMenu(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete driver. You might need ADMIN permissions.');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (editingId) {
        const res = await api.put(`/drivers/${editingId}`, form);
        setDrivers((current) => current.map((d) => (d.id === editingId ? res.data : d)));
      } else {
        const res = await api.post('/drivers', form);
        setDrivers((current) => [res.data, ...current]);
      }
      setForm(initialForm);
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Could not save driver.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Drivers</h1>
          <p className="mt-1 text-slate-400">Manage your delivery fleet and availability</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 font-semibold text-white shadow-lg shadow-primary-500/20 transition-all hover:bg-primary-500"
        >
          <Plus className="h-5 w-5" />
          Add Driver
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200">
          {error}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search drivers by name, phone, or vehicle..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="w-full rounded-2xl border border-slate-800 bg-slate-900 py-3 pl-12 pr-4 text-white transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="col-span-full text-center text-white">Loading drivers...</p>
        ) : filteredDrivers.map((driver) => (
          <div key={driver.id} className="group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-6 transition-all hover:border-slate-700">
            <div className="relative z-10 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 transition-all group-hover:border-primary-500/20">
                  <User className="h-7 w-7 text-primary-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{driver.name}</h3>
                  <div className={`mt-1 flex items-center gap-1.5 text-xs font-bold ${driver.status === 'AVAILABLE' ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {driver.status === 'AVAILABLE' ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {driver.status.replace('_', ' ')}
                  </div>
                </div>
              </div>
              <div className="relative">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenu(activeMenu === driver.id ? null : driver.id);
                  }}
                  className="rounded-xl p-2 transition-colors hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
                
                {activeMenu === driver.id && (
                  <div className="absolute right-0 top-11 z-20 w-40 overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-2xl animate-in fade-in zoom-in duration-200">
                    <button 
                      onClick={() => handleEdit(driver)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit Details
                    </button>
                    <button 
                      onClick={() => handleDelete(driver.id)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Driver
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="relative z-10 mt-8 space-y-4">
              <div className="flex items-center gap-3 text-slate-400">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-950">
                  <Phone className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">{driver.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-950">
                  <Car className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">Vehicle: {driver.vehicleNumber}</span>
              </div>
            </div>
          </div>
        ))}
        {!loading && filteredDrivers.length === 0 && (
          <div className="col-span-full rounded-3xl border border-slate-800 bg-slate-900 p-16 text-center">
            <User className="mx-auto mb-4 h-14 w-14 text-slate-800" />
            <h3 className="text-xl font-bold text-white">No drivers found</h3>
            <p className="mt-2 text-slate-500">Add a driver to start assigning deliveries.</p>
          </div>
        )}
      </div>

      {showModal && (
        <FormModal 
          title={editingId ? 'Edit Driver' : 'Add Driver'} 
          description={editingId ? 'Update driver profile and vehicle information.' : 'Register a driver and vehicle for dispatch assignment.'} 
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSubmit} className="grid gap-4">
            <label className="grid gap-2 text-sm font-medium text-slate-300">
              Driver name
              <input name="name" value={form.name} onChange={handleChange} className={fieldClass} required />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-300">
                Phone
                <input name="phone" value={form.phone} onChange={handleChange} className={fieldClass} required />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-300">
                Vehicle number
                <input name="vehicleNumber" value={form.vehicleNumber} onChange={handleChange} className={fieldClass} required />
              </label>
            </div>
            <label className="grid gap-2 text-sm font-medium text-slate-300">
              Status
              <select name="status" value={form.status} onChange={handleChange} className={fieldClass}>
                <option value="AVAILABLE">Available</option>
                <option value="ON_DELIVERY">On delivery</option>
                <option value="UNAVAILABLE">Unavailable</option>
              </select>
            </label>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="rounded-xl border border-slate-800 px-5 py-3 font-semibold text-slate-300 transition-colors hover:bg-slate-800">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="rounded-xl bg-primary-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? 'Saving...' : editingId ? 'Update Driver' : 'Add Driver'}
              </button>
            </div>
          </form>
        </FormModal>
      )}
    </div>
  );
};

export default Drivers;
