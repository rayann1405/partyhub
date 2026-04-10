import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { createServer } from "http";
import { setupSocket } from "./socket";
import { apiLimiter } from "./middleware/rateLimiter";

import authRoutes from "./controllers/auth.controller";
import eventRoutes from "./controllers/event.controller";
import voteRoutes from "./controllers/vote.controller";
import commentRoutes from "./controllers/comment.controller";

const app = express();
const httpServer = createServer(app);

// Trust reverse proxy (Render, Railway, etc.) for correct IPs in rate-limiting
app.set("trust proxy", 1);

// Support comma-separated origins: CLIENT_URL="https://app.onrender.com,http://localhost:5173"
const corsOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((u) => u.trim());

// Security
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json({ limit: "5mb" }));
app.use(apiLimiter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/votes", voteRoutes);
app.use("/api", commentRoutes);

// ---------------------------------------------------------------
// En production, Express sert le build React depuis /public.
// Toute route non-API retourne index.html (SPA fallback).
// ---------------------------------------------------------------
if (process.env.NODE_ENV === "production") {
  const publicPath = path.join(__dirname, "../public");
  app.use(express.static(publicPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(publicPath, "index.html"));
  });
}

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
  console.log(`Server running on port ${PORT} (${process.env.NODE_ENV ?? "development"})`);
});

export default app;
