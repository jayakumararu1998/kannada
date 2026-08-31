import { headers } from "next/headers";

import { getStore } from "@/lib/builder/store";

/**
 * Renders builder-authored custom JSON-LD (dinamani parity). Global scripts
 * (no `pageUrl`) render everywhere; page-scoped scripts only on their URL.
 * Emitted as ONE raw HTML blob via dangerouslySetInnerHTML (inside a hidden,
 * suppressHydrationWarning div) so third-party DOM mutations never cause a
 * hydration mismatch. Requires the proxy to forward the request path as the
 * `x-pathname` header.
 */

function normalise(path: string | null | undefined): string {
  if (!path) return "/";
  let p = path;
  try {
    p = decodeURIComponent(p);
  } catch {
    /* keep raw */
  }
  p = p.replace(/^https?:\/\/[^/]+/i, "");
  if (!p.startsWith("/")) p = `/${p}`;
  return p.length > 1 ? p.replace(/\/+$/, "") : p;
}

function escapeForScriptTag(json: string): string {
  // Neutralize `<` so a `</script>` (or `<!--`) inside the JSON can't break out.
  return json.replace(/</g, "\\u003c");
}

function escapeAttr(v: string): string {
  return v.replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

export default async function CustomSchemaScripts() {
  const all = getStore().getAllCustomSchemaScripts();
  if (!Object.keys(all).length) return null;

  const h = await headers();
  const currentPath = normalise(h.get("x-pathname"));

  const seen = new Set<string>();
  const parts: string[] = [];

  for (const cfg of Object.values(all)) {
    if (cfg.enabled === false || !cfg.script) continue;
    // Page-scoped scripts only render on their own URL.
    if (cfg.pageUrl && normalise(cfg.pageUrl) !== currentPath) continue;

    let json: string;
    try {
      // Re-serialize to validate + normalize (dedupe by content).
      json = JSON.stringify(JSON.parse(cfg.script));
    } catch {
      // Not valid JSON — emit the raw string as-authored.
      json = cfg.script;
    }
    if (seen.has(json)) continue;
    seen.add(json);

    parts.push(
      `<script type="application/ld+json" id="custom-schema-${escapeAttr(
        String(cfg.id),
      )}">${escapeForScriptTag(json)}</script>`,
    );
  }

  if (!parts.length) return null;

  return (
    <div
      suppressHydrationWarning
      style={{ display: "none" }}
      dangerouslySetInnerHTML={{ __html: parts.join("") }}
    />
  );
}
