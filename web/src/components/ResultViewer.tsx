import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from "react-compare-slider";
import { Download, ZoomIn, RotateCcw } from "lucide-react";

interface ResultViewerProps {
  originalUrl: string;
  resultUrl: string;
  downloadUrl: string;
  onReset: () => void;
}

export default function ResultViewer({
  originalUrl,
  resultUrl,
  downloadUrl,
  onReset,
}: ResultViewerProps) {
  return (
    <div className="flex flex-col h-full gap-4">
      {/* Action bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ZoomIn size={16} className="text-primary" />
          <span className="text-sm font-medium text-base-content/70">
            原图 vs 放大图对比
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={onReset} className="btn btn-ghost btn-sm gap-1">
            <RotateCcw size={14} />
            重新开始
          </button>
          <a
            href={downloadUrl}
            download
            className="btn btn-primary btn-sm gap-1 shadow-lg shadow-primary/25"
          >
            <Download size={14} />
            下载结果
          </a>
        </div>
      </div>

      {/* Image comparison slider */}
      <div className="flex-1 rounded-2xl overflow-hidden border border-base-content/10 glow comparison-slider">
        <ReactCompareSlider
          itemOne={
            <ReactCompareSliderImage src={originalUrl} alt="Original" />
          }
          itemTwo={
            <ReactCompareSliderImage src={resultUrl} alt="Upscaled" />
          }
          style={{ height: "100%", width: "100%" }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between text-xs text-base-content/40 px-2">
        <span>← 原图</span>
        <span>放大后 →</span>
      </div>
    </div>
  );
}
