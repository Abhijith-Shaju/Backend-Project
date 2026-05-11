import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import FormModal from '../components/FormModal';
import {
  Plus,
  Search,
  Filter,
  Package,
  MapPin,
  Clock,
  ArrowRight,
  UserRound,
  Warehouse
} from 'lucide-react';

const statuses = ['PENDING', 'PACKED', 'IN_TRANSIT', 'DELIVERED'];
const priorities = ['Low', 'Normal', 'High', 'Urgent'];

const fieldClass = 'w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20';

const StatusBadge = ({ status }) => {
  const styles = {
    PENDING: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
    PACKED: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
    IN_TRANSIT: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    DELIVERED: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  };

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${styles[status] || styles.PENDING}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

const initialForm = {
  source: '',
  destination: '',
  weight: '',
  priority: 'Normal',
  warehouseId: '',
  driverId: ''
};

const Shipments = () => {
  const [shipments, setShipments] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [shipmentsRes, driversRes, warehousesRes] = await Promise.all([
        api.get('/shipments'),
        api.get('/drivers'),
        api.get('/warehouses')
      ]);
      setShipments(shipmentsRes.data);
      setDrivers(driversRes.data);
      setWarehouses(warehousesRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load shipment data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredShipments = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return shipments.filter((shipment) => {
      const matchesSearch =
        shipment.id.toLowerCase().includes(query) ||
        shipment.source.toLowerCase().includes(query) ||
        shipment.destination.toLowerCase().includes(query) ||
        shipment.driver?.name?.toLowerCase().includes(query);

      const matchesStatus = statusFilter === 'ALL' || shipment.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [shipments, searchTerm, statusFilter]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      await api.post('/shipments', {
        ...form,
        weight: Number(form.weight),
        warehouseId: form.warehouseId || null,
        driverId: form.driverId || null
      });
      setForm(initialForm);
      setShowCreateModal(false);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Could not create shipment.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (shipmentId, status) => {
    setError('');
    try {
      const res = await api.patch(`/shipments/${shipmentId}/status`, { status });
      setShipments((current) => current.map((shipment) => (shipment.id === shipmentId ? res.data : shipment)));
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update shipment status.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Shipment Management</h1>
          <p className="mt-1 text-slate-400">Track, assign, and move deliveries through the network</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 font-semibold text-white shadow-lg shadow-primary-500/20 transition-all hover:bg-primary-500"
        >
          <Plus className="h-5 w-5" />
          Create Shipment
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by ID, source, destination, or driver..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-2xl border border-slate-800 bg-slate-900 py-3 pl-12 pr-4 text-white transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <div className="relative min-w-48">
          <Filter className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full appearance-none rounded-2xl border border-slate-800 bg-slate-900 py-3 pl-12 pr-4 text-slate-300 outline-none transition-all focus:border-primary-500"
          >
            <option value="ALL">All statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>{status.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center italic text-white">Loading shipments...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredShipments.map((shipment) => (
            <div key={shipment.id} className="group rounded-3xl border border-slate-800 bg-slate-900 p-6 transition-all hover:border-primary-500/30">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
                <div className="flex flex-1 items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 transition-all group-hover:border-primary-500/20">
                    <Package className="h-6 w-6 text-primary-500" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">#{shipment.id.slice(0, 8)}</h4>
                    <p className="text-sm font-medium text-slate-500">{shipment.priority} Priority | {shipment.weight} kg</p>
                  </div>
                </div>

                <div className="flex-[2] items-center gap-8 md:flex">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <MapPin className="h-3 w-3" /> Source
                    </div>
                    <p className="truncate font-medium text-white">{shipment.source}</p>
                  </div>
                  <div className="hidden px-4 md:flex">
                    <ArrowRight className="h-5 w-5 text-slate-700" />
                  </div>
                  <div className="mt-4 min-w-0 flex-1 md:mt-0">
                    <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <MapPin className="h-3 w-3" /> Destination
                    </div>
                    <p className="truncate font-medium text-white">{shipment.destination}</p>
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-3 border-t border-slate-800 pt-4 lg:border-t-0 lg:pt-0">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <StatusBadge status={shipment.status} />
                    <select
                      value={shipment.status}
                      onChange={(event) => handleStatusChange(shipment.id, event.target.value)}
                      className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-300 outline-none focus:border-primary-500"
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>{status.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2 text-xs text-slate-500">
                    <span className="flex items-center gap-2"><UserRound className="h-3 w-3" /> {shipment.driver?.name || 'No driver assigned'}</span>
                    <span className="flex items-center gap-2"><Warehouse className="h-3 w-3" /> {shipment.warehouse?.name || 'No warehouse linked'}</span>
                    <span className="flex items-center gap-2"><Clock className="h-3 w-3" /> {new Date(shipment.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filteredShipments.length === 0 && (
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-20 text-center">
              <Package className="mx-auto mb-4 h-16 w-16 text-slate-800" />
              <h3 className="text-xl font-bold text-white">No shipments found</h3>
              <p className="mt-2 text-slate-500">Try adjusting your search or create a new shipment.</p>
            </div>
          )}
        </div>
      )}

      {showCreateModal && (
        <FormModal
          title="Create Shipment"
          description="Assign a shipment to a warehouse and optionally dispatch it with a driver."
          onClose={() => setShowCreateModal(false)}
        >
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-300">
                Source
                <input name="source" value={form.source} onChange={handleChange} className={fieldClass} required />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-300">
                Destination
                <input name="destination" value={form.destination} onChange={handleChange} className={fieldClass} required />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-300">
                Weight (kg)
                <input name="weight" type="number" min="1" step="0.1" value={form.weight} onChange={handleChange} className={fieldClass} required />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-300">
                Priority
                <select name="priority" value={form.priority} onChange={handleChange} className={fieldClass}>
                  {priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                </select>
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-300">
                Warehouse
                <select name="warehouseId" value={form.warehouseId} onChange={handleChange} className={fieldClass}>
                  <option value="">No warehouse</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} ({warehouse.capacity - warehouse.currentUsage} kg free)
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-300">
                Driver
                <select name="driverId" value={form.driverId} onChange={handleChange} className={fieldClass}>
                  <option value="">Assign later</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} - {driver.vehicleNumber} ({driver.status})
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowCreateModal(false)} className="rounded-xl border border-slate-800 px-5 py-3 font-semibold text-slate-300 transition-colors hover:bg-slate-800">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="rounded-xl bg-primary-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? 'Creating...' : 'Create Shipment'}
              </button>
            </div>
          </form>
        </FormModal>
      )}
    </div>
  );
};

export default Shipments;
