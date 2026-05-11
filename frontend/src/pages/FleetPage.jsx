import React from "react";
import { Topbar } from "../components/Topbar";
import { MapPanel } from "../components/Dashboard/MapPanel";

export function FleetPage() {
  return (
    <main className="main-content">
      <Topbar />
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "2rem", marginBottom: "8px" }}>Fleet Tracking</h2>
        <p className="text-muted">Live map of all active delivery vehicles and their current status.</p>
      </div>
      <section className="workspace" style={{ display: "block" }}>
        <MapPanel />
      </section>
    </main>
  );
}
