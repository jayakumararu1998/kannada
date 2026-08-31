import "server-only";

/**
 * Render-time data fetching for `data_binding` nodes. Walks a PageJSON to find
 * every unique endpoint, fetches them in parallel, and normalises each response
 * into TransformedItem[] (keeping the original object on `_raw` so field_map can
 * reach any source path).
 */

import { mediaThumb, toMediaUrl } from "@/lib/images";
import { humanTime } from "@/lib/time";

import type { FooterNewsItem, FooterRecentNews } from "./header-footer";
import type {
  Column,
  DataBinding,
  PageJSON,
  Row,
  TransformedItem,
} from "./types";

/** Turn a data_binding into a concrete, absolute endpoint URL (or null). */
export function resolveEndpoint(binding?: DataBinding): string | null {
  if (!binding) return null;
  let base: string | null = binding.api_endpoint ?? null;
  if (!base && binding.collection_id) {
    // Collection ids are resolved against the public collections API.
    const api = process.env.QUINTYPE_API_BASE_URL || "https://api.kannadaprabha.com";
    base = `${api}/api/v1/collections/${binding.collection_id}`;
  }
  if (!base) return null;
  // Bake `limit` and `offset` into the URL so bindings to the same collection
  // with different windows are DISTINCT (not deduped against the same base —
  // e.g. an overview tab's limit:5 strip must not starve another tab's
  // limit:10 paginated list) and keyed consistently between fetch and lookup.
  const sep = () => (base!.includes("?") ? "&" : "?");
  if (binding.limit) base += sep() + `limit=${binding.limit}`;
  if (binding.offset) base += sep() + `offset=${binding.offset}`;
  return base;
}

/** Every unique endpoint referenced by any binding in the page. */
export function extractApiEndpoints(page: PageJSON): DataBinding[] {
  const seen = new Map<string, DataBinding>();
  const add = (b?: DataBinding) => {
    const url = resolveEndpoint(b);
    if (url && !seen.has(url)) seen.set(url, b!);
  };
  const walkColumn = (col: Column) => {
    add(col.data_binding);
    col.columns?.forEach(walkColumn);
    col.rows?.forEach(walkRow);
    col.tabBar?.tabs?.forEach((tab) => tab.rows?.forEach(walkRow));
    col.slider?.rows?.forEach(walkRow);
  };
  const walkRow = (row: Row) => {
    add(row.data_binding);
    row.columns?.forEach(walkColumn);
  };
  for (const section of page.sections ?? []) {
    for (const row of section.rows ?? []) walkRow(row);
  }
  return [...seen.values()];
}

