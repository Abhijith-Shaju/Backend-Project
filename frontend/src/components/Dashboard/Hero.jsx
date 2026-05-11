import React from "react";
import { Activity } from "lucide-react";

export function Hero() {
  return (
    <section className="hero-band">
      <div className="hero-content">
        <p className="glow-text">
          <Activity size={14} className="inline-icon" />
          End-to-end visibility
        </p>
        <h2>Track cargo, inventory, fleet movement, and vendor performance from one operational cockpit.</h2>
      </div>
      <div className="hero-stats">
        <strong>24</strong>
        <span>live route events in the last hour</span>
      </div>
      <div className="hero-bg-glow"></div>
    </section>
  );
}
