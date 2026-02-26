import { useEffect, useState } from "react";
import { getModels, ModelInfo, UpscaleParams } from "../api/client";
import { Settings, Zap, Layers, Maximize2 } from "lucide-react";

interface SettingsPanelProps {
  params: UpscaleParams;
  onChange: (params: UpscaleParams) => void;
  disabled?: boolean;
}

export default function SettingsPanel({
  params,
  onChange,
  disabled,
}: SettingsPanelProps) {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getModels()
      .then(setModels)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const update = (key: keyof UpscaleParams, value: any) => {
    onChange({ ...params, [key]: value });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Model Selection */}
      <div className="form-control">
        <label className="label">
          <span className="label-text flex items-center gap-2 text-sm font-medium">
            <Zap size={14} className="text-primary" />
            AI 模型
          </span>
        </label>
        <select
          className="select select-bordered select-sm w-full bg-base-200/50 border-base-content/10 focus:border-primary transition-colors"
          value={params.model}
          onChange={(e) => update("model", e.target.value)}
          disabled={disabled || loading}
        >
          {loading && <option>加载中...</option>}
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {/* Scale */}
      <div className="form-control">
        <label className="label">
          <span className="label-text flex items-center gap-2 text-sm font-medium">
            <Maximize2 size={14} className="text-primary" />
            放大倍数
          </span>
        </label>
        <div className="flex gap-2">
          {["2", "3", "4"].map((scale) => (
            <button
              key={scale}
              className={`btn btn-sm flex-1 transition-all duration-200 ${
                params.scale === scale
                  ? "btn-primary shadow-lg shadow-primary/25"
                  : "btn-ghost bg-base-200/50 border-base-content/10"
              }`}
              onClick={() => update("scale", scale)}
              disabled={disabled}
            >
              {scale}x
            </button>
          ))}
        </div>
      </div>

      {/* Output Format */}
      <div className="form-control">
        <label className="label">
          <span className="label-text flex items-center gap-2 text-sm font-medium">
            <Layers size={14} className="text-primary" />
            输出格式
          </span>
        </label>
        <div className="flex gap-2">
          {(["png", "jpg", "webp"] as const).map((fmt) => (
            <button
              key={fmt}
              className={`btn btn-sm flex-1 uppercase transition-all duration-200 ${
                params.saveImageAs === fmt
                  ? "btn-primary shadow-lg shadow-primary/25"
                  : "btn-ghost bg-base-200/50 border-base-content/10"
              }`}
              onClick={() => update("saveImageAs", fmt)}
              disabled={disabled}
            >
              {fmt}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Settings Toggle */}
      <div className="collapse collapse-arrow bg-base-200/30 rounded-xl border border-base-content/5">
        <input type="checkbox" />
        <div className="collapse-title text-sm font-medium flex items-center gap-2 py-3 min-h-0">
          <Settings size={14} className="text-primary" />
          高级设置
        </div>
        <div className="collapse-content pb-4">
          <div className="flex flex-col gap-3 pt-2">
            {/* Tile Size */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-xs">Tile Size</span>
                <span className="label-text-alt text-xs text-base-content/40">
                  {params.tileSize || "自动"}
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="512"
                step="32"
                value={params.tileSize || 0}
                onChange={(e) =>
                  update(
                    "tileSize",
                    parseInt(e.target.value) || undefined
                  )
                }
                className="range range-primary range-xs"
                disabled={disabled}
              />
            </div>

            {/* Compression */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-xs">压缩率</span>
                <span className="label-text-alt text-xs text-base-content/40">
                  {params.compression || "0"}
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={parseInt(params.compression || "0")}
                onChange={(e) => update("compression", e.target.value)}
                className="range range-primary range-xs"
                disabled={disabled}
              />
            </div>

            {/* Custom Width */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-xs">自定义宽度</span>
              </label>
              <input
                type="number"
                placeholder="留空使用默认倍数"
                value={params.customWidth || ""}
                onChange={(e) =>
                  update("customWidth", e.target.value || undefined)
                }
                className="input input-bordered input-xs w-full bg-base-200/50"
                disabled={disabled}
              />
            </div>

            {/* TTA Mode */}
            <div className="form-control">
              <label className="label cursor-pointer py-1">
                <span className="label-text text-xs">TTA 模式 (更高质量)</span>
                <input
                  type="checkbox"
                  className="toggle toggle-primary toggle-xs"
                  checked={params.ttaMode || false}
                  onChange={(e) => update("ttaMode", e.target.checked)}
                  disabled={disabled}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
