import { useState, useCallback } from "react";
import ImageUploader from "./components/ImageUploader";
import SettingsPanel from "./components/SettingsPanel";
import ProgressDisplay from "./components/ProgressDisplay";
import ResultViewer from "./components/ResultViewer";
import {
  uploadAndUpscale,
  subscribeProgress,
  stopJob,
  getResultPreviewUrl,
  getOriginalPreviewUrl,
  getResultDownloadUrl,
  UpscaleParams,
} from "./api/client";
import { Sparkles, Github } from "lucide-react";

type AppStatus = "idle" | "uploading" | "processing" | "done" | "error" | "stopped";

export default function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<AppStatus>("idle");
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [params, setParams] = useState<UpscaleParams>({
    model: "upscayl-standard-4x",
    scale: "4",
    saveImageAs: "png",
    compression: "0",
  });

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setStatus("idle");
    setProgress("");
    setError("");
    setJobId(null);
  }, []);

  const handleClear = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setStatus("idle");
    setProgress("");
    setError("");
    setJobId(null);
  }, [previewUrl]);

  const handleUpscale = useCallback(async () => {
    if (!selectedFile) return;

    try {
      setStatus("uploading");
      setProgress("");
      setError("");

      const response = await uploadAndUpscale(selectedFile, params);
      setJobId(response.jobId);
      setStatus("processing");

      // Subscribe to SSE progress
      subscribeProgress(response.jobId, {
        onProgress: (data) => {
          setProgress(data);
        },
        onDone: () => {
          setStatus("done");
          setProgress("100%");
        },
        onError: (err) => {
          setStatus("error");
          setError(err);
        },
        onStatus: (statusData) => {
          if (statusData.status === "done") {
            setStatus("done");
            setProgress("100%");
          }
        },
      });
    } catch (err: any) {
      setStatus("error");
      setError(err.message);
    }
  }, [selectedFile, params]);

  const handleStop = useCallback(async () => {
    if (jobId) {
      await stopJob(jobId);
      setStatus("stopped");
    }
  }, [jobId]);

  const handleReset = useCallback(() => {
    handleClear();
  }, [handleClear]);

  const isProcessing = status === "uploading" || status === "processing";

  return (
    <div className="flex h-screen w-screen bg-base-100">
      {/* Sidebar */}
      <aside className="w-[340px] shrink-0 h-full flex flex-col border-r border-base-content/5 bg-base-200/30">
        {/* Logo */}
        <div className="px-6 py-5 flex items-center gap-3 border-b border-base-content/5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/25">
            <Sparkles size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold gradient-text">Upscayl</h1>
            <p className="text-[10px] text-base-content/40 tracking-widest uppercase">
              AI Image Upscaler
            </p>
          </div>
        </div>

        {/* Settings */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <SettingsPanel
            params={params}
            onChange={setParams}
            disabled={isProcessing}
          />
        </div>

        {/* Upscale Button + Progress */}
        <div className="px-5 pb-5 flex flex-col gap-3">
          <ProgressDisplay
            status={status}
            progress={progress}
            error={error}
            onStop={handleStop}
          />

          <button
            className="btn btn-primary w-full gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300"
            onClick={handleUpscale}
            disabled={!selectedFile || isProcessing}
          >
            <Sparkles size={16} />
            {isProcessing
              ? "处理中..."
              : "开始放大"}
          </button>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-base-content/5 flex items-center justify-between">
          <span className="text-[10px] text-base-content/30">
            Upscayl Web v1.0.0
          </span>
          <a
            href="https://github.com/upscayl/upscayl"
            target="_blank"
            rel="noopener noreferrer"
            className="text-base-content/30 hover:text-primary transition-colors"
          >
            <Github size={14} />
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-full p-6 overflow-hidden">
        {status === "done" && jobId ? (
          <ResultViewer
            originalUrl={getOriginalPreviewUrl(jobId)}
            resultUrl={getResultPreviewUrl(jobId)}
            downloadUrl={getResultDownloadUrl(jobId)}
            onReset={handleReset}
          />
        ) : (
          <ImageUploader
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            previewUrl={previewUrl}
            disabled={isProcessing}
            onClear={handleClear}
          />
        )}
      </main>
    </div>
  );
}
