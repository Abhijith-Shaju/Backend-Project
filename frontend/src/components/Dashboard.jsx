import React from "react";
import { Topbar } from "./Topbar";
import { Hero } from "./Dashboard/Hero";
import { KpiGrid } from "./Dashboard/KpiGrid";
import { ShipmentPanel } from "./Dashboard/ShipmentPanel";
import { MapPanel } from "./Dashboard/MapPanel";
import { InventoryPanel } from "./Dashboard/InventoryPanel";
import { TimelinePanel } from "./Dashboard/TimelinePanel";

export function Dashboard() {
  return (
    <main className="main-content">
      <Topbar />
      <Hero />
      <KpiGrid />
      <section className="workspace">
        <ShipmentPanel />
        <MapPanel />
        <InventoryPanel />
        <TimelinePanel />
      </section>
    </main>
  );
}
