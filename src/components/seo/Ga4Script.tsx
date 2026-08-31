import "server-only";

import { getStore } from "@/lib/builder/store";

/**
 * GA4 tag from the builder-synced `kp_ga4_script` website-setting.
 *
 * The setting stores raw HTML (`<script async src=…gtag/js>` + the inline
 * gtag bootstrap). React's dangerouslySetInnerHTML on a <div> would not
 * execute scripts, so the tags are parsed out server-side and re-emitted as
 * REAL <script> elements — server-rendered scripts run natively in the
 * browser. Rendered in the root layout <head>, so every page reports to GA.
 * Editors update/disable it from the builder (isActive) — no redeploy.
 */

interface ParsedScript {
  src?: string;
  async?: boolean;
  defer?: boolean;
  code?: string;
}

function parseScripts(html: string): ParsedScript[] {
  const out: ParsedScript[] = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const attrs = m[1] || "";
    const src = attrs.match(/src\s*=\s*["']([^"']+)["']/i)?.[1];
    out.push({
      src,
      async: /\basync\b/i.test(attrs),
      defer: /\bdefer\b/i.test(attrs),
      code: m[2]?.trim() || undefined,
    });
  }
  return out;
}

export default function Ga4Script() {
  const setting = getStore().getWebsiteSetting("kp_ga4_script");
  if (!setting || setting.isActive === false) return null;
  const html = typeof setting.value === "string" ? setting.value : "";
  if (!html.trim()) return null;

  const scripts = parseScripts(html);
  if (scripts.length === 0) return null;

  // The inline bootstrap (`window.dataLayer`, `gtag('config', …)`) still runs
  // immediately — it only pushes onto an array, so no hit is lost. Only the
  // 178 KiB gtag.js DOWNLOAD is postponed, because as an `async` tag in <head>
  // it was competing for bandwidth with the LCP image on every page. It is
  // injected on the first of: user interaction, window `load` + idle, or a 5s
  // backstop, so the queued events flush well within the session.
  const srcs = scripts.map((s) => s.src).filter(Boolean) as string[];

  return (
    <>
      {scripts.map((s, i) =>
        s.code ? (
          <script
            key={`ga4-${i}`}
            dangerouslySetInnerHTML={{ __html: s.code }}
          />
        ) : null,
      )}
      {srcs.length > 0 && (
        <script dangerouslySetInnerHTML={{ __html: deferredLoader(srcs) }} />
      )}
    </>
  );
}

/**
 * Inline loader that appends the given script srcs once the page is done with
 * its own critical work (or as soon as the reader touches the page).
 */
function deferredLoader(srcs: string[]): string {
  return (
    "(function(){var s=" +
    JSON.stringify(srcs) +
    ",done=false;function go(){if(done)return;done=true;" +
    "for(var i=0;i<s.length;i++){var t=document.createElement('script');t.async=true;t.src=s[i];document.head.appendChild(t);}" +
    "off();}" +
    "var evs=['pointerdown','keydown','touchstart','scroll'];" +
    "function off(){for(var i=0;i<evs.length;i++)removeEventListener(evs[i],go,{capture:true});}" +
    "for(var i=0;i<evs.length;i++)addEventListener(evs[i],go,{capture:true,passive:true,once:true});" +
    "function idle(){if(window.requestIdleCallback)requestIdleCallback(go,{timeout:3000});else setTimeout(go,1500);}" +
    "if(document.readyState==='complete')idle();else addEventListener('load',idle,{once:true});" +
    "setTimeout(go,5000);})();"
  );
}
