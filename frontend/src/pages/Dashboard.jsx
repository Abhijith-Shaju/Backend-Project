import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Package, 
  Truck, 
  Warehouse, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  Activity
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell
} from 'recharts';

const StatCard = ({ title, value, icon: Icon, color, bgGradient, trend }) => (
  <div className={`relative overflow-hidden rounded-3xl p-1 bg-gradient-to-br ${bgGradient} group transition-all duration-500 hover:shadow-2xl hover:shadow-${color}-500/20 hover:-translate-y-1`}>
    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-3xl m-[1px] rounded-[23px] transition-all duration-500 group-hover:bg-slate-900/80"></div>
    <div className="relative p-6 z-10">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1 uppercase tracking-wider">{title}</p>
          <h3 className="text-4xl font-extrabold text-white mt-2 tracking-tight">{value}</h3>
          {trend && (
            <div className="flex items-center gap-1.5 mt-3">
              <div className={`flex items-center justify-center p-1 rounded-full bg-${color}-500/20`}>
                <TrendingUp className={`w-3 h-3 text-${color}-400`} />
              </div>
              <p className={`text-${color}-400 text-xs font-semibold`}>{trend}</p>
            </div>
          )}
        </div>
        <div className={`p-4 rounded-2xl bg-gradient-to-br ${bgGradient} shadow-lg shadow-${color}-500/30 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/analytics/dashboard');
        setStats(res.data);
      } catch (err) {
        console.error('Error fetching dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-slate-800"></div>
          <div className="w-16 h-16 rounded-full border-4 border-primary-500 border-t-transparent animate-spin absolute top-0 left-0"></div>
          <Package className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary-500 animate-pulse w-6 h-6" />
        </div>
        <p className="text-slate-400 font-medium animate-pulse tracking-wide">Syncing real-time network data...</p>
      </div>
    );
  }

  const summary = stats?.summary || {};

  const chartData = [
    { name: 'Pending', count: summary.pendingShipments || 0 },
    { name: 'In Transit', count: summary.inTransitShipments || 0 },
    { name: 'Delivered', count: summary.deliveredShipments || 0 },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 p-4 rounded-2xl shadow-2xl">
          <p className="text-slate-300 font-medium mb-1">{label}</p>
          <p className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary-500"></span>
            {payload[0].value} <span className="text-sm font-normal text-slate-400 ml-1">shipments</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      
      {/* Header Area with Live Status */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Live Network Status
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
            Logistics Overview
          </h1>
          <p className="text-slate-400 mt-2 text-lg">Real-time supply chain monitoring and network analytics</p>
        </div>
      </div>

      {/* Hero Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Volume" 
          value={summary.totalShipments || 0} 
          icon={Package} 
          color="primary"
          bgGradient="from-primary-500 to-indigo-600"
          trend="Total orders processed"
        />
        <StatCard 
          title="In Transit" 
          value={summary.inTransitShipments || 0} 
          icon={Truck} 
          color="amber"
          bgGradient="from-amber-400 to-orange-600"
          trend="Currently on the road"
        />
        <StatCard 
          title="Delivered" 
          value={summary.deliveredShipments || 0} 
          icon={CheckCircle2} 
          color="emerald"
          bgGradient="from-emerald-400 to-teal-600"
          trend={summary.totalShipments > 0 ? `${Math.round((summary.deliveredShipments / summary.totalShipments) * 100)}% success rate` : '0% success rate'}
        />
        <StatCard 
          title="Active Drivers" 
          value={summary.activeDrivers || 0} 
          icon={Warehouse} 
          color="indigo"
          bgGradient="from-indigo-400 to-purple-600"
          trend="Drivers available & active"
        />
      </div>

      {/* Main Charts & Analytics Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Large Chart Column */}
        <div className="lg:col-span-2 relative group p-[1px] rounded-3xl bg-gradient-to-b from-slate-700/50 to-slate-800/20 overflow-hidden">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-3xl m-[1px] rounded-[23px] z-0"></div>
          <div className="relative p-8 z-10 flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Activity className="w-6 h-6 text-primary-500" />
                  Shipment Distribution
                </h3>
                <p className="text-slate-400 text-sm mt-1">Current state of the entire fulfillment pipeline</p>
              </div>
            </div>
            
            <div className="flex-1 min-h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#94a3b8', fontSize: 13, fontWeight: 500}} axisLine={false} tickLine={false} dy={10} />
                  <YAxis stroke="#64748b" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: '#1e293b', opacity: 0.4}} />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#0ea5e9" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorCount)" 
                    activeDot={{ r: 8, fill: "#0ea5e9", stroke: "#0f172a", strokeWidth: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Warehouse Utilization Column */}
        <div className="relative group p-[1px] rounded-3xl bg-gradient-to-b from-slate-700/50 to-slate-800/20 overflow-hidden flex flex-col">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-3xl m-[1px] rounded-[23px] z-0"></div>
          <div className="relative p-8 z-10 flex-1 flex flex-col">
            <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
              <Warehouse className="w-6 h-6 text-indigo-400" />
              Warehouses
            </h3>
            <p className="text-slate-400 text-sm mb-8">Real-time capacity utilization across all facilities</p>
            
            <div className="space-y-7 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {stats?.warehouses?.map((w, index) => {
                const percentage = Math.round((w.currentUsage / w.capacity) * 100);
                const isNearCapacity = percentage > 85;
                const isModerate = percentage > 60 && percentage <= 85;
                
                let barColor = 'bg-primary-500';
                let shadowColor = 'shadow-primary-500/50';
                
                if (isNearCapacity) {
                  barColor = 'bg-rose-500';
                  shadowColor = 'shadow-rose-500/50';
                } else if (isModerate) {
                  barColor = 'bg-amber-500';
                  shadowColor = 'shadow-amber-500/50';
                }

                return (
                  <div key={index} className="space-y-3 group/item">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-white font-bold text-lg block group-hover/item:text-primary-400 transition-colors">{w.name}</span>
                        <span className="text-slate-500 text-xs font-medium">{w.currentUsage} / {w.capacity} kg</span>
                      </div>
                      <div className={`text-xl font-black ${isNearCapacity ? 'text-rose-400' : isModerate ? 'text-amber-400' : 'text-primary-400'}`}>
                        {percentage}%
                      </div>
                    </div>
                    <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800/50 shadow-inner">
                      <div 
                        className={`h-full ${barColor} rounded-full transition-all duration-1000 ease-out shadow-lg ${shadowColor} relative`}
                        style={{ width: `${percentage}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {(!stats?.warehouses || stats.warehouses.length === 0) && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50 pb-10">
                  <Warehouse className="w-12 h-12 text-slate-600 mb-3" />
                  <p className="text-slate-400 italic">No warehouse data active.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Dashboard;
