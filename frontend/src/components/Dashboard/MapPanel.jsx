import React, { useState, useEffect } from "react";
import { Navigation } from "lucide-react";
import { api } from "../../services/api";

export function MapPanel() {
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await api.get("/vehicles");
        if (res.data.success) {
          // Add some fake coordinates for display purposes if backend doesn't have them
          const mappedVehicles = res.data.data.map(v => ({
            ...v,
            x: Math.floor(Math.random() * 80) + 10,
            y: Math.floor(Math.random() * 80) + 10
          }));
          setVehicles(mappedVehicles);
        }
      } catch (e) {
        console.error("Failed to fetch vehicles", e);
      }
    };
    fetchVehicles();
  }, []);

  return (
    <div className="panel map-panel glass-panel">
      <div className="panel-title">
        <div>
          <p className="glow-text">Fleet map</p>
          <h3>Vehicles online</h3>
        </div>
        <span className="live-dot"><span className="pulse"></span> Live</span>
      </div>
      <div className="map map-premium">
        <div className="route-line" />
        {vehicles.length === 0 ? (
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "rgba(255,255,255,0.5)" }}>
            No active vehicles
          </div>
        ) : (
          vehicles.map((vehicle) => (
            <button className="pin marker-glow" style={{ left: `${vehicle.x}%`, top: `${vehicle.y}%` }} key={vehicle.plateNumber}>
              <div className="pin-icon">
                <Navigation size={12} fill="currentColor" className="rotate-icon" />
              </div>
              <div className="pin-tooltip">
                <strong>{vehicle.type}</strong>
                <small>{vehicle.plateNumber} · {vehicle.status}</small>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
