import React, { useState, useRef, useEffect } from "react";
import { Search, Bell, CheckCircle2 } from "lucide-react";
import { useNotifications } from "../context/NotificationContext";

export function Topbar() {
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown && unreadCount > 0) {
      markAllRead();
    }
  };

  return (
    <header className="topbar">
      <div>
        <p className="glow-text">Live command center</p>
        <h1>Smart Logistics Services</h1>
      </div>
      <div className="top-actions">
        <label className="search-input-wrapper">
          <Search className="search-icon" size={16} />
          <input placeholder="Shipment, SKU, vehicle..." />
        </label>
        
        <div className="notification-wrapper" ref={dropdownRef} style={{ position: "relative" }}>
          <button className="icon-button" onClick={handleToggle} aria-label="Notifications">
            <Bell size={20} />
            {unreadCount > 0 && <span className="notification-dot"></span>}
          </button>
          
          {showDropdown && (
            <div className="notification-dropdown glass-panel" style={{
              position: "absolute", top: "120%", right: 0, width: "320px", padding: "16px", zIndex: 50
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "8px" }}>
                <h4 style={{ margin: 0 }}>Notifications</h4>
                <CheckCircle2 size={16} className="text-muted" />
              </div>
              
              <div style={{ maxHeight: "300px", overflowY: "auto", display: "grid", gap: "12px" }}>
                {notifications.length === 0 ? (
                  <p className="text-muted" style={{ fontSize: "0.85rem", textAlign: "center", padding: "20px 0" }}>No new notifications</p>
                ) : (
                  notifications.map(notif => (
                    <div key={notif.id} style={{ fontSize: "0.85rem", lineHeight: "1.4" }}>
                      <p style={{ margin: "0 0 4px", color: "var(--text-main)" }}>{notif.message}</p>
                      <small className="text-muted">{new Date(notif.time).toLocaleTimeString()}</small>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
