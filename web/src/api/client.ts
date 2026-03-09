const API_BASE = "/api";

export interface UpscaleResponse {
  jobId: string;
  status: string;
  message: string;
}

export interface JobStatus {
  jobId: string;
  status: "pending" | "processing" | "done" | "error" | "stopped";
  progress: string;
  error?: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
}

export interface UpscaleParams {
  model: string;
  scale: string;
  saveImageAs: "png" | "jpg" | "webp";
  gpuId?: string;
  compression?: string;
  tileSize?: number;
  customWidth?: string;
  ttaMode?: boolean;
}

/** Upload an image and start upscaling */
export async function uploadAndUpscale(
  file: File,
  params: UpscaleParams
): Promise<UpscaleResponse> {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("model", params.model);
  formData.append("scale", params.scale);
  formData.append("saveImageAs", params.saveImageAs);
  if (params.gpuId) formData.append("gpuId", params.gpuId);
  if (params.compression) formData.append("compression", params.compression);
  if (params.tileSize) formData.append("tileSize", params.tileSize.toString());
  if (params.customWidth) formData.append("customWidth", params.customWidth);
  if (params.ttaMode) formData.append("ttaMode", "true");

  const response = await fetch(`${API_BASE}/upscale`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Upload failed");
  }

  return response.json();
}

/** Subscribe to job progress via SSE */
export function subscribeProgress(
  jobId: string,
  callbacks: {
    onProgress?: (data: string) => void;
    onDone?: (outputPath: string) => void;
    onError?: (error: string) => void;
    onStatus?: (status: { status: string; progress: string }) => void;
  }
): () => void {
  const eventSource = new EventSource(`${API_BASE}/upscale/${jobId}/progress`);

  eventSource.addEventListener("progress", (e) => {
    callbacks.onProgress?.(JSON.parse(e.data));
  });

  eventSource.addEventListener("done", (e) => {
    callbacks.onDone?.(JSON.parse(e.data));
    eventSource.close();
  });

  eventSource.addEventListener("error", (e) => {
    if (e instanceof MessageEvent) {
      callbacks.onError?.(JSON.parse(e.data));
    } else {
      callbacks.onError?.("Connection lost");
    }
    eventSource.close();
  });

  eventSource.addEventListener("stopped", () => {
    callbacks.onError?.("Job stopped");
    eventSource.close();
  });

  eventSource.addEventListener("status", (e) => {
    callbacks.onStatus?.(JSON.parse(e.data));
  });

  return () => eventSource.close();
}

/** Get job status (polling alternative) */
export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const response = await fetch(`${API_BASE}/upscale/${jobId}/status`);
  if (!response.ok) throw new Error("Failed to get job status");
  return response.json();
}

/** Get result image URL */
export function getResultPreviewUrl(jobId: string): string {
  return `${API_BASE}/upscale/${jobId}/result/preview`;
}

/** Get original image URL */
export function getOriginalPreviewUrl(jobId: string): string {
  return `${API_BASE}/upscale/${jobId}/original/preview`;
}

/** Get result download URL */
export function getResultDownloadUrl(jobId: string): string {
  return `${API_BASE}/upscale/${jobId}/result`;
}

/** Stop a running job */
export async function stopJob(jobId: string): Promise<void> {
  await fetch(`${API_BASE}/upscale/${jobId}/stop`, { method: "POST" });
}

/** Get list of available models */
export async function getModels(): Promise<ModelInfo[]> {
  const response = await fetch(`${API_BASE}/models`);
  if (!response.ok) throw new Error("Failed to fetch models");
  const data = await response.json();
  return data.models;
}
