import { Server as IOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";

export function setupSocket(httpServer: HTTPServer) {
  const io = new IOServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // Auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("NO_TOKEN"));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string; role: string };
      socket.data.userId = payload.sub;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error("INVALID_TOKEN"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] Connected: ${socket.data.userId}`);

    socket.on("event:join", (eventId: string) => {
      socket.join(`event:${eventId}`);
    });

    socket.on("event:leave", (eventId: string) => {
      socket.leave(`event:${eventId}`);
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] Disconnected: ${socket.data.userId}`);
    });
  });

  return io;
}
