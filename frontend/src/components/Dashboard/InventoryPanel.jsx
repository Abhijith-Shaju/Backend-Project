import React, { useState, useEffect } from "react";
import { AlertTriangle, Plus } from "lucide-react";
import { api } from "../../services/api";
import { Modal } from "../common/Modal";

export function InventoryPanel() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [stock, setStock] = useState("");
  const [reorderLevel, setReorderLevel] = useState("");

  const fetchInventory = async () => {
    try {
      const res = await api.get("/products");
      if (res.data.success) {
        setInventory(res.data.data);
      }
    } catch (e) {
      console.error("Failed to fetch inventory", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post("/products", {
        sku,
        name,
        stock: Number(stock),
        reorderLevel: Number(reorderLevel),
        category: "General",
        price: 100
      });
      setIsModalOpen(false);
      setSku(""); setName(""); setStock(""); setReorderLevel("");
      fetchInventory();
    } catch (e) {
      console.error("Failed to add product", e);
      alert(e.response?.data?.message || "Error adding product");
    }
  };

  return (
    <div className="panel inventory-panel glass-panel">
      <div className="panel-title">
        <div>
          <p className="glow-text">Inventory</p>
          <h3>Stock watchlist</h3>
        </div>
        <button className="icon-button" onClick={() => setIsModalOpen(true)} aria-label="Add Product">
          <Plus size={16} />
        </button>
      </div>
      <div className="inventory-list">
        {loading ? (
          <p className="text-muted">Loading inventory...</p>
        ) : inventory.length === 0 ? (
          <p className="text-muted">No products found.</p>
        ) : (
          inventory.map((item) => {
            const isLow = item.stock <= item.reorderLevel;
            const maxVal = Math.max(item.stock * 2, 100);
            const percentage = (item.stock / maxVal) * 100;
            return (
              <div className="stock-row" key={item._id}>
                <div className="stock-info">
                  <strong>{item.name}</strong>
                  <small>{item.sku} · Zone {item.location?.zone || "A"}</small>
                </div>
                <div className="progress-bar-wrapper">
                  <div className={`progress-bar ${isLow ? "bg-danger" : "bg-primary"}`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                </div>
                <div className={`stock-count ${isLow ? "text-danger" : ""}`}>
                  {isLow && <AlertTriangle size={14} />}
                  <span>{item.stock}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Product">
        <form onSubmit={handleCreate}>
          <label>
            <span>Product Name</span>
            <input value={name} onChange={e => setName(e.target.value)} required />
          </label>
          <label>
            <span>SKU</span>
            <input value={sku} onChange={e => setSku(e.target.value)} required />
          </label>
          <label>
            <span>Initial Stock</span>
            <input type="number" value={stock} onChange={e => setStock(e.target.value)} required />
          </label>
          <label>
            <span>Reorder Level</span>
            <input type="number" value={reorderLevel} onChange={e => setReorderLevel(e.target.value)} required />
          </label>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Add Product</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