function dig(obj: unknown, path: string): unknown {
  const parts = path
    .replace(/\[(\d*)\]/g, (_m, i) => `.${i === "" ? "0" : i}`)
    .split(".")
    .filter(Boolean);
  let cur: unknown = obj;
  for (const part of parts) {
    if (cur == null) return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

/** True when an array holds real records (objects), not ids/cache-key strings. */
function isRecordArray(v: unknown): v is unknown[] {
  return Array.isArray(v) && (v.length === 0 || typeof v[0] === "object");
}

/**
 * Best-effort pluck of the items array from an arbitrary API response.
 * Tries the configured responsePath first, but ignores it when it resolves to
 * a non-record array (e.g. Quintype's `collection-cache-keys`, a list of id
 * strings) — then falls back to the standard Quintype `collection.items` shape
 * and common top-level keys, so a mismatched builder responsePath still binds.
 */
function pickItems(data: unknown, responsePath?: string): unknown[] {
  if (responsePath) {
    const picked = dig(data, responsePath);
    if (isRecordArray(picked)) return picked;
    if (picked != null && !Array.isArray(picked)) return [picked];
  }
  if (isRecordArray(data)) return data;
  const obj = data as Record<string, unknown>;
  // Quintype collections API: { collection: { items: [{ type, story }] } }.
  const collectionItems = dig(obj, "collection.items");
  if (isRecordArray(collectionItems)) return collectionItems;
  for (const key of ["items", "data", "results", "stories"]) {
    if (isRecordArray(obj?.[key])) return obj[key] as unknown[];
  }
  return [];
}

function mediaUrl(key: unknown): string | undefined {
  // Cards render at ~400-700 CSS px; w=800 covers 2x DPR on the common
  // sizes while cutting the payload ~5-10x vs the original upload.
  return typeof key === "string" ? mediaThumb(key, 800, 70) : undefined;
}

/** Normalise one raw API record (Quintype story or generic) to TransformedItem. */
function transform(raw: unknown): TransformedItem {
  const rec = (raw ?? {}) as Record<string, unknown>;
  // Quintype wraps the payload as { type: "story", story: {...} }.
  const story = (rec.story ?? rec) as Record<string, unknown>;
  const sections = (story.sections as Array<Record<string, unknown>>) ?? [];
  const section0 = sections[0] ?? {};
  return {
    id: String(story.id ?? story["story-content-id"] ?? rec.id ?? ""),
    title: (story.headline as string) ?? (story.title as string) ?? "",
    slug: (story.slug as string) ?? (rec.slug as string) ?? "",
    imageSrc:
      mediaUrl(story["hero-image-s3-key"]) ??
      mediaUrl(story.image) ??
      mediaUrl(rec.image),
    excerpt: (story.subheadline as string) ?? (story.summary as string) ?? "",
    category:
      (section0["display-name"] as string) ?? (section0.name as string) ?? "",
    sectionUrl: (section0.slug as string) ?? "",
    // Human-readable ("2 hours ago" / "12 Aug 2026, 8:09 PM"), via the shared
    // `humanTime` so every card renders the same readable format.
    timeAgo: humanTime(
      (story["last-published-at"] as number) ??
        (story["published-at"] as number),
    ),
    templatetype: (story["story-template"] as string) ?? "",
    isliveblog: String(story["is-live-blog"] ?? ""),
    navigateUrl: (story.url as string) ?? (story.slug as string) ?? "",
    _raw: story,
  };
}

/** Pull a total-count from an arbitrary collection response. */
function pickTotal(data: unknown): number {
  const obj = (data ?? {}) as Record<string, unknown>;
  const col = (obj.collection ?? {}) as Record<string, unknown>;
  const raw =
    obj["total-count"] ?? obj.total ?? col["total-count"] ?? col.total;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

/** Fetch + normalise a single collection endpoint (with total-count). */
export async function fetchCollection(
  binding: DataBinding,
): Promise<{ items: TransformedItem[]; total: number }> {
  const url = resolveEndpoint(binding);
  if (!url) return { items: [], total: 0 };
  try {
    const limit = binding.limit ?? 10;
    // `url` already carries limit/offset when the binding sets them (baked in
    // resolveEndpoint); only append the default limit when absent.
    const fetchUrl = /[?&]limit=/.test(url)
      ? url
      : `${url}${url.includes("?") ? "&" : "?"}limit=${limit}`;
    const res = await fetch(fetchUrl, {
      // Store data is force-dynamic upstream; keep collection data fresh but
      // allow a short window of reuse within a single render burst.
      next: { revalidate: binding.cacheDuration ?? 60 },
    });
    if (!res.ok) return { items: [], total: 0 };
    const data = await res.json();
    const items = pickItems(data, binding.responsePath).slice(0, limit).map(transform);
    return { items, total: pickTotal(data) };
  } catch {
    return { items: [], total: 0 };
  }
}

/**
 * Normalise a story URL/slug to a path on the CURRENT site. Quintype story
 * records carry their canonical absolute URL (https://www.kannadaprabha.com/…);
 * linking that would navigate off-domain, so keep only the path.
 */
function toSitePath(u: string): string {
  if (!u || u.startsWith("/")) return u;
  if (/^https?:\/\//i.test(u)) {
    try {
      const parsed = new URL(u);
      return parsed.pathname + parsed.search;
    } catch {
      return u;
    }
  }
  return `/${u.replace(/^\/+/, "")}`;
}

/**
 * Fetch the footer "recent news" panel list from its builder-configured
 * `apiUrl`. Reuses the Quintype-aware collection fetch/transform, then applies
 * any explicit `fieldMapping` overrides (each maps a card field → an API path
 * resolved against the original record). Empty mappings fall back to the
 * transformed defaults. Returns at most `count` cards; never throws.
 */
export async function fetchFooterNews(
  cfg: FooterRecentNews | undefined | null,
): Promise<FooterNewsItem[]> {
  if (!cfg?.apiUrl) return [];
  const count = cfg.count && cfg.count > 0 ? cfg.count : 6;

  const { items } = await fetchCollection({
    api_endpoint: cfg.apiUrl,
    limit: count,
    responsePath: cfg.dataPath,
  });

  const fm = cfg.fieldMapping ?? {};
  // Resolve an explicit field-mapping override (API path → string), else "".
  const over = (path: string | undefined, raw: Record<string, unknown>): string => {
    if (!path) return "";
    const v = dig(raw, path);
    return v == null ? "" : String(v);
  };

  return items
    .slice(0, count)
    .map((it): FooterNewsItem => {
      const raw = it._raw ?? {};
      const imageOverride = over(fm.image, raw); // usually an S3 key
      return {
        title: over(fm.title, raw) || it.title || "",
        url: toSitePath(over(fm.url, raw) || it.navigateUrl || it.slug || ""),
        imageUrl: imageOverride ? toMediaUrl(imageOverride) : it.imageSrc,
        date: over(fm.date, raw) || it.timeAgo || undefined,
        summary: over(fm.summary, raw) || it.excerpt || undefined,
      };
    })
    .filter((n) => n.title);
}

/**
 * Fetch every endpoint in a page in parallel. Returns the items map plus a
 * parallel map of endpoint → total-count (for pagination).
 */
export async function fetchAllPageData(
  page: PageJSON,
): Promise<{ data: Map<string, TransformedItem[]>; totals: Map<string, number> }> {
  const bindings = extractApiEndpoints(page);
  const totals = new Map<string, number>();
  const entries = await Promise.all(
    bindings.map(async (b) => {
      const url = resolveEndpoint(b)!;
      const { items, total } = await fetchCollection(b);
      if (total) totals.set(url, total);
      return [url, items] as const;
    }),
  );
  return { data: new Map(entries), totals };
}
