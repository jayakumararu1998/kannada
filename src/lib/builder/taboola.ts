import "server-only";

/**
 * Taboola — resolve the builder-synced config (see [[kannada-prabha-taboola]])
 * into concrete markup for a placement. The builder stores ONE config
 * (slug "default"):
 *
 *   config.enabled                      — global on/off
 *   config.publisherId                  — Taboola account id
 *   config.pages[pageType] = {
 *     enabled,                          — per-page-type on/off
 *     headerCode,                       — the loader bootstrap (inject ONCE/page)
 *     midAd / bottomAd / rightRailAd,   — the placement `<div>` + `_taboola.push`
 *     flushCode,                        — `_taboola.push({flush:true})` (run ONCE)
 *   }
 *
 * Both the dynamic page builder (`widget_type:"taboola"` with `position` +
 * `page_type`) and the article template (`ArticleTaboolaBottom` /
 * `ArticleTaboolaRightRail`) reference a placement by (pageType, position); we
 * look up the exact code here and hand it to the client `TaboolaSlot`.
 */

import { getStore } from "./store";

export interface TaboolaPageConfig {
  enabled?: boolean;
  headerCode?: string;
  flushCode?: string;
  midAd?: string;
  bottomAd?: string;
  rightRailAd?: string;
  [key: string]: unknown;
}

export interface TaboolaConfig {
  enabled?: boolean;
  publisherId?: string;
  pages?: Record<string, TaboolaPageConfig>;
  amp?: {
    enabled?: boolean;
    headerCode?: string;
    bodyCode?: string;
    fullVideoPageAdCode?: string;
  };
  [key: string]: unknown;
}

/** A resolved, ready-to-render placement. */
export interface ResolvedTaboolaPlacement {
  /** The placement `<div id>` + inline `_taboola.push` script (the "body code"). */
  html: string;
  /** The loader bootstrap for this page type (injected once per page). */
  headerCode: string;
  /** The `{flush:true}` push for this page type (run once after all placements). */
  flushCode: string;
  publisherId?: string;
}

/** Unwrap the stored `{ slug, config }` entry to the inner config object. */
export function extractTaboolaConfig(
  entry: Record<string, unknown> | null | undefined,
): TaboolaConfig | null {
  if (!entry) return null;
  const config = (entry.config ?? entry) as TaboolaConfig;
  return config && typeof config === "object" ? config : null;
}

/**
 * Position aliases → the config field that holds the code. The builder's page
 * widget already uses the config keys verbatim (bottomAd/midAd/rightRailAd);
 * this also tolerates a few friendly spellings.
 */
const POSITION_ALIASES: Record<string, keyof TaboolaPageConfig> = {
  bottomad: "bottomAd",
  bottom: "bottomAd",
  below: "bottomAd",
  midad: "midAd",
  mid: "midAd",
  middle: "midAd",
  rightrailad: "rightRailAd",
  rightrail: "rightRailAd",
  right: "rightRailAd",
  sidebar: "rightRailAd",
};

/** Page-type aliases → the config.pages key. */
const PAGE_TYPE_ALIASES: Record<string, string> = {
  home: "homepage",
  homepage: "homepage",
  category: "section",
  section: "section",
  story: "article",
  article: "article",
  author: "author",
  topic: "topic",
};

function normPosition(position?: string): keyof TaboolaPageConfig | null {
  if (!position) return null;
  const key = position.trim();
  const lc = key.toLowerCase();
  if (POSITION_ALIASES[lc]) return POSITION_ALIASES[lc];
  // Already a canonical key (e.g. "bottomAd").
  if (key === "midAd" || key === "bottomAd" || key === "rightRailAd") return key;
  return null;
}

function normPageType(pageType?: string): string {
  const lc = (pageType || "article").trim().toLowerCase();
  return PAGE_TYPE_ALIASES[lc] ?? lc;
}

/**
 * Resolve the code for a Taboola placement, or null when nothing should render
 * (feature off, page-type off, or that placement has no code configured).
 */
export function resolveTaboolaPlacement(opts: {
  pageType?: string;
  position?: string;
}): ResolvedTaboolaPlacement | null {
  const config = extractTaboolaConfig(getStore().getTaboolaSettings());
  if (!config || config.enabled === false) return null;

  const pageType = normPageType(opts.pageType);
  const page = config.pages?.[pageType];
  if (!page || page.enabled === false) return null;

  const field = normPosition(opts.position);
  if (!field) return null;

  const html = (page[field] as string | undefined)?.trim();
  if (!html) return null; // Nothing configured for this slot — render nothing.

  return {
    html,
    headerCode: (page.headerCode as string | undefined)?.trim() || "",
    flushCode: (page.flushCode as string | undefined)?.trim() || "",
    publisherId: config.publisherId,
  };
}
