import React, { createContext, useContext, useState, useEffect } from "react";
import { useSocket } from "./SocketContext";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const socket = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (message) => {
      setNotifications(prev => [{
        id: Date.now().toString(),
        message,
        time: new Date(),
        read: false
      }, ...prev].slice(0, 20)); // Keep last 20
      setUnreadCount(prev => prev + 1);
    };

    socket.on("shipment:status", (data) => {
      handleNewNotification(`Shipment ${data.trackingNumber} status updated to ${data.status.replace("_", " ")}`);
    });

    socket.on("agent:online", (user) => {
      handleNewNotification(`Agent ${user.name} came online`);
    });

    return () => {
      socket.off("shipment:status");
      socket.off("agent:online");
    };
  }, [socket]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
