import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Package, 
  Truck, 
  Warehouse, 
  CheckCircle2, 
  Clock, 
  TrendingUp 
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
  Area
} from 'recharts';

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-sm hover:shadow-primary-500/5 transition-all duration-300 group">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-white">{value}</h3>
        {trend && (
          <p className="text-emerald-500 text-xs mt-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>{trend}</span>
          </p>
        )}
      </div>
      <div className={`p-3 rounded-2xl ${color} transition-transform duration-300 group-hover:scale-110`}>
        <Icon className="w-6 h-6 text-white" />
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

  if (loading) return <div className="text-white">Loading dashboard...</div>;

  const summary = stats?.summary || {};

  const chartData = [
    { name: 'Pending', count: summary.pendingShipments || 0 },
    { name: 'In Transit', count: summary.inTransitShipments || 0 },
    { name: 'Delivered', count: summary.deliveredShipments || 0 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Logistics Overview</h1>
        <p className="text-slate-400 mt-1">Real-time supply chain monitoring and analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Shipments" 
          value={summary.totalShipments || 0} 
          icon={Package} 
          color="bg-primary-500"
        />
        <StatCard 
          title="In Transit" 
          value={summary.inTransitShipments || 0} 
          icon={Truck} 
          color="bg-amber-500"
        />
        <StatCard 
          title="Delivered" 
          value={summary.deliveredShipments || 0} 
          icon={CheckCircle2} 
          color="bg-emerald-500"
          trend={summary.totalShipments > 0 ? `${Math.round((summary.deliveredShipments / summary.totalShipments) * 100)}% completion rate` : '0% completion rate'}
        />
        <StatCard 
          title="Active Drivers" 
          value={summary.activeDrivers || 0} 
          icon={Warehouse} 
          color="bg-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl">
          <h3 className="text-xl font-bold text-white mb-6">Shipment Status Distribution</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="count" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl">
          <h3 className="text-xl font-bold text-white mb-6">Warehouse Utilization</h3>
          <div className="space-y-6">
            {stats?.warehouses?.map((w, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white font-medium">{w.name}</span>
                  <span className="text-slate-400">{Math.round((w.currentUsage / w.capacity) * 100)}% Capacity</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary-500 rounded-full transition-all duration-1000"
                    style={{ width: `${(w.currentUsage / w.capacity) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {(!stats?.warehouses || stats.warehouses.length === 0) && (
              <p className="text-slate-500 text-center py-10 italic">No warehouse data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
