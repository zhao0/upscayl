import { Router, Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import multer from "multer";
import path from "path";
import fs from "fs";
import { verifySolution } from "altcha-lib";
import { jobManager } from "../services/job-manager";
import {
  startUpscale,
  UpscaleOptions,
  ImageFormat,
} from "../services/upscale-service";
import { HMAC_KEY } from "./altcha";

const router = Router();

// Configure multer for file uploads
const uploadsDir = path.resolve(__dirname, "../../uploads");
const outputsDir = path.resolve(__dirname, "../../outputs");

// Ensure directories exist
[uploadsDir, outputsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

interface UploadRequest extends Request {
  _pendingUploadPath?: string;
}

function safeUnlink(filePath?: string): void {
  if (!filePath) return;
  fs.unlink(filePath, (err) => {
    if (err && err.code !== "ENOENT") {
      logger.error(`Failed to delete file: ${filePath}`, err);
    } else if (!err) {
      logger.log(`🗑️ Deleted incomplete/rejected upload: ${filePath}`);
    }
  });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    (req as UploadRequest)._pendingUploadPath = path.join(uploadsDir, uniqueName);
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (_req, file, cb) => {
    const allowed = [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff", ".tif"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file format: ${ext}`));
    }
  },
});

/**
 * Wrap multer upload to clean up partial files if the client disconnects mid-upload
 */
function handleUpload(req: UploadRequest, res: Response, next: NextFunction): void {
  let clientDisconnected = false;

  const onAborted = () => {
    clientDisconnected = true;
    const pendingPath = req.file?.path || req._pendingUploadPath;
    if (pendingPath) {
      logger.log(`⚠️ Client disconnected during upload, cleaning up: ${pendingPath}`);
      safeUnlink(pendingPath);
    }
  };

  req.on("aborted", onAborted);

  upload.single("image")(req, res, (err: any) => {
    req.off("aborted", onAborted);

    if (err) {
      safeUnlink(req.file?.path || req._pendingUploadPath);
      if (clientDisconnected || req.aborted || res.destroyed) {
        return;
      }
      return next(err);
    }

    if (clientDisconnected || req.aborted || res.destroyed) {
      safeUnlink(req.file?.path || req._pendingUploadPath);
      return;
    }

    next();
  });
}

/**
 * POST /api/upscale
 * Upload image and start upscaling
 * Body (multipart/form-data):
 *   - image: file
 *   - model: string (e.g. "upscayl-standard-4x")
 *   - scale: string (e.g. "4")
 *   - saveImageAs: "png" | "jpg" | "webp"
 *   - gpuId?: string
 *   - compression?: string
 *   - tileSize?: number
 *   - customWidth?: string
 *   - ttaMode?: boolean
 */
router.post("/", handleUpload, async (req: UploadRequest, res: Response) => {
  let jobCreated = false;

  try {
    // Verify ALTCHA proof-of-work
    const altchaPayload = req.body.altcha;
    if (!altchaPayload) {
      safeUnlink(req.file?.path);
      res.status(403).json({ error: "ALTCHA verification required" });
      return;
    }
    const verified = await verifySolution(altchaPayload, HMAC_KEY);
    if (!verified) {
      safeUnlink(req.file?.path);
      res.status(403).json({ error: "ALTCHA verification failed" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: "No image file uploaded" });
      return;
    }

    // Abort before creating job if client disconnected during verification
    if (req.aborted || res.destroyed) {
      safeUnlink(req.file.path);
      return;
    }

    const {
      model = "upscayl-lite-4x",
      scale = "4",
      saveImageAs = "png",
      gpuId,
      compression = "0",
      tileSize,
      customWidth,
      ttaMode,
    } = req.body;

    const inputPath = req.file.path;
    const outputFileName = `${path.parse(req.file.filename).name}_upscayl_${scale}x_${model}.${saveImageAs}`;
    const outputPath = path.join(outputsDir, outputFileName);

    // Create job
    const job = jobManager.createJob({
      inputPath,
      outputPath,
      model,
      scale,
    });
    jobCreated = true;

    // Start upscaling asynchronously
    const options: UpscaleOptions = {
      model,
      scale,
      gpuId,
      saveImageAs: saveImageAs as ImageFormat,
      compression,
      tileSize: tileSize ? parseInt(tileSize, 10) : undefined,
      customWidth,
      ttaMode: ttaMode === "true" || ttaMode === true,
    };

    startUpscale(job, options);

    res.json({
      jobId: job.id,
      status: job.status,
      message: "Upscaling started",
    });
  } catch (error: any) {
    if (!jobCreated) {
      safeUnlink(req.file?.path || req._pendingUploadPath);
    }
    logger.error("Upload error:", error);
    if (!res.headersSent && !res.destroyed) {
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * GET /api/upscale/:jobId/progress
 * SSE endpoint for real-time progress updates
 */
router.get("/:jobId/progress", (req: Request, res: Response) => {
  const { jobId } = req.params;
  const job = jobManager.getJob(jobId);

  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  // Set up SSE
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  // Send current status immediately
  res.write(
    `event: status\ndata: ${JSON.stringify({ status: job.status, progress: job.progress })}\n\n`
  );

  // If job is already done/error, close the connection
  if (
    job.status === "done" ||
    job.status === "error" ||
    job.status === "stopped"
  ) {
    if (job.status === "done") {
      res.write(`event: done\ndata: ${JSON.stringify(job.id)}\n\n`);
    } else if (job.status === "error") {
      res.write(
        `event: error\ndata: ${JSON.stringify(job.error || "Unknown error")}\n\n`
      );
    }
    res.end();
    return;
  }

  // Register SSE client
  jobManager.addSSEClient(jobId, res);

  // Clean up on disconnect
  req.on("close", () => {
    jobManager.removeSSEClient(jobId, res);
  });
});

/**
 * GET /api/upscale/:jobId/status
 * Get current job status (polling alternative)
 */
router.get("/:jobId/status", (req: Request, res: Response) => {
  const { jobId } = req.params;
  const job = jobManager.getJob(jobId);

  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  res.json({
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    error: job.error,
  });
});

/**
 * GET /api/upscale/:jobId/result
 * Download the upscaled image
 */
router.get("/:jobId/result", (req: Request, res: Response) => {
  const { jobId } = req.params;
  const job = jobManager.getJob(jobId);

  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  if (job.status !== "done") {
    res
      .status(400)
      .json({ error: "Job not completed yet", status: job.status });
    return;
  }

  if (!fs.existsSync(job.outputPath)) {
    res.status(404).json({ error: "Output file not found" });
    return;
  }

  res.download(job.outputPath);
});

/**
 * GET /api/upscale/:jobId/result/preview
 * Serve upscaled image for in-browser preview
 */
router.get("/:jobId/result/preview", (req: Request, res: Response) => {
  const { jobId } = req.params;
  const job = jobManager.getJob(jobId);

  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  if (job.status !== "done") {
    res
      .status(400)
      .json({ error: "Job not completed yet", status: job.status });
    return;
  }

  if (!fs.existsSync(job.outputPath)) {
    res.status(404).json({ error: "Output file not found" });
    return;
  }

  res.sendFile(job.outputPath);
});

/**
 * GET /api/upscale/:jobId/original/preview
 * Serve original uploaded image for in-browser preview
 */
router.get("/:jobId/original/preview", (req: Request, res: Response) => {
  const { jobId } = req.params;
  const job = jobManager.getJob(jobId);

  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  if (!fs.existsSync(job.inputPath)) {
    res.status(404).json({ error: "Original file not found" });
    return;
  }

  res.sendFile(job.inputPath);
});

/**
 * POST /api/upscale/:jobId/stop
 * Stop a running job
 */
router.post("/:jobId/stop", (req: Request, res: Response) => {
  const { jobId } = req.params;
  const success = jobManager.stopJob(jobId);

  if (success) {
    res.json({ message: "Job stopped" });
  } else {
    res.status(404).json({ error: "Job not found or not running" });
  }
});

export default router;
