import { useState } from "react";
import { ModelInfo } from "../api/client";
import { SwatchBook, X, Maximize2 } from "lucide-react";
import { useTranslation } from "../i18n";

interface SelectModelDialogProps {
  models: ModelInfo[];
  selectedModel: string;
  onSelect: (modelId: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

export default function SelectModelDialog({
  models,
  selectedModel,
  onSelect,
  disabled,
  loading,
}: SelectModelDialogProps) {
  const t = useTranslation();
  const [open, setOpen] = useState(false);
  const [zoomedModel, setZoomedModel] = useState<string | null>(null);

  // Get localized model name and description, falling back to server data
  const getModelName = (model: ModelInfo) => {
    const localized = t(`models.${model.id}.name`);
    return localized !== `models.${model.id}.name` ? localized : model.name;
  };

  const getModelDescription = (model: ModelInfo) => {
    const localized = t(`models.${model.id}.description`);
    return localized !== `models.${model.id}.description` ? localized : model.description;
  };

  const selectedInfo = models.find((m) => m.id === selectedModel);

  const handleSelect = (modelId: string) => {
    onSelect(modelId);
    setOpen(false);
  };

  const handleZoom = (e: React.MouseEvent, modelId: string) => {
    e.stopPropagation();
    setZoomedModel(modelId);
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        className="btn btn-sm w-full justify-start gap-2 bg-base-200/50 border-base-content/10 hover:border-primary transition-colors font-normal"
        onClick={() => setOpen(true)}
        disabled={disabled || loading}
      >
        <SwatchBook size={14} className="text-primary shrink-0" />
        <span className="truncate">
          {loading ? t("settings.loading") : selectedInfo ? getModelName(selectedInfo) : selectedModel}
        </span>
      </button>
      {selectedInfo && (
        <p className="text-xs text-base-content/50 mt-1.5 px-1 leading-relaxed">
          {getModelDescription(selectedInfo)}
        </p>
      )}

      {/* Model Selection Dialog */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          {/* Dialog */}
          <div className="relative bg-base-100 rounded-2xl shadow-2xl border border-base-content/10 w-[480px] max-h-[85vh] flex flex-col mx-4 animate-in">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-base-content/10">
              <h3 className="text-base font-semibold">{t("modelDialog.title")}</h3>
              <button
                className="btn btn-ghost btn-sm btn-circle"
                onClick={() => setOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            {/* Body */}
            <div className="overflow-y-auto p-4 flex flex-col gap-3">
              {models.map((model) => (
                <button
                  key={model.id}
                  className={`group w-full text-left rounded-xl border transition-all duration-200 p-3 hover:border-primary/50 hover:bg-base-200/50 ${
                    selectedModel === model.id
                      ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                      : "border-base-content/10 bg-base-200/30"
                  }`}
                  onClick={() => handleSelect(model.id)}
                >
                  {/* Model Info */}
                  <div className="mb-2">
                    <p className={`font-semibold text-sm ${
                      selectedModel === model.id ? "text-primary" : ""
                    }`}>
                      {getModelName(model)}
                    </p>
                    {getModelDescription(model) && (
                      <p className="text-xs text-base-content/50 mt-0.5 leading-relaxed">
                        {getModelDescription(model)}
                      </p>
                    )}
                  </div>
                  {/* Before/After Comparison */}
                  <div className="relative h-36 w-full overflow-hidden rounded-lg">
                    <div className="flex h-full w-full">
                      <img
                        src={`/${model.id}/before.webp`}
                        alt={t("modelDialog.before")}
                        className="h-full w-1/2 object-cover"
                        loading="lazy"
                      />
                      <img
                        src={`/${model.id}/after.webp`}
                        alt={t("modelDialog.after")}
                        className="h-full w-1/2 object-cover"
                        loading="lazy"
                      />
                    </div>
                    {/* Divider Line */}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="h-full w-px bg-white/50" />
                    </div>
                    {/* Labels */}
                    <div className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                      {t("modelDialog.before")}
                    </div>
                    <div className="absolute bottom-1.5 right-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                      {t("modelDialog.after")}
                    </div>
                    {/* Zoom Button */}
                    <button
                      className="absolute right-1.5 top-1.5 btn btn-xs btn-circle bg-black/50 hover:bg-black/70 border-0 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleZoom(e, model.id)}
                    >
                      <Maximize2 size={12} />
                    </button>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Zoomed Image Dialog */}
      {zoomedModel && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/80"
            onClick={() => setZoomedModel(null)}
          />
          <div className="relative w-screen h-screen flex">
            <div className="relative w-1/2 h-full">
              <img
                src={`/${zoomedModel}/before.webp`}
                alt={t("modelDialog.before")}
                className="w-full h-full object-contain bg-black"
              />
              <div className="absolute bottom-4 left-4 rounded bg-black/60 px-2 py-1 text-sm text-white">
                {t("modelDialog.before")}
              </div>
            </div>
            <div className="relative w-1/2 h-full">
              <img
                src={`/${zoomedModel}/after.webp`}
                alt={t("modelDialog.after")}
                className="w-full h-full object-contain bg-black"
              />
              <div className="absolute bottom-4 right-4 rounded bg-black/60 px-2 py-1 text-sm text-white">
                {t("modelDialog.after")}
              </div>
            </div>
            <button
              className="absolute right-4 top-4 btn btn-circle btn-sm bg-base-content/20 hover:bg-base-content/40 border-0 text-white"
              onClick={() => setZoomedModel(null)}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
