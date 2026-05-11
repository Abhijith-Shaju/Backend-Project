import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { BarChart3, Map as MapIcon, Globe, Layers } from 'lucide-react';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

const Analytics = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const res = await api.get('/warehouses');
        setWarehouses(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchWarehouses();
  }, []);

  // Default center (New York if no warehouses)
  const center = warehouses.length > 0 ? [warehouses[0].lat, warehouses[0].lng] : [40.7128, -74.0060];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Route Analytics</h1>
          <p className="text-slate-400 mt-1">Geospatial distribution and route optimization</p>
        </div>
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all">
            <MapIcon className="w-4 h-4" /> Map View
          </button>
          <button className="flex items-center gap-2 text-slate-400 px-4 py-2 rounded-lg text-sm font-semibold hover:text-white transition-all">
            <BarChart3 className="w-4 h-4" /> Data View
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <div className="h-[600px] w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden relative shadow-2xl">
            <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%', background: '#0f172a' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              {warehouses.map((w) => (
                <Marker key={w.id} position={[w.lat, w.lng]}>
                  <Popup>
                    <div className="p-2">
                      <h4 className="font-bold text-slate-900">{w.name}</h4>
                      <p className="text-xs text-slate-600">{w.locationName}</p>
                      <div className="mt-2 text-xs font-bold text-primary-600 uppercase tracking-tight">
                        Capacity: {w.capacity} kg
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            
            <div className="absolute top-4 right-4 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-800 p-4 rounded-2xl shadow-xl space-y-4 w-64">
              <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-slate-800 pb-2">
                <Globe className="w-4 h-4 text-primary-500" /> Map Layers
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-primary-500 focus:ring-primary-500/20" />
                  <span className="text-xs text-slate-400 group-hover:text-white transition-colors">Show Warehouses</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-primary-500 focus:ring-primary-500/20" />
                  <span className="text-xs text-slate-400 group-hover:text-white transition-colors">Show Active Routes</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-primary-500 focus:ring-primary-500/20" />
                  <span className="text-xs text-slate-400 group-hover:text-white transition-colors">Heat Map (Density)</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary-500" /> Map Legend
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-primary-500 rounded-full" />
                <span className="text-sm text-slate-400 font-medium">Main Hub</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-emerald-500 rounded-full" />
                <span className="text-sm text-slate-400 font-medium">Regional Warehouse</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-amber-500 rounded-full" />
                <span className="text-sm text-slate-400 font-medium">Pending Delivery</span>
              </div>
            </div>
          </div>

          <div className="bg-primary-600 p-6 rounded-3xl text-white shadow-xl shadow-primary-500/10">
            <h3 className="font-bold text-lg mb-2">Route Logic</h3>
            <p className="text-sm text-primary-100 leading-relaxed">
              LogiFlow uses Euclidean distance calculation to assign the nearest available warehouse to new shipment orders, optimizing fuel costs and delivery times.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
