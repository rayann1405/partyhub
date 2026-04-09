import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createServer } from "http";
import { setupSocket } from "./socket";
import { apiLimiter } from "./middleware/rateLimiter";

import authRoutes from "./controllers/auth.controller";
import eventRoutes from "./controllers/event.controller";
import voteRoutes from "./controllers/vote.controller";
import commentRoutes from "./controllers/comment.controller";

const app = express();
const httpServer = createServer(app);

// Security
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "5mb" }));
app.use(apiLimiter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/votes", voteRoutes);
app.use("/api", commentRoutes);

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[Error]", err);
  res.status(500).json({ error: "INTERNAL_ERROR" });
});

// Socket.IO
const io = setupSocket(httpServer);
app.set("io", io);

const PORT = Number(process.env.PORT) || 3000;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 PartyHub server running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;
