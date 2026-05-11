import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Clock, PackageCheck, Zap } from "lucide-react";
import { api } from "../../../services/api";

export function KpiGrid() {
  const [metrics, setMetrics] = useState({
    shipments: 0,
    delivered: 0,
    products: 0,
    activeVehicles: 0,
    revenue: 0,
    onTimeRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get("/analytics/dashboard");
        if (res.data.success) {
          setMetrics(res.data.data);
        }
      } catch (e) {
        console.error("Failed to fetch analytics", e);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const kpis = [
    { label: "Total Shipments", value: metrics.shipments.toLocaleString(), trend: "Live", tone: "blue", icon: PackageCheck, up: true },
    { label: "On-time Delivery", value: `${metrics.onTimeRate}%`, trend: `Based on ${metrics.delivered} delivered`, tone: "green", icon: Clock, up: true },
    { label: "Active Products", value: metrics.products.toLocaleString(), trend: "In inventory", tone: "amber", icon: TrendingUp, up: true },
    { label: "Fleet Online", value: metrics.activeVehicles.toString(), trend: "Live", tone: "violet", icon: Zap, up: true }
  ];

  return (
    <section className="kpi-grid">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <article className={`kpi kpi-${kpi.tone}`} key={kpi.label}>
            <div className="kpi-header">
              <span>{kpi.label}</span>
              <Icon size={18} className={`icon-${kpi.tone}`} />
            </div>
            <strong>{loading ? "..." : kpi.value}</strong>
            <div className="kpi-trend">
              {kpi.up ? <TrendingUp size={14} className="text-green" /> : <TrendingDown size={14} className="text-amber" />}
              <small className={kpi.up ? "text-green" : "text-amber"}>{kpi.trend}</small>
            </div>
          </article>
        );
      })}
    </section>
  );
}
