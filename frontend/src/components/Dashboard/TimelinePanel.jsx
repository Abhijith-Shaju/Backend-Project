import React, { useState, useEffect } from "react";
import { Activity } from "lucide-react";
import { useSocket } from "../../context/SocketContext";

export function TimelinePanel() {
  const socket = useSocket();
  const [events, setEvents] = useState([
    { id: 1, message: "System online. Waiting for events...", time: new Date() }
  ]);

  useEffect(() => {
    if (!socket) return;

    const handleShipmentStatus = (data) => {
      setEvents(prev => [{
        id: Date.now(),
        message: `Shipment ${data.trackingNumber} is now ${data.status.replace("_", " ")}`,
        time: new Date()
      }, ...prev].slice(0, 10)); // keep last 10
    };

    const handleAgentOnline = (user) => {
      setEvents(prev => [{
        id: Date.now(),
        message: `Agent ${user.name} came online`,
        time: new Date()
      }, ...prev].slice(0, 10));
    };

    socket.on("shipment:status", handleShipmentStatus);
    socket.on("agent:online", handleAgentOnline);

    return () => {
      socket.off("shipment:status", handleShipmentStatus);
      socket.off("agent:online", handleAgentOnline);
    };
  }, [socket]);

  return (
    <div className="panel timeline-panel glass-panel">
      <div className="panel-title">
        <div>
          <p className="glow-text">Socket events</p>
          <h3>Real-time activity</h3>
        </div>
        <Activity className="text-muted" size={20} />
      </div>
      <div className="timeline-list">
        {events.map((event) => (
          <div className="event-row" key={event.id}>
            <div className="event-dot"></div>
            <div className="event-content">
              <p>{event.message}</p>
              <small>{event.time.toLocaleTimeString()}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
