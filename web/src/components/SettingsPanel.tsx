import { useEffect, useState } from "react";
import { getModels, ModelInfo, UpscaleParams } from "../api/client";
import { Settings, Zap, Layers, Maximize2, Globe } from "lucide-react";
import SelectModelDialog from "./SelectModelDialog";
import { useTranslation, useLocale, LOCALE_LABELS, Locale } from "../i18n";

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
  const t = useTranslation();
  const { locale, setLocale } = useLocale();
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
      {/* Language Switcher */}
      <div className="form-control">
        <label className="label">
          <span className="label-text flex items-center gap-2 text-sm font-medium">
            <Globe size={14} className="text-primary" />
            {t("settings.language")}
          </span>
        </label>
        <select
          className="select select-bordered select-sm w-full bg-base-200/50 border-base-content/10 focus:border-primary transition-colors"
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
        >
          {Object.entries(LOCALE_LABELS).map(([code, label]) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Model Selection */}
      <div className="form-control">
        <label className="label">
          <span className="label-text flex items-center gap-2 text-sm font-medium">
            <Zap size={14} className="text-primary" />
            {t("settings.aiModel")}
          </span>
        </label>
        <SelectModelDialog
          models={models}
          selectedModel={params.model}
          onSelect={(modelId) => update("model", modelId)}
          disabled={disabled}
          loading={loading}
        />
      </div>

      {/* Scale */}
      <div className="form-control">
        <label className="label">
          <span className="label-text flex items-center gap-2 text-sm font-medium">
            <Maximize2 size={14} className="text-primary" />
            {t("settings.scale")}
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
            {t("settings.outputFormat")}
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
          {t("settings.advanced")}
        </div>
        <div className="collapse-content pb-4">
          <div className="flex flex-col gap-3 pt-2">
            {/* Tile Size */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-xs">{t("settings.tileSize")}</span>
                <span className="label-text-alt text-xs text-base-content/40">
                  {params.tileSize || t("settings.tileSizeAuto")}
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
                <span className="label-text text-xs">{t("settings.compression")}</span>
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
                <span className="label-text text-xs">{t("settings.customWidth")}</span>
              </label>
              <input
                type="number"
                placeholder={t("settings.customWidthPlaceholder")}
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
                <span className="label-text text-xs">{t("settings.ttaMode")}</span>
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
