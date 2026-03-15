import { useState } from "react";
import { ShieldCheck, X } from "lucide-react";
import { useTranslation } from "../i18n";

export default function PrivacyNotice() {
  const t = useTranslation();
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-panel rounded-2xl shadow-2xl max-w-md w-full mx-4 p-0 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <ShieldCheck size={22} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-base-content">
              {t("privacy.title")}
            </h2>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="btn btn-ghost btn-sm btn-circle text-base-content/40 hover:text-base-content"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-2">
          <p className="text-sm text-base-content/70 leading-relaxed">
            {t("privacy.body")}
          </p>
        </div>

        {/* Features list */}
        <div className="px-6 pb-4">
          <ul className="space-y-2 mt-3">
            {["privacy.point1", "privacy.point2", "privacy.point3"].map(
              (key) => (
                <li
                  key={key}
                  className="flex items-start gap-2 text-sm text-base-content/60"
                >
                  <ShieldCheck
                    size={14}
                    className="text-emerald-400 mt-0.5 shrink-0"
                  />
                  <span>{t(key)}</span>
                </li>
              )
            )}
          </ul>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2">
          <button
            onClick={() => setVisible(false)}
            className="btn btn-primary w-full shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300"
          >
            {t("privacy.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
