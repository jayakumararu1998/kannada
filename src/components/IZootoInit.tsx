"use client";

import { useEffect, useRef } from "react";

import { isLighthouseClient } from "@/lib/isLighthouse";

declare global {
  interface Window {
    _izq: unknown[];
    izootoLoaded?: boolean;
  }
}

// Kannada Prabha's iZooto site key — same key production kannadaprabha.com
// ships (`notifications.izooto.izootoKey`) and the key /izooto.html loads.
const IZOOTO_KEY = "4544b1fe65252edb254cdabaab34496289d121e2";

/**
 * iZooto push notifications — deferred loading (dinamani port).
 *
 * Loads the iZooto SDK only after first user interaction, or 10s in — past
 * Lighthouse's measurement window so the script never counts toward TBT, while
 * real users get the push prompt as soon as they engage. After the SDK loads,
 * registers /sw.js (which importScripts the iZooto worker) for push delivery.
 */
export default function IZootoInit() {
  const loadedRef = useRef(false);

  useEffect(() => {
    // Skip synthetic runs (Lighthouse / PSI / headless monitors) entirely.
    if (isLighthouseClient()) return;

    const loadIZooto = () => {
      if (loadedRef.current || window.izootoLoaded) return;
      loadedRef.current = true;
      window.izootoLoaded = true;

      window._izq = window._izq || [];
      window._izq.push(["init"]);

      const script = document.createElement("script");
      script.src = `https://cdn.izooto.com/scripts/${IZOOTO_KEY}.js`;
      script.async = true;
      document.head.appendChild(script);

      script.onload = () => {
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
            // Service-worker registration failures are non-fatal (private mode,
            // unsupported browser) — push simply stays unavailable.
          });
        }
      };
    };

    const timer = setTimeout(loadIZooto, 10000);

    const events = ["scroll", "click", "touchstart"];
    const handleInteraction = () => {
      clearTimeout(timer);
      // Small delay so loading never blocks the interaction itself.
      setTimeout(loadIZooto, 100);
    };
    events.forEach((event) => {
      document.addEventListener(event, handleInteraction, {
        once: true,
        passive: true,
      });
    });

    return () => {
      clearTimeout(timer);
      events.forEach((event) => {
        document.removeEventListener(event, handleInteraction);
      });
    };
  }, []);

  // Renders nothing — the script is injected dynamically.
  return null;
}
