import { useEffect, useRef, useCallback } from "react";
import "altcha";

interface AltchaWidgetProps {
  onVerified: (payload: string) => void;
  onReset?: () => void;
}

export default function AltchaWidget({
  onVerified,
  onReset,
}: AltchaWidgetProps) {
  const widgetRef = useRef<HTMLElement>(null);
  const onVerifiedRef = useRef(onVerified);
  const onResetRef = useRef(onReset);

  // Keep refs in sync to avoid re-registering listeners
  useEffect(() => {
    onVerifiedRef.current = onVerified;
    onResetRef.current = onReset;
  }, [onVerified, onReset]);

  useEffect(() => {
    const el = widgetRef.current;
    if (!el) return;

    const handleStateChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.state === "verified" && detail?.payload) {
        onVerifiedRef.current(detail.payload);
      }
      if (detail?.state === "unverified") {
        onResetRef.current?.();
      }
    };

    el.addEventListener("statechange", handleStateChange);
    return () => el.removeEventListener("statechange", handleStateChange);
  }, []);

  return (
    <div style={{ position: "absolute", opacity: 0, pointerEvents: "none", height: 0, overflow: "hidden" }}>
      {/* @ts-ignore — altcha-widget is a web component registered by 'altcha' */}
      <altcha-widget
        ref={widgetRef}
        challengeurl="/api/altcha/challenge"
        auto="onload"
        hidefooter
        hidelogo
      />
    </div>
  );
}
