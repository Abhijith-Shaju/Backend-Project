import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import FormModal from '../components/FormModal';
import { Plus, Warehouse as WarehouseIcon, MapPin, HardDrive, MoreVertical, Search, Edit2, Trash2 } from 'lucide-react';

const fieldClass = 'w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20';

const initialForm = {
  name: '',
  locationName: '',
  lat: '',
  lng: '',
  capacity: '',
  currentUsage: ''
};

const Warehouses = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [activeMenu, setActiveMenu] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/warehouses');
      setWarehouses(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load warehouses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
    
    // Close menu when clicking outside
    const handleClickOutside = () => setActiveMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const filteredWarehouses = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return warehouses.filter((warehouse) =>
      warehouse.name.toLowerCase().includes(query) ||
      warehouse.locationName.toLowerCase().includes(query)
    );
  }, [warehouses, searchTerm]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleCreate = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowModal(true);
  };

  const handleEdit = (warehouse) => {
    setForm({
      name: warehouse.name,
      locationName: warehouse.locationName,
      lat: warehouse.lat,
      lng: warehouse.lng,
      capacity: warehouse.capacity,
      currentUsage: warehouse.currentUsage
    });
    setEditingId(warehouse.id);
    setShowModal(true);
    setActiveMenu(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this warehouse? This will unlinked all shipments associated with it.')) return;
    
    try {
      await api.delete(`/warehouses/${id}`);
      setWarehouses((current) => current.filter((w) => w.id !== id));
      setActiveMenu(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete warehouse. You might need ADMIN permissions.');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        ...form,
        lat: Number(form.lat),
        lng: Number(form.lng),
        capacity: Number(form.capacity),
        currentUsage: form.currentUsage === '' ? 0 : Number(form.currentUsage)
      };

      if (editingId) {
        await api.put(`/warehouses/${editingId}`, payload);
      } else {
        await api.post('/warehouses', payload);
      }
      await fetchWarehouses();
      setForm(initialForm);
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Could not save warehouse.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Warehouses</h1>
          <p className="mt-1 text-slate-400">Monitor storage capacity and locations</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 font-semibold text-white shadow-lg shadow-primary-500/20 transition-all hover:bg-primary-500"
        >
          <Plus className="h-5 w-5" />
          Add Warehouse
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
          placeholder="Search warehouses by name or location..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="w-full rounded-2xl border border-slate-800 bg-slate-900 py-3 pl-12 pr-4 text-white transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="col-span-full text-center text-white">Loading warehouses...</p>
        ) : filteredWarehouses.map((warehouse) => {
          const usagePercent = warehouse.capacity > 0 ? Math.round((warehouse.currentUsage / warehouse.capacity) * 100) : 0;
          return (
            <div key={warehouse.id} className={`group rounded-3xl border border-slate-800 bg-slate-900 p-8 transition-all hover:border-slate-700 relative ${activeMenu === warehouse.id ? 'z-40' : 'z-10'}`}>
              <div className="flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 transition-all group-hover:border-primary-500/20">
                  <WarehouseIcon className="h-7 w-7 text-primary-500" />
                </div>
                <div className="relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenu(activeMenu === warehouse.id ? null : warehouse.id);
                    }}
                    className="rounded-xl p-2 transition-colors hover:bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>

                  {activeMenu === warehouse.id && (
                    <div className="absolute right-0 top-11 z-20 w-40 overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-2xl animate-in fade-in zoom-in duration-200">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleEdit(warehouse); }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit Hub
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(warehouse.id); }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Hub
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-xl font-bold text-white">{warehouse.name}</h3>
                <div className="mt-2 flex items-center gap-2 text-slate-400">
                  <MapPin className="h-4 w-4 text-slate-500" />
                  <span className="text-sm">{warehouse.locationName}</span>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <div className="mb-1 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <HardDrive className="h-4 w-4" />
                    <span>Utilization</span>
                  </div>
                  <span className={`font-bold ${usagePercent > 90 ? 'text-red-500' : 'text-primary-500'}`}>
                    {usagePercent}%
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full border border-slate-800 bg-slate-950 p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${usagePercent > 90 ? 'bg-red-500' : 'bg-primary-500 shadow-[0_0_10px_rgba(14,165,233,0.3)]'}`}
                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between px-1 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  <span>{warehouse.currentUsage} kg</span>
                  <span>{warehouse.capacity} kg</span>
                </div>
              </div>
            </div>
          );
        })}
        {!loading && filteredWarehouses.length === 0 && (
          <div className="col-span-full rounded-3xl border border-slate-800 bg-slate-900 p-16 text-center">
            <WarehouseIcon className="mx-auto mb-4 h-14 w-14 text-slate-800" />
            <h3 className="text-xl font-bold text-white">No warehouses found</h3>
            <p className="mt-2 text-slate-500">Add a warehouse to connect storage capacity to shipments.</p>
          </div>
        )}
      </div>

      {showModal && (
        <FormModal 
          title={editingId ? 'Edit Warehouse' : 'Add Warehouse'} 
          description={editingId ? 'Update hub capacity and location details.' : 'Create a hub that can be assigned to shipments and dashboard capacity tracking.'} 
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-300">
                Warehouse name
                <input name="name" value={form.name} onChange={handleChange} className={fieldClass} required />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-300">
                Location
                <input name="locationName" value={form.locationName} onChange={handleChange} className={fieldClass} placeholder="City, State" required />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-300">
                Latitude
                <input name="lat" type="number" step="0.0001" value={form.lat} onChange={handleChange} className={fieldClass} required />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-300">
                Longitude
                <input name="lng" type="number" step="0.0001" value={form.lng} onChange={handleChange} className={fieldClass} required />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-300">
                Capacity (kg)
                <input name="capacity" type="number" min="1" value={form.capacity} onChange={handleChange} className={fieldClass} required />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-300">
                Current usage (kg)
                <input name="currentUsage" type="number" min="0" value={form.currentUsage} onChange={handleChange} className={fieldClass} placeholder="0" />
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="rounded-xl border border-slate-800 px-5 py-3 font-semibold text-slate-300 transition-colors hover:bg-slate-800">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="rounded-xl bg-primary-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? 'Saving...' : editingId ? 'Update Warehouse' : 'Add Warehouse'}
              </button>
            </div>
          </form>
        </FormModal>
      )}
    </div>
  );
};

export default Warehouses;
