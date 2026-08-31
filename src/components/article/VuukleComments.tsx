"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Vuukle comments embed for the HTML article page. The builder's `nonAmp.html`
 * is a self-contained document (loads platform.js, posts a `vuukle-resize`
 * message on content change) already substituted with THIS article's values on
 * the server; we render it via `srcDoc` in a sandboxed iframe and grow the frame
 * to the content height reported for our `widgetId`. Client-only (postMessage).
 *
 * The iframe is only given its `srcDoc` once it scrolls near the viewport.
 * `loading="lazy"` does NOT defer a srcdoc iframe — Chrome loads it straight
 * away — so the widget was pulling ~365 KiB of HIGH-priority third-party JS
 * (platform.js, prebid3.js, comments.modern.js) ~300 ms into the page load, in
 * direct bandwidth contention with the hero image. That was the single biggest
 * contributor to the article page's mobile LCP. Comments live far below the
 * fold; mounting them on approach costs readers nothing.
 */
export default function VuukleComments({
  srcDoc,
  widgetId,
  className,
}: {
  srcDoc: string;
  widgetId: string;
  className?: string;
}) {
  const ref = useRef<HTMLIFrameElement>(null);
  const holder = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(600);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = holder.current;
    if (!node || visible) return;
    // No IntersectionObserver (very old browsers) → just load it.
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      // Start loading a viewport-and-a-half early so the widget is ready by
      // the time the reader actually reaches it.
      { rootMargin: "800px 0px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [visible]);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const d = e.data as {
        type?: string;
        id?: string;
        height?: number;
      } | null;
      if (!d || d.type !== "vuukle-resize" || d.id !== widgetId) return;
      const h = Number(d.height);
      if (Number.isFinite(h) && h > 0) setHeight(h);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [widgetId]);

  // The holder keeps the widget's reserved height whether or not the iframe has
  // mounted, so swapping it in never shifts the page.
  return (
    <div ref={holder} style={{ minHeight: height }}>
      {visible && (
        <iframe
          ref={ref}
          srcDoc={srcDoc}
          title="Comments"
          className={className}
          style={{ width: "100%", height, border: 0, display: "block" }}
          // Vuukle needs scripts + same-origin (for platform.js) and popups/forms
          // for the social login flow.
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals allow-top-navigation-by-user-activation"
        />
      )}
    </div>
  );
}
