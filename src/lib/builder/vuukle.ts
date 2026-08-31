/**
 * Vuukle comments — resolve the builder-synced config into concrete markup for
 * a given story. The builder stores ONE config (slug "default") with:
 *   - top-level `apiKey` / `host` / `enabled`
 *   - `nonAmp.html`      — a full HTML doc rendered inside an <iframe> (HTML page)
 *   - `amp.commentsCode` / `amp.loadCookieCode` / `amp.headScripts` (AMP page)
 *   - `dynamicFields`    — placeholder → { dynamic, source, value, urlEncode }
 *
 * Placeholders in the templates (`{API_KEY}`, `{ARTICLE_ID}`, `{HOST}`, …) are
 * substituted per-article so the script loads with that article's values.
 */

export interface VuukleDynamicField {
  dynamic?: boolean;
  source?: string;
  value?: string;
  urlEncode?: boolean;
}

export interface VuukleConfig {
  enabled?: boolean;
  apiKey?: string;
  host?: string;
  nonAmp?: { enabled?: boolean; html?: string };
  amp?: {
    enabled?: boolean;
    headScripts?: string;
    adCode?: string;
    loadCookieCode?: string;
    commentsCode?: string;
    emotes?: boolean;
  };
  dynamicFields?: Record<string, VuukleDynamicField>;
}

/** Per-article values the `dynamicFields.source` names resolve against. */
export interface VuukleArticleContext {
  canonicalUrl?: string;
  id?: string;
  title?: string;
  imageUrl?: string;
  categorySlug?: string;
}

/** Unwrap the stored `{ slug, config }` entry to the inner config. */
export function extractVuukleConfig(
  entry: Record<string, unknown> | null | undefined,
): VuukleConfig | null {
  if (!entry) return null;
  const config = (entry.config ?? entry) as VuukleConfig;
  return config && typeof config === "object" ? config : null;
}

/**
 * Build the placeholder → value map for a story. Combines the static
 * `{API_KEY}`/`{HOST}`/`{EMOTES}`/`{WIDGET_ID}` keys with every configured
 * `dynamicFields` entry (resolved from the article context, url-encoded when the
 * field asks for it).
 */
export function resolveVuukleVars(
  config: VuukleConfig,
  ctx: VuukleArticleContext,
  widgetId: string,
): Record<string, string> {
  const vars: Record<string, string> = {
    API_KEY: config.apiKey ?? "",
    HOST: config.host ?? "",
    WIDGET_ID: widgetId,
    EMOTES: String(config.amp?.emotes ?? false),
  };

  const sources = ctx as Record<string, unknown>;
  for (const [key, field] of Object.entries(config.dynamicFields ?? {})) {
    let value = field.dynamic
      ? String(sources[field.source ?? ""] ?? "")
      : String(field.value ?? "");
    if (field.urlEncode) value = encodeURIComponent(value);
    vars[key] = value;
  }
  return vars;
}

/** Replace every `{KEY}` token that has a value in `vars` (unknown tokens kept). */
export function applyVuukleVars(
  template: string,
  vars: Record<string, string>,
): string {
  return (template ?? "").replace(/\{([A-Z0-9_]+)\}/g, (whole, key: string) =>
    key in vars ? vars[key] : whole,
  );
}

/**
 * Inject extra keys into the embed's `VUUKLE_CONFIG` object literal. Vuukle's
 * platform.js otherwise derives the site host/url from `window.location` — which
 * inside the srcdoc iframe is the PAGE origin (localhost / a preview domain), so
 * the API 401s on the unregistered host. Passing the configured `host`/`url`
 * makes Vuukle key comments off the real site regardless of where it runs.
 */
export function injectVuukleConfig(
  html: string,
  extra: Record<string, string>,
): string {
  const entries = Object.entries(extra)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)},`)
    .join("");
  if (!entries) return html;
  return html.replace(/(var\s+VUUKLE_CONFIG\s*=\s*\{)/, `$1${entries}`);
}

/** A stable-ish widget id derived from the story id (no Math.random — SSR-safe). */
export function vuukleWidgetId(storyId?: string): string {
  const clean = String(storyId ?? "").replace(/[^\w-]/g, "").slice(0, 24);
  return `vuukle-${clean || "comments"}`;
}
