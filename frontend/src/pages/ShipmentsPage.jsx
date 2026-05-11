import React from "react";
import { Topbar } from "../components/Topbar";
import { ShipmentPanel } from "../components/Dashboard/ShipmentPanel";

export function ShipmentsPage() {
  return (
    <main className="main-content">
      <Topbar />
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "2rem", marginBottom: "8px" }}>Shipments Ledger</h2>
        <p className="text-muted">Complete overview of all incoming and outgoing logistics.</p>
      </div>
      <section className="workspace" style={{ display: "block" }}>
        <ShipmentPanel />
      </section>
    </main>
  );
}
