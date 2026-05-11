import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, Boxes, ShoppingCart, Truck, Users, BarChart2, UserCog, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/" },
  { name: "Shipments", icon: Package, path: "/shipments" },
  { name: "Inventory", icon: Boxes, path: "/inventory" },
  { name: "Orders", icon: ShoppingCart, path: "/orders" },
  { name: "Fleet", icon: Truck, path: "/fleet" },
  { name: "Vendors", icon: Users, path: "/vendors" },
  { name: "Analytics", icon: BarChart2, path: "/analytics" },
  { name: "Users", icon: UserCog, path: "/users" }
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <Truck size={24} color="#000" />
        </div>
        <div>
          <strong>Smart Logistics</strong>
          <small>Operations grid</small>
        </div>
      </div>

      <nav>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink to={item.path} className={({ isActive }) => (isActive ? "active" : "")} key={item.name}>
              <div className="icon-wrapper">
                <Icon size={18} />
              </div>
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      <div className="agent-card">
        <div className="agent-avatar">{user?.name ? user.name.charAt(0).toUpperCase() : "U"}</div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <strong style={{ whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden", display: "block" }}>{user?.name || "User"}</strong>
          <small>{user?.role?.replace("_", " ") || "Staff"}</small>
        </div>
        <button className="icon-button" style={{ width: 32, height: 32, padding: 0, marginLeft: "auto" }} onClick={handleLogout} aria-label="Logout">
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
}
