import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { api } from "../../services/api";
import { Modal } from "../common/Modal";

function StatusBadge({ status }) {
  const key = status.toLowerCase().replaceAll(" ", "-").replaceAll("_", "-");
  return <span className={`status status-${key}`}>{status.replace("_", " ")}</span>;
}

export function ShipmentPanel() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [cargoDesc, setCargoDesc] = useState("");
  const [originCity, setOriginCity] = useState("");
  const [destCity, setDestCity] = useState("");

  const fetchShipments = async () => {
    try {
      const res = await api.get("/shipments");
      if (res.data.success) {
        setShipments(res.data.data);
      }
    } catch (e) {
      console.error("Failed to fetch shipments", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post("/shipments", {
        origin: { city: originCity },
        destination: { city: destCity },
        cargo: { description: cargoDesc }
      });
      setIsModalOpen(false);
      setCargoDesc(""); setOriginCity(""); setDestCity("");
      fetchShipments();
    } catch (e) {
      console.error("Failed to create shipment", e);
      alert(e.response?.data?.message || "Error creating shipment");
    }
  };

  return (
    <div className="panel shipments-panel glass-panel">
      <div className="panel-title">
        <div>
          <p className="glow-text">Shipment control</p>
          <h3>Priority movements</h3>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} />
          Create
        </button>
      </div>
      
      <div className="table">
        {loading ? (
          <p className="text-muted">Loading shipments...</p>
        ) : shipments.length === 0 ? (
          <p className="text-muted">No shipments found.</p>
        ) : (
          shipments.map((shipment) => (
            <div className="row glass-row" key={shipment._id}>
              <div>
                <strong>{shipment.trackingNumber}</strong>
                <small>{shipment.origin?.city || "Unknown"} to {shipment.destination?.city || "Unknown"}</small>
              </div>
              <span>{shipment.cargo?.description || "N/A"}</span>
              <div className="agent-col">
                <div className="avatar-mini">A</div>
                <span>Agent ID: {shipment.assignedAgent?.toString().slice(-4) || "Unassigned"}</span>
              </div>
              <StatusBadge status={shipment.status} />
              <b className="eta-text">{new Date(shipment.createdAt).toLocaleDateString()}</b>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Shipment">
        <form onSubmit={handleCreate}>
          <label>
            <span>Cargo Description</span>
            <input value={cargoDesc} onChange={e => setCargoDesc(e.target.value)} required placeholder="e.g. Medical Supplies" />
          </label>
          <label>
            <span>Origin City</span>
            <input value={originCity} onChange={e => setOriginCity(e.target.value)} required placeholder="e.g. Mumbai" />
          </label>
          <label>
            <span>Destination City</span>
            <input value={destCity} onChange={e => setDestCity(e.target.value)} required placeholder="e.g. Delhi" />
          </label>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Create</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
