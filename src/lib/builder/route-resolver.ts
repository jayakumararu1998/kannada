import "server-only";

/**
 * Route resolution — maps an incoming URL to a RouteConfig + PageJSON using the
 * local store. Two layers (dinamani parity):
 *   1. pattern match against configured routes (`getRouteByMatch`)
 *   2. fall back to a page whose own `slug` equals the URL (`findPageBySlug`)
 */

import { normalizePageShape } from "./normalize";
import { getStore, matchPattern, segmentCount } from "./store";
import type { PageJSON, RouteConfig } from "./types";

function normalize(slug: string): string {
  if (!slug || slug === "/") return "/";
  return slug.startsWith("/") ? slug : `/${slug}`;
}

/** Extract every {param}/:param value from a URL given its route pattern. */
export function extractDynamicSlugs(
  pattern: string,
  url: string,
): Record<string, string> | null {
  if (!matchPattern(pattern, url)) return null;
  const pSegs = pattern.split("/").filter(Boolean);
  const uSegs = normalize(url).split("/").filter(Boolean);
  const out: Record<string, string> = {};
  for (let i = 0; i < pSegs.length; i++) {
    const seg = pSegs[i];
    if (seg.startsWith("{") && seg.endsWith("}")) out[seg.slice(1, -1)] = uSegs[i];
    else if (seg.startsWith(":")) out[seg.slice(1)] = uSegs[i];
  }
  return Object.keys(out).length ? out : null;
}

/** The last dynamic segment value — the common "the slug" for a page. */
export function extractDynamicSlug(pattern: string, url: string): string | null {
  const all = extractDynamicSlugs(pattern, url);
  if (!all) return null;
  const values = Object.values(all);
  return values.length ? values[values.length - 1] : null;
}

/** Match a URL to its route config (or a synthetic one from a page slug). */
export function resolveRouteConfig(slug: string): RouteConfig | null {
  const normalized = normalize(slug);
  const store = getStore();

  const route = store.getRouteByMatch(normalized);
  if (route) return route;

  const byPage = store.findPageBySlug(normalized);
  if (byPage) {
    return {
      id: 0,
      name: byPage.page.title || normalized,
      url_pattern: normalized,
      page_type: "dynamic",
      page_id: byPage.pageId,
      segment_count: segmentCount(normalized),
      priority: 0,
      page_slug: normalized,
      page_name: byPage.page.title || normalized,
    };
  }
  return null;
}

/** Load the PageJSON a route points at (by page_id, or embedded json_config). */
export function loadPageForRoute(config: RouteConfig): PageJSON | null {
  const store = getStore();
  let raw: unknown = null;
  if (config.page_id) {
    // Routes may reference a page by its UUID id OR by its slug/name
    // (e.g. page_id "section-category-page"); try id first, then slug.
    raw =
      store.getPageById(config.page_id) ??
      store.findPageBySlug(config.page_id)?.page ??
      // Last resort: the page_id ("web-stories") may be neither a UUID nor a
      // slug but match a page's title ("Web Stories") — happens when a page is
      // cloned and its slug isn't re-pointed. Also try the route's page_name.
      store.findPageByTitle(config.page_id)?.page ??
      (config.page_name
        ? store.findPageByTitle(config.page_name)?.page ?? null
        : null);
  }
  if (!raw && config.page_slug) {
    raw = store.findPageBySlug(config.page_slug)?.page ?? null;
  }
  if (!raw && config.json_config) {
    raw = config.json_config as unknown as PageJSON;
  }
  // Normalise (unwrap layout_json / published_json) so builder-shaped pages render.
  return raw ? (normalizePageShape(raw) ?? (raw as PageJSON)) : null;
}

export interface ResolvedRoute {
  config: RouteConfig;
  page: PageJSON;
  /** Dynamic segment values, if the matched pattern had any. */
  params: Record<string, string> | null;
  /** Whether to hide the site chrome (route- or page-level flag). */
  hideLayout: boolean;
}

/** Full resolution: URL → { config, page, params } or null if nothing matches. */
export function resolveRoute(slug: string): ResolvedRoute | null {
  const config = resolveRouteConfig(slug);
  if (!config) return null;
  const page = loadPageForRoute(config);
  if (!page) return null;
  const params = extractDynamicSlugs(config.url_pattern, normalize(slug));
  const hideLayout = Boolean(config.hide_layout || page.hide_layout);
  return { config, page, params, hideLayout };
}
