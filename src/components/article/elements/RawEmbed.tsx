"use client";

import { useEffect, useRef } from "react";

/**
 * Renders a Quintype `embed-js` blob (base64-encoded HTML that usually contains
 * `<script>` tags — tweets, instagram, generic third-party embeds). React's
 * `dangerouslySetInnerHTML` does NOT execute injected <script> tags, so we
 * rebuild each script node and append it so the browser runs it. Kept minimal
 * and client-only; it renders nothing on the server (embeds are below-the-fold
 * enhancement, not LCP content).
 */
export default function RawEmbed({
  embedJs,
  className,
  raw = false,
}: {
  embedJs?: string;
  className?: string;
  /** Skip the base64 decode — the content is already raw HTML/JS (ad codes,
   *  custom HTML), not a Quintype base64 `embed-js` blob. */
  raw?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host || !embedJs) return;

    let html = embedJs;
    if (!raw && /^[A-Za-z0-9+/=\s]+$/.test(embedJs)) {
      // Only attempt base64 decode when the blob actually looks like base64
      // (Quintype `embed-js`); raw ad/HTML markup is used verbatim. Decode as
      // UTF-8 — a plain atob() yields Latin-1, which garbles the Kannada text in
      // tweet/embed blockquotes ("encrypted text" flash before the widget loads).
      try {
        const bin = atob(embedJs.replace(/\s+/g, ""));
        const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
        html = new TextDecoder("utf-8").decode(bytes);
      } catch {
        html = embedJs;
      }
    }

    host.innerHTML = html;

    // Re-create <script> nodes so they actually execute.
    host.querySelectorAll("script").forEach((old) => {
      const s = document.createElement("script");
      for (const attr of Array.from(old.attributes)) {
        s.setAttribute(attr.name, attr.value);
      }
      s.text = old.textContent ?? "";
      old.replaceWith(s);
    });

    // When the platform script is ALREADY loaded (common in live blogs with
    // many tweets), the re-injected widgets.js won't re-scan on its own — kick
    // the enhancer so the fallback blockquote is replaced by the real embed
    // quickly instead of lingering as plain text.
    const w = window as unknown as {
      twttr?: { widgets?: { load?: (el?: Element) => void } };
      instgrm?: { Embeds?: { process?: () => void } };
    };
    const enhance = () => {
      w.twttr?.widgets?.load?.(host);
      w.instgrm?.Embeds?.process?.();
    };
    enhance();
    const t = window.setTimeout(enhance, 400);

    return () => {
      window.clearTimeout(t);
      host.innerHTML = "";
    };
  }, [embedJs, raw]);

  if (!embedJs) return null;
  return <div ref={ref} className={className} />;
}
