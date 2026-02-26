import express from "express";
import cors from "cors";
import path from "path";
import upscaleRoutes from "./routes/upscale";
import modelsRoutes from "./routes/models";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
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

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

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
  console.log(`📁 Uploads dir: ${path.resolve(__dirname, "../uploads")}`);
  console.log(`📁 Outputs dir: ${path.resolve(__dirname, "../outputs")}`);
});

export default app;
