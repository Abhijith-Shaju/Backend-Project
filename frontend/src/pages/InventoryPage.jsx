import React from "react";
import { Topbar } from "../components/Topbar";
import { InventoryPanel } from "../components/Dashboard/InventoryPanel";

export function InventoryPage() {
  return (
    <main className="main-content">
      <Topbar />
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "2rem", marginBottom: "8px" }}>Inventory Catalog</h2>
        <p className="text-muted">Manage stock levels, reorder alerts, and SKU tracking.</p>
      </div>
      <section className="workspace" style={{ display: "block" }}>
        <InventoryPanel />
      </section>
    </main>
  );
}
