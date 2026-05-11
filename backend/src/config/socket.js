import jwt from "jsonwebtoken";
import { Server } from "socket.io";

let io;

export function initSocket(server) {
  io = new Server(server, {
    cors: { origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next();

    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      socket.join(`user:${socket.user.id}`);
      socket.join(socket.user.role);
      next();
    } catch {
      next(new Error("Invalid socket token"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("agent:online", () => socket.broadcast.to("admin").emit("agent:online", socket.user));
    socket.on("location:update", (payload) => socket.broadcast.to("warehouse_manager").emit("location:update", payload));
    socket.on("disconnect", () => socket.broadcast.emit("agent:offline", { user: socket.user }));
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket.IO has not been initialized");
  return io;
}

