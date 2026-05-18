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
  Truck,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Layers,
  Users
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
  YAxis,
  AreaChart,
  Area
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
  const [viewMode, setViewMode] = useState('flow'); // 'flow' or 'data'

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

  useEffect(() => {
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

  const driverLoadData = useMemo(() => {
    return drivers.map(driver => {
      const activeShipments = shipments.filter(s => s.driverId === driver.id && s.status !== 'DELIVERED').length;
      return {
        name: driver.name.split(' ')[0],
        load: activeShipments,
        status: driver.status
      };
    }).sort((a, b) => b.load - a.load);
  }, [drivers, shipments]);

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
    const availableDriversCount = drivers.filter((driver) => driver.status === 'AVAILABLE').length;
    const unresolved = shipments.filter((shipment) => shipment.status !== 'DELIVERED').length;
    const averageLoad = shipments.length > 0 ? (shipments.length / warehouses.length).toFixed(1) : 0;

    return { inMotion, blockedCapacity, availableDriversCount, unresolved, averageLoad };
  }, [drivers, shipments, warehousePressure, warehouses]);

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
        <p className="text-lg font-medium text-slate-400">Synthesizing operational data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header with Toggle */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white">Route Intelligence</h1>
          <p className="mt-2 text-slate-400">Real-time logistics analytics and dispatch optimization</p>
        </div>
        <div className="flex rounded-2xl border border-slate-800 bg-slate-900/50 p-1.5 backdrop-blur-md">
          <button 
            onClick={() => setViewMode('flow')}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
              viewMode === 'flow' 
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <GitBranch className="h-4 w-4" /> Flow View
          </button>
          <button 
            onClick={() => setViewMode('data')}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
              viewMode === 'data' 
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="h-4 w-4" /> Data View
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-4 text-red-200">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Active Shipments', value: summary.unresolved, icon: Boxes, color: 'bg-blue-500' },
          { label: 'Fleet Availability', value: summary.availableDriversCount, icon: Users, color: 'bg-emerald-500' },
          { label: 'Transit Volume', value: summary.inMotion, icon: Truck, color: 'bg-amber-500' },
          { label: 'Critical Hubs', value: summary.blockedCapacity, icon: AlertTriangle, color: 'bg-rose-500' }
        ].map((item) => (
          <div key={item.label} className="group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-6 transition-all hover:border-slate-700">
            <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full ${item.color} opacity-[0.03] transition-transform group-hover:scale-150`} />
            <div className="flex items-center justify-between">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.color} bg-opacity-10`}>
                <item.icon className={`h-6 w-6 ${item.color.replace('bg-', 'text-')}`} />
              </div>
            </div>
            <div className="mt-6">
              <p className="text-sm font-medium text-slate-400">{item.label}</p>
              <p className="mt-1 text-3xl font-black text-white">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {viewMode === 'flow' ? (
        /* FLOW VIEW CONTENT */
        <div className="grid gap-8 xl:grid-cols-[1.5fr_1fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Dispatch Optimizer</h2>
                <p className="mt-1 text-slate-500">AI-suggested assignments based on current load and proximity</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500/10">
                <Route className="h-6 w-6 text-primary-500" />
              </div>
            </div>

            <div className="space-y-4">
              {dispatchSuggestions.map((item) => (
                <div key={item.id} className="group grid gap-6 rounded-2xl border border-slate-800 bg-slate-950 p-5 transition-all hover:border-primary-500/30 lg:grid-cols-[1.2fr_auto_1fr_auto_1.2fr] lg:items-center">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Origin Load</p>
                    <p className="mt-1 font-mono font-bold text-white text-sm">{item.shipment.trackingNumber || `#${item.shipment.id.slice(-8).toUpperCase()}`}</p>
                    <p className="truncate text-sm text-slate-400">{item.shipment.source}</p>
                  </div>
                  <ArrowRight className="hidden h-5 w-5 text-slate-800 lg:block group-hover:text-primary-500" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Relay Point</p>
                    <p className="mt-1 font-bold text-white">{item.warehouse?.name || 'Manual Assignment'}</p>
                    <p className="text-sm text-slate-400">{item.warehouse ? `${item.warehouse.usagePercent}% Capacity` : 'Hub required'}</p>
                  </div>
                  <ArrowRight className="hidden h-5 w-5 text-slate-800 lg:block group-hover:text-primary-500" />
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Fleet Dispatch</p>
                      <p className="mt-1 font-bold text-white">{item.driver?.name || 'Awaiting Driver'}</p>
                      <p className="text-sm text-slate-400">{item.score}% Logic Score</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary-500/20 bg-primary-500/5 text-sm font-black text-primary-400 shadow-[0_0_15px_rgba(14,165,233,0.1)]">
                      {item.score}
                    </div>
                  </div>
                </div>
              ))}
              {dispatchSuggestions.length === 0 && (
                <div className="rounded-3xl border-2 border-dashed border-slate-800 p-20 text-center">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
                    <PackageCheck className="h-10 w-10 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Operational Flow Clear</h3>
                  <p className="mt-2 text-slate-500">No pending shipments require immediate optimization.</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Network Load</h2>
                <Gauge className="h-5 w-5 text-primary-500" />
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={statusData} 
                      dataKey="count" 
                      nameKey="label" 
                      innerRadius={75} 
                      outerRadius={105} 
                      paddingAngle={8}
                      stroke="none"
                    >
                      {statusData.map((entry) => (
                        <Cell key={entry.status} fill={statusColors[entry.status]} className="transition-all hover:opacity-80" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '16px', color: '#fff', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-4">
                {statusData.map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: statusColors[item.status] }} />
                      <span className="text-sm font-medium text-slate-400">{item.label}</span>
                    </div>
                    <span className="text-sm font-bold text-white">{item.count} units</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Priority Queue</h2>
                <Clock3 className="h-5 w-5 text-amber-400" />
              </div>
              <div className="space-y-4">
                {priorityQueue.map((shipment) => (
                  <div key={shipment.id} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950 p-4 transition-transform hover:scale-[1.02]">
                    <div className="flex items-center gap-4">
                      <div className={`h-2 w-2 rounded-full ${shipment.priority === 'Urgent' ? 'bg-rose-500 animate-pulse shadow-[0_0_8px_#f43f5e]' : shipment.priority === 'High' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                      <div>
                        <p className="font-mono font-bold text-white text-sm">{shipment.trackingNumber || `#${shipment.id.slice(-8).toUpperCase()}`}</p>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{shipment.priority}</p>
                      </div>
                    </div>
                    <span className="rounded-xl bg-slate-800 px-3 py-1.5 text-[10px] font-black uppercase text-slate-300">
                      {formatStatus(shipment.status)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* DATA VIEW CONTENT */
        <div className="grid gap-8">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Driver Load Analysis */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Fleet Distribution</h2>
                  <p className="mt-1 text-slate-500">Current workload per active driver</p>
                </div>
                <Users className="h-6 w-6 text-indigo-400" />
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={driverLoadData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={true} vertical={false} />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      stroke="#94a3b8" 
                      fontSize={12} 
                      fontWeight="bold"
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px' }}
                    />
                    <Bar dataKey="load" radius={[0, 10, 10, 0]} barSize={24}>
                      {driverLoadData.map((entry, index) => (
                        <Cell key={index} fill={entry.status === 'AVAILABLE' ? '#10b981' : '#6366f1'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex justify-center gap-6">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                  <span className="h-3 w-3 rounded-full bg-emerald-500" /> Available
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                  <span className="h-3 w-3 rounded-full bg-indigo-500" /> Active
                </div>
              </div>
            </div>

            {/* Network Utilization Area Chart */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Operational Pressure</h2>
                  <p className="mt-1 text-slate-500">Live capacity utilization across network</p>
                </div>
                <Activity className="h-6 w-6 text-primary-500" />
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={warehousePressure}>
                    <defs>
                      <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" hide />
                    <YAxis stroke="#94a3b8" fontSize={12} fontWeight="bold" axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="usagePercent" 
                      stroke="#0ea5e9" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorUsage)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Detailed Data Table */}
          <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-800 p-8">
              <div>
                <h2 className="text-2xl font-bold text-white">Hub Efficiency Metrics</h2>
                <p className="mt-1 text-slate-500">Detailed breakdown of warehouse throughput and capacity</p>
              </div>
              <Layers className="h-6 w-6 text-slate-500" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-950/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    <th className="px-8 py-5">Warehouse Hub</th>
                    <th className="px-8 py-5">Location</th>
                    <th className="px-8 py-5 text-center">Load Factor</th>
                    <th className="px-8 py-5">Current Usage</th>
                    <th className="px-8 py-5">Max Capacity</th>
                    <th className="px-8 py-5">Health</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {warehousePressure.map((w) => (
                    <tr key={w.id} className="transition-colors hover:bg-slate-800/30">
                      <td className="px-8 py-6 font-bold text-white">{w.name}</td>
                      <td className="px-8 py-6 text-slate-400">{w.locationName}</td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-center gap-3">
                          <span className="text-xs font-black text-slate-300">{w.usagePercent}%</span>
                          <div className="h-1.5 w-24 rounded-full bg-slate-800">
                            <div 
                              className={`h-full rounded-full ${w.usagePercent > 90 ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]' : w.usagePercent > 70 ? 'bg-amber-500' : 'bg-primary-500'}`}
                              style={{ width: `${w.usagePercent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 font-medium text-slate-300">{w.currentUsage.toLocaleString()} kg</td>
                      <td className="px-8 py-6 font-medium text-slate-500">{w.capacity.toLocaleString()} kg</td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase ${
                          w.usagePercent > 90 ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 
                          w.usagePercent > 70 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 
                          'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        }`}>
                          {w.usagePercent > 90 ? 'Critical' : w.usagePercent > 70 ? 'Strained' : 'Healthy'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
