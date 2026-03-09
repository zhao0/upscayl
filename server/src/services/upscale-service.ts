import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { jobManager, Job } from "./job-manager";

/** Detect OS and resolve binary path */
function getExecPath(): string {
  const platform = process.platform;
  const projectRoot = path.resolve(__dirname, "../../..");
  let binDir: string;

  if (platform === "darwin") {
    binDir = path.join(projectRoot, "resources", "mac", "bin");
  } else if (platform === "linux") {
    binDir = path.join(projectRoot, "resources", "linux", "bin");
  } else if (platform === "win32") {
    binDir = path.join(projectRoot, "resources", "win", "bin");
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  const binName = platform === "win32" ? "upscayl-bin.exe" : "upscayl-bin";
  const execPath = path.join(binDir, binName);
  if (!fs.existsSync(execPath)) {
    throw new Error(`upscayl-bin not found at: ${execPath}`);
  }
  return execPath;
}

function getModelsPath(): string {
  const projectRoot = path.resolve(__dirname, "../../..");
  return path.join(projectRoot, "resources", "models");
}

/** Get the native scale of a model from its name */
function getModelScale(model: string): string {
  const name = model.toLowerCase();
  if (name.includes("x2") || name.includes("2x")) return "2";
  if (name.includes("x3") || name.includes("3x")) return "3";
  return "4";
}

export type ImageFormat = "png" | "jpg" | "webp";

export interface UpscaleOptions {
  model: string;
  scale: string;
  gpuId?: string;
  saveImageAs: ImageFormat;
  compression?: string;
  tileSize?: number;
  customWidth?: string;
  ttaMode?: boolean;
}

function buildArgs(
  inputPath: string,
  outputPath: string,
  options: UpscaleOptions
): string[] {
  const modelsPath = getModelsPath();
  const modelScale = getModelScale(options.model);
  const includeScale =
    modelScale !== options.scale && !options.customWidth;

  const args: string[] = [
    "-i", inputPath,
    "-o", outputPath,
  ];

  if (includeScale) {
    args.push("-s", options.scale);
  }

  args.push("-m", modelsPath);
  args.push("-n", options.model);

  if (options.gpuId) {
    args.push("-g", options.gpuId);
  }

  args.push("-f", options.saveImageAs);

  if (options.customWidth) {
    args.push("-w", options.customWidth);
  }

  args.push("-c", options.compression || "0");

  if (options.tileSize) {
    args.push("-t", options.tileSize.toString());
  }

  if (options.ttaMode) {
    args.push("-x");
  }

  return args;
}

export function startUpscale(job: Job, options: UpscaleOptions): void {
  const execPath = getExecPath();
  const args = buildArgs(job.inputPath, job.outputPath, options);

  console.log(`🚀 Starting upscale job ${job.id}`);
  console.log(`📢 Command: ${execPath} ${args.join(" ")}`);

  const child = spawn(execPath, args, {
    cwd: undefined,
    detached: false,
  });

  jobManager.updateJob(job.id, {
    status: "processing",
    process: {
      child,
      kill: () => child.kill(),
    },
  });

  let failed = false;

  child.stderr.on("data", (data: Buffer) => {
    const text = data.toString().trim();
    console.log(`[Job ${job.id}] stderr: ${text}`);

    if (text.includes("Error") || text.includes("failed")) {
      failed = true;
      child.kill();
      jobManager.updateJob(job.id, {
        status: "error",
        error: text,
      });
      jobManager.broadcastProgress(job.id, "error", text);
    } else {
      // Parse progress percentage
      jobManager.updateJob(job.id, { progress: text });
      jobManager.broadcastProgress(job.id, "progress", text);
    }
  });

  child.stdout.on("data", (data: Buffer) => {
    const text = data.toString().trim();
    console.log(`[Job ${job.id}] stdout: ${text}`);
  });

  child.on("error", (err) => {
    console.error(`[Job ${job.id}] Process error:`, err);
    failed = true;
    jobManager.updateJob(job.id, {
      status: "error",
      error: err.message,
    });
    jobManager.broadcastProgress(job.id, "error", err.message);
  });

  child.on("close", (code) => {
    const currentJob = jobManager.getJob(job.id);
    if (!failed && currentJob?.status !== "stopped") {
      console.log(`✅ Job ${job.id} completed`);
      jobManager.updateJob(job.id, { status: "done", progress: "100%" });
      jobManager.broadcastProgress(job.id, "done", job.id);
    }
  });
}

/** Model metadata with display names and descriptions */
const MODEL_META: Record<string, { name: string; description: string }> = {
  "upscayl-standard-4x": {
    name: "Upscayl 标准",
    description: "适用于大多数图像。",
  },
  "upscayl-lite-4x": {
    name: "Upscayl 轻量版",
    description: "适用于大多数图像。高速升图，质量损失最小。",
  },
  "remacri-4x": {
    name: "Remacri（非商业用途）",
    description: "适用于自然图像。增加了锐度和细节。不用于商业用途。",
  },
  "ultramix-balanced-4x": {
    name: "Ultramix（非商业用途）",
    description: "适用于自然图像，平衡了锐度和细节。",
  },
  "ultrasharp-4x": {
    name: "Ultrasharp（非商业用途）",
    description: "适用于自然图像，注重锐度。",
  },
  "digital-art-4x": {
    name: "数字艺术",
    description: "适用于数字艺术和插图。",
  },
  "high-fidelity-4x": {
    name: "高保真",
    description: "适用于各种图像，注重真实细节和平滑纹理。",
  },
};

/** List available models from the models directory */
export function listModels(): { id: string; name: string; description: string }[] {
  const modelsPath = getModelsPath();
  if (!fs.existsSync(modelsPath)) {
    return [];
  }

  const files = fs.readdirSync(modelsPath);
  const modelNames = new Set<string>();

  files.forEach((file) => {
    // Model files come in .bin/.param pairs, extract the base name
    const baseName = file.replace(/\.(bin|param)$/, "");
    modelNames.add(baseName);
  });

  return Array.from(modelNames).map((name) => ({
    id: name,
    name: MODEL_META[name]?.name || name,
    description: MODEL_META[name]?.description || "",
  }));
}
