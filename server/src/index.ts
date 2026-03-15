import { webcrypto } from "crypto";

// Polyfill globalThis.crypto for altcha-lib (requires Web Crypto API)
if (!(globalThis as any).crypto) {
  (globalThis as any).crypto = webcrypto;
}

import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import upscaleRoutes from "./routes/upscale";
import modelsRoutes from "./routes/models";
import altchaRoutes from "./routes/altcha";

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === "production";

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || (isProduction ? true : "http://localhost:5173"),
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads and outputs (for preview)
app.use(
  "/uploads",
  express.static(path.resolve(__dirname, "../uploads"))
);
app.use(
  "/outputs",
  express.static(path.resolve(__dirname, "../outputs"))
);

// API Routes
app.use("/api/upscale", upscaleRoutes);
app.use("/api/models", modelsRoutes);
app.use("/api/altcha", altchaRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// In production, serve the built frontend
if (isProduction) {
  const frontendDist = path.resolve(__dirname, "../../web/dist");
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    // SPA fallback — serve index.html for non-API routes
    app.get("*", (_req, res) => {
      res.sendFile(path.join(frontendDist, "index.html"));
    });
  }
}

// Error handling middleware
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
);

app.listen(PORT, () => {
  console.log(`🚀 Upscayl Web Server running on http://localhost:${PORT}`);
});

export default app;
