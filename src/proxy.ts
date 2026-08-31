import { NextRequest, NextResponse } from "next/server";

import { isLighthouseUA } from "@/lib/isLighthouse";

/**
 * Edge proxy (Next 16's renamed middleware) — page-level HTTP cache headers
 * (ported from dinamani-website).
 *
 * The home page, section/category pages and article pages all render on demand
 * (`force-dynamic`), so nothing is placed in Next's full-route cache. Instead we
 * let a CDN/proxy cache the rendered HTML by attaching `Cache-Control` +
 * `CDN-Cache-Control` per page type. Cache HIT ~50ms vs origin render ~600ms+.
 *
 * TTLs (aligned with the Quintype CDN spec):
 *   - max-age                 browser cache (short — CDN owns freshness)
 *   - s-maxage                CDN/proxy cache (the main caching layer)
 *   - stale-while-revalidate  serve stale while refreshing in the background
 *   - stale-if-error          serve stale if origin fails
 *
 * Home + section (dynamic) are layout-dependent and the periodic builder pull
 * updates the store every few minutes, so their edge TTL is kept short (5 min).
 * Articles rarely change after publishing → longer edge TTL (1 h).
 */
const CACHE_SETTINGS = {
  home: {
    "Cache-Control":
      "public, max-age=15, s-maxage=300, stale-while-revalidate=600, stale-if-error=7200",
    "CDN-Cache-Control": "public, max-age=300",
    "Cloudflare-CDN-Cache-Control": "max-age=300",
  },
  dynamic: {
    "Cache-Control":
      "public, max-age=15, s-maxage=300, stale-while-revalidate=600, stale-if-error=7200",
    "CDN-Cache-Control": "public, max-age=300",
    "Cloudflare-CDN-Cache-Control": "max-age=300",
  },
  article: {
    "Cache-Control":
      "public, max-age=60, s-maxage=3600, stale-while-revalidate=86400, stale-if-error=86400",
    "CDN-Cache-Control": "public, max-age=3600",
    "Cloudflare-CDN-Cache-Control": "max-age=3600",
  },
  static: {
    "Cache-Control":
      "public, max-age=300, s-maxage=7200, stale-while-revalidate=14400, stale-if-error=86400",
    "CDN-Cache-Control": "public, max-age=7200",
    "Cloudflare-CDN-Cache-Control": "max-age=7200",
  },
} as const;

type PageType = keyof typeof CACHE_SETTINGS;

// Known non-collection static pages get the long "static" TTL. Everything else
// is classified by URL shape below.
const STATIC_PATHS = new Set<string>([
  "/about-us",
  "/about",
  "/contact-us",
  "/contact",
  "/privacy-policy",
  "/terms-of-use",
  "/terms",
  "/disclaimer",
  "/advertise-with-us",
]);

/**
 * Classify the request into a cache page type.
 * - `/` (or `/home`)               → home
 * - a known static page            → static
 * - ≥2 path segments               → article  (Quintype story slugs are deep,
 *                                     e.g. /politics/2026/Aug/12/some-headline)
 * - a single segment               → dynamic  (section/category page, e.g. /sports)
 *
 * Mirrors dinamani's `pathname.split('/').length > 2` article heuristic. A rare
 * two-segment nested section page would be cached with the (longer) article TTL —
 * harmless, and still purgeable at the edge.
 */
function classify(pathname: string): PageType {
  if (pathname === "/" || pathname === "/home") return "home";
  if (STATIC_PATHS.has(pathname)) return "static";
  // split("/") on "/a/b" → ["", "a", "b"] (length 3): ≥2 segments → article.
  return pathname.split("/").length > 2 ? "article" : "dynamic";
}

function setCacheHeaders(response: NextResponse, pageType: PageType): void {
  for (const [key, value] of Object.entries(CACHE_SETTINGS[pageType])) {
    response.headers.set(key, value);
  }
  // CDNs key HTML vs RSC-flight payloads off these request headers. Cloudflare
  // ignores Vary, so the RSC bypass below is the real guard — Vary is a hint for
  // spec-compliant proxies.
  response.headers.set(
    "Vary",
    "Accept-Encoding, RSC, Next-Router-State-Tree, Next-Router-Prefetch",
  );
  response.headers.set("x-cache-page-type", pageType);
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname, searchParams } = request.nextUrl;

  // Forward the request path to server components (CustomSchemaScripts reads it
  // via headers() to filter page-scoped custom JSON-LD).
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  const forward = { request: { headers: requestHeaders } };

  // RSC requests (client-side navigations / prefetches) carry partial flight
  // data, not full HTML — they must NEVER be cached by a shared CDN or they poison
  // the HTML cache entry (Cloudflare ignores Vary, so flight + HTML would collide
  // on the same key). Serve them privately with no-store.
  //
  // NOTE: Next 16's production server strips the `RSC` / `Next-Router-Prefetch` /
  // `Next-Router-State-Tree` request headers and the `_rsc` query param before the
  // proxy runs, so those checks (kept for platforms that DO expose them) aren't
  // enough on their own. The reliable signal that survives is `Sec-Fetch-Dest`:
  // on a page route, a real navigation is `document` while an RSC/flight fetch is
  // `empty`. Bots/curl send no Sec-Fetch-* header → treated as a document → cached.
  const secFetchDest = request.headers.get("sec-fetch-dest");
  const isRSC =
    secFetchDest === "empty" ||
    request.headers.get("RSC") === "1" ||
    request.headers.get("rsc") === "1" ||
    request.headers.has("Next-Router-State-Tree") ||
    request.headers.has("next-router-state-tree") ||
    request.headers.has("Next-Router-Prefetch") ||
    request.headers.has("next-router-prefetch") ||
    searchParams.has("_rsc");
  if (isRSC) {
    const response = NextResponse.next(forward);
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("CDN-Cache-Control", "no-store");
    response.headers.set("Cloudflare-CDN-Cache-Control", "no-store");
    response.headers.set("x-cache-page-type", "rsc-bypass");
    return response;
  }

  // Lighthouse / PSI / synthetic monitors must always hit origin (they render a
  // lean, ad-free page that must never be cached and served to real users).
  if (isLighthouseUA(request.headers.get("user-agent"))) {
    const response = NextResponse.next(forward);
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("CDN-Cache-Control", "no-store");
    response.headers.set("Cloudflare-CDN-Cache-Control", "no-store");
    response.headers.set("x-cache-page-type", "lighthouse-bypass");
    return response;
  }

  // A paginated / query-filtered page is still cacheable but shouldn't share the
  // base-page entry — the search string is already part of the CDN cache key, so
  // no special handling is needed; just tag it with the base page type.
  const response = NextResponse.next(forward);
  setCacheHeaders(response, classify(pathname));
  return response;
}

// Only run on real page navigations. Skip Next internals, static assets, API +
// sync routes, AMP (its route handler sets its own cache headers), and the SEO
// files — none of these should get page-level HTML cache headers.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|api/|amp/|favicon.ico|robots.txt|sitemap.xml|manifest.json|logo.png|images/|fonts/|sw.js|service-worker.js|izooto.html).*)",
  ],
};
