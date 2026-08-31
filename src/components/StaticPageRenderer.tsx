"use client";

import { useEffect, useRef } from "react";

/**
 * Renders a Quintype static-page's raw HTML (about-us, /androidappdownload,
 * /t20worldcup, …). Ported from dinamani's StaticPageRenderer. The content can be
 * a FULL document (`<head>`/`<body>`, `<style>`, `<script>` — jQuery, redirects,
 * carousels), so a plain `dangerouslySetInnerHTML` won't do: injected `<script>`
 * tags don't execute. This client component injects the markup, then re-creates
 * every `<script>` so it runs, and rewrites hardcoded site-domain links to the
 * current origin.
 */

/** Strip control chars that make `innerHTML` throw (same set as dinamani). */
function sanitize(html: string): string {
  return (
    (html ?? "")
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
      // eslint-disable-next-line no-control-regex
      .replace(/[\x80-\x9F]/g, "")
      .replace(/￾|￿/g, "")
  );
}

/**
 * Run an inline widget script with a `document` proxy that replays
 * `DOMContentLoaded`/`readystatechange` listeners immediately. By the time
 * these scripts execute (post-hydration) the real DOMContentLoaded has long
 * since fired, so widget init code waiting on it would otherwise never run.
 * (Ported from dinamani's StaticPageRenderer.)
 */
function runInlineScript(code: string) {
  const patchedDocument = new Proxy(document, {
    get(target, prop, receiver) {
      if (prop === "addEventListener") {
        return (
          type: string,
          listener: EventListenerOrEventListenerObject,
          options?: boolean | AddEventListenerOptions,
        ) => {
          if (type === "DOMContentLoaded" || type === "readystatechange") {
            setTimeout(() => {
              const handler =
                typeof listener === "function"
                  ? listener
                  : listener.handleEvent.bind(listener);
              handler(new Event(type));
            }, 0);
            return;
          }
          return target.addEventListener(type, listener, options);
        };
      }
      const value = Reflect.get(target, prop, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
  const fn = new Function("document", code);
  fn(patchedDocument);
}

/** Pull the inner markup out of a full HTML document (keep head styles/links). */
function innerMarkup(html: string): string {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) return html; // not a full document — use as-is
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const headInner = headMatch ? headMatch[1] : "";
  // Keep <style>/<link> from head; drop <meta>/<title> (the app <head> owns those).
  const keptHead = (headInner.match(/<style[\s\S]*?<\/style>|<link[^>]*>/gi) || []).join("\n");
  return keptHead + bodyMatch[1];
}

export default function StaticPageRenderer({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    let html = innerMarkup(sanitize(content));
    // Rewrite absolute links to this site's domain onto the current origin so
    // they work behind a CDN / on preview hosts.
    const origin = window.location.origin;
    html = html.replace(
      /(href|src)\s*=\s*"https?:\/\/(?:www\.)?kannadaprabha\.com([^"]*)"/gi,
      (_m, attr, path) => `${attr}="${origin}${path}"`,
    );
    // Also rewrite API URLs inside inline scripts (fetch('https://www.kannada
    // prabha.com/api/v1/…')) — same-origin via the /api/v1 proxy rewrite, so
    // widget data loads work on any host without CORS.
    html = html.replace(
      /https?:\/\/(?:www\.)?kannadaprabha\.com(?=\/api\/)/gi,
      origin,
    );

    // Inject markup, then re-create scripts so they actually execute.
    const temp = document.createElement("div");
    temp.innerHTML = html;
    const scripts = Array.from(temp.querySelectorAll("script"));
    scripts.forEach((s) => s.remove());

    container.innerHTML = temp.innerHTML;

    // Run scripts IN ORDER, waiting for each external `src` to load before the
    // next — dependent bundles (jQuery → slick → inline init) need this or the
    // init runs before its library exists.
    let cancelled = false;
    (async () => {
      for (const old of scripts) {
        if (cancelled) return;
        const script = document.createElement("script");
        for (const attr of Array.from(old.attributes)) {
          script.setAttribute(attr.name, attr.value);
        }
        if (old.src) {
          await new Promise<void>((resolve) => {
            script.onload = () => resolve();
            script.onerror = () => resolve();
            container.appendChild(script);
          });
        } else if (old.textContent) {
          try {
            // Inline scripts run through the patched-`document` path so their
            // DOMContentLoaded listeners fire (see runInlineScript).
            runInlineScript(old.textContent);
          } catch {
            // Fallback: a real <script> tag (no DOMContentLoaded replay, but
            // top-level `var`s land on the global scope as the script expects).
            script.textContent = old.textContent;
            container.appendChild(script);
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [content]);

  return <div ref={ref} className={className ?? "static-page-content"} />;
}
