import { Loader2, CheckCircle2, XCircle, StopCircle } from "lucide-react";
import { useTranslation } from "../i18n";

interface ProgressDisplayProps {
  status: "idle" | "uploading" | "processing" | "done" | "error" | "stopped";
  progress: string;
  error?: string;
  onStop?: () => void;
}

export default function ProgressDisplay({
  status,
  progress,
  error,
  onStop,
}: ProgressDisplayProps) {
  const t = useTranslation();

  if (status === "idle") return null;

  // Parse percentage from progress string like "45.00%"
  const percentMatch = progress.match(/([\d.]+)%/);
  const percent = percentMatch ? parseFloat(percentMatch[1]) : 0;

  return (
    <div className="glass-panel rounded-2xl p-5 glow transition-all duration-500">
      <div className="flex items-center gap-3 mb-3">
        {(status === "uploading" || status === "processing") && (
          <>
            <Loader2 size={20} className="text-primary animate-spin" />
            <span className="text-sm font-medium text-base-content/80">
              {status === "uploading" ? t("progress.uploading") : t("progress.processing")}
            </span>
          </>
        )}
        {status === "done" && (
          <>
            <CheckCircle2 size={20} className="text-success" />
            <span className="text-sm font-medium text-success">{t("progress.done")}</span>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle size={20} className="text-error" />
            <span className="text-sm font-medium text-error">{t("progress.error")}</span>
          </>
        )}
        {status === "stopped" && (
          <>
            <StopCircle size={20} className="text-warning" />
            <span className="text-sm font-medium text-warning">{t("progress.stopped")}</span>
          </>
        )}

        {/* Stop button */}
        {status === "processing" && onStop && (
          <button
            onClick={onStop}
            className="btn btn-ghost btn-xs ml-auto text-error hover:bg-error/10"
          >
            <StopCircle size={14} />
            {t("progress.stop")}
          </button>
        )}
      </div>

      {/* Progress bar */}
      {(status === "uploading" || status === "processing") && (
        <div className="w-full bg-base-200 rounded-full h-2.5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300 ease-out progress-shimmer"
            style={{ width: `${Math.max(percent, 2)}%` }}
          />
        </div>
      )}

      {/* Progress text */}
      {progress && status === "processing" && (
        <div className="mt-2 text-xs text-base-content/50 text-right">
          {progress}
        </div>
      )}

      {/* Error message */}
      {error && status === "error" && (
        <div className="mt-2 text-xs text-error/70 bg-error/10 rounded-lg p-3 break-all">
          {error}
        </div>
      )}
    </div>
  );
}
