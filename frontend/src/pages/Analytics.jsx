import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Boxes,
  CheckCircle2,
  Clock3,
  Gauge,
  GitBranch,
  PackageCheck,
  Route,
  Truck
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const statusColors = {
  PENDING: '#94a3b8',
  PACKED: '#818cf8',
  IN_TRANSIT: '#f59e0b',
  DELIVERED: '#10b981'
};

const formatStatus = (status) => status.replace('_', ' ');

const Analytics = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true);
      setError('');

      try {
        const [warehousesRes, shipmentsRes, driversRes] = await Promise.all([
          api.get('/warehouses'),
          api.get('/shipments'),
          api.get('/drivers')
        ]);
        setWarehouses(warehousesRes.data);
        setShipments(shipmentsRes.data);
        setDrivers(driversRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load analytics data.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  const statusData = useMemo(() => {
    const counts = shipments.reduce((acc, shipment) => {
      acc[shipment.status] = (acc[shipment.status] || 0) + 1;
      return acc;
    }, {});

    return ['PENDING', 'PACKED', 'IN_TRANSIT', 'DELIVERED'].map((status) => ({
      status,
      label: formatStatus(status),
      count: counts[status] || 0
    }));
  }, [shipments]);

  const warehousePressure = useMemo(() => (
    warehouses
      .map((warehouse) => ({
        ...warehouse,
        freeCapacity: Math.max(warehouse.capacity - warehouse.currentUsage, 0),
        usagePercent: warehouse.capacity > 0 ? Math.round((warehouse.currentUsage / warehouse.capacity) * 100) : 0,
        shipmentCount: warehouse._count?.shipments || shipments.filter((shipment) => shipment.warehouseId === warehouse.id).length
      }))
      .sort((a, b) => b.usagePercent - a.usagePercent)
  ), [warehouses, shipments]);

  const priorityQueue = useMemo(() => {
    const priorityRank = { Urgent: 4, High: 3, Normal: 2, Low: 1 };
    return shipments
      .filter((shipment) => shipment.status !== 'DELIVERED')
      .sort((a, b) => {
        const priorityDelta = (priorityRank[b.priority] || 0) - (priorityRank[a.priority] || 0);
        if (priorityDelta) return priorityDelta;
        return new Date(a.createdAt) - new Date(b.createdAt);
      })
      .slice(0, 5);
  }, [shipments]);

  const dispatchSuggestions = useMemo(() => {
    const availableDrivers = drivers.filter((driver) => driver.status === 'AVAILABLE');
    const openShipments = shipments.filter((shipment) => shipment.status === 'PENDING' || shipment.status === 'PACKED');

    return openShipments.slice(0, 4).map((shipment, index) => {
      const warehouse = warehousePressure.find((item) => item.id === shipment.warehouseId);
      const driver = availableDrivers[index % Math.max(availableDrivers.length, 1)];

      return {
        id: shipment.id,
        shipment,
        warehouse,
        driver,
        score: Math.max(62, 96 - index * 8 - (warehouse?.usagePercent > 85 ? 10 : 0))
      };
    });
  }, [drivers, shipments, warehousePressure]);

  const summary = useMemo(() => {
    const inMotion = shipments.filter((shipment) => shipment.status === 'IN_TRANSIT').length;
    const blockedCapacity = warehousePressure.filter((warehouse) => warehouse.usagePercent >= 90).length;
    const availableDrivers = drivers.filter((driver) => driver.status === 'AVAILABLE').length;
    const unresolved = shipments.filter((shipment) => shipment.status !== 'DELIVERED').length;

    return { inMotion, blockedCapacity, availableDrivers, unresolved };
  }, [drivers, shipments, warehousePressure]);

  if (loading) {
    return <div className="py-20 text-center italic text-white">Loading route intelligence...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Route Intelligence</h1>
          <p className="mt-1 text-slate-400">Operational flow, capacity pressure, and dispatch priorities</p>
        </div>
        <div className="flex rounded-xl border border-slate-800 bg-slate-900 p-1">
          <button className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white">
            <GitBranch className="h-4 w-4" /> Flow View
          </button>
          <button className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-slate-400 transition-all hover:text-white">
            <BarChart3 className="h-4 w-4" /> Data View
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Shipments in motion', value: summary.inMotion, icon: Truck, tone: 'text-amber-300' },
          { label: 'Open workload', value: summary.unresolved, icon: Boxes, tone: 'text-sky-300' },
          { label: 'Available drivers', value: summary.availableDrivers, icon: CheckCircle2, tone: 'text-emerald-300' },
          { label: 'Capacity alerts', value: summary.blockedCapacity, icon: AlertTriangle, tone: 'text-red-300' }
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">{item.label}</span>
              <item.icon className={`h-5 w-5 ${item.tone}`} />
            </div>
            <p className="mt-4 text-3xl font-bold text-white">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.45fr_0.9fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Dispatch Flow Board</h2>
              <p className="mt-1 text-sm text-slate-500">Suggested next moves from open shipments and current capacity</p>
            </div>
            <Route className="h-6 w-6 text-primary-500" />
          </div>

          <div className="space-y-4">
            {dispatchSuggestions.map((item) => (
              <div key={item.id} className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-950 p-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Shipment</p>
                  <p className="mt-1 font-semibold text-white">#{item.shipment.id.slice(0, 8)}</p>
                  <p className="text-sm text-slate-400">{item.shipment.source} to {item.shipment.destination}</p>
                </div>
                <ArrowRight className="hidden h-5 w-5 text-slate-700 lg:block" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Warehouse</p>
                  <p className="mt-1 font-semibold text-white">{item.warehouse?.name || 'Assign hub'}</p>
                  <p className="text-sm text-slate-400">{item.warehouse ? `${item.warehouse.freeCapacity} kg free` : 'No linked capacity'}</p>
                </div>
                <ArrowRight className="hidden h-5 w-5 text-slate-700 lg:block" />
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Dispatch</p>
                    <p className="mt-1 font-semibold text-white">{item.driver?.name || 'No driver free'}</p>
                    <p className="text-sm text-slate-400">{item.score}% readiness</p>
                  </div>
                  <div className="h-12 w-12 rounded-full border border-primary-500/30 bg-primary-500/10 text-center text-sm font-bold leading-[3rem] text-primary-300">
                    {item.score}
                  </div>
                </div>
              </div>
            ))}

            {dispatchSuggestions.length === 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-10 text-center">
                <PackageCheck className="mx-auto mb-3 h-10 w-10 text-emerald-400" />
                <h3 className="font-bold text-white">No dispatch conflicts</h3>
                <p className="mt-1 text-sm text-slate-500">Open shipments are clear, or everything has already been delivered.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Shipment State</h2>
              <Gauge className="h-5 w-5 text-primary-500" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="count" nameKey="label" innerRadius={62} outerRadius={88} paddingAngle={3}>
                    {statusData.map((entry) => (
                      <Cell key={entry.status} fill={statusColors[entry.status]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {statusData.map((item) => (
                <div key={item.status} className="flex items-center gap-2 text-sm text-slate-400">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: statusColors[item.status] }} />
                  {item.label}: <span className="font-bold text-white">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Priority Queue</h2>
              <Clock3 className="h-5 w-5 text-amber-400" />
            </div>
            <div className="space-y-3">
              {priorityQueue.map((shipment) => (
                <div key={shipment.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
                  <div>
                    <p className="font-semibold text-white">#{shipment.id.slice(0, 8)}</p>
                    <p className="text-xs text-slate-500">{shipment.priority} priority</p>
                  </div>
                  <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-300">
                    {formatStatus(shipment.status)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Warehouse Pressure</h2>
            <p className="mt-1 text-sm text-slate-500">Capacity usage by hub, ranked by operational risk</p>
          </div>
          <AlertTriangle className="h-6 w-6 text-amber-400" />
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={warehousePressure} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(14, 165, 233, 0.08)' }}
                contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff' }}
              />
              <Bar dataKey="usagePercent" name="Usage %" radius={[8, 8, 0, 0]}>
                {warehousePressure.map((warehouse) => (
                  <Cell key={warehouse.id} fill={warehouse.usagePercent > 90 ? '#ef4444' : warehouse.usagePercent > 75 ? '#f59e0b' : '#0ea5e9'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
