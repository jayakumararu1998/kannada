/**
 * Quintype story pull API for the dynamic article page.
 *
 * Stories are served by the *www* host (`API_EXTERNAL_URL`), NOT the builder /
 * api host — `api.kannadaprabha.com` does not resolve and does not serve the
 * Quintype collections/stories endpoints (same constraint the builder faces for
 * collections). All story reads therefore go through `API_EXTERNAL_URL`.
 *
 * Caching: unlike the ported-from source (dinamani) which used `cache:
 * "no-store"` on every article request, we use Next's data cache with a short
 * `revalidate` window. The catch-all route is `force-dynamic` (it reads the
 * in-memory builder store), but `fetch` data-cache still de-dupes and serves
 * cached JSON within the revalidate window — so a hot article renders from
 * cache instead of round-tripping Quintype on every hit. That is the "fast
 * loading vs the old code" win.
 */

import { SITE_URL } from "@/lib/constants";

/** Loose Quintype story shape — the API returns far more; we read defensively. */
export type Story = Record<string, any>;

const STORY_REVALIDATE = 300; // 5 min — breaking edits still surface via periodic pull + CDN
const RELATED_REVALIDATE = 600;

// Quintype stories/collections are served by the Quintype API host
// (`QUINTYPE_API_BASE_URL`, e.g. kannadaprabha-demo.madrid.quintype.io), which
// exposes the `/api/v1/stories*` and `/api/v1/collections` endpoints. When the
// env var is unset we fall back to the canonical www origin (`SITE_URL`).
const WWW = (process.env.QUINTYPE_API_BASE_URL || SITE_URL).replace(/\/+$/, "");

async function fetchJson<T>(
  url: string,
  revalidate: number,
  timeoutMs = 12000,
): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate },
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** A slug can arrive URL-encoded from the catch-all; normalise it. */
function normalizeSlug(slug: string): string {
  return slug
    .split("/")
    .filter(Boolean)
    .map((seg) => {
      try {
        return encodeURIComponent(decodeURIComponent(seg));
      } catch {
        return encodeURIComponent(seg);
      }
    })
    .join("/");
}

/**
 * Fetch a single story by its full slug (e.g.
 * `politics/2026/Aug/12/some-headline`). Returns the bare `story` object, or
 * `null` when the slug is not a story (so the caller can fall through to 404).
 */
export async function getStoryBySlug(slug: string): Promise<Story | null> {
  const clean = normalizeSlug(slug);
  if (!clean) return null;
  const data = await fetchJson<{ story?: Story }>(
    `${WWW}/api/v1/stories-by-slug?slug=${clean}`,
    STORY_REVALIDATE,
  );
  return data?.story ?? null;
}

/** Related stories for the in-article sidebar. */
export async function getRelatedStories(
  storyId: string | undefined,
  sectionId?: string | number,
  limit = 6,
): Promise<Story[]> {
  if (!storyId) return [];
  const params = new URLSearchParams({
    "story-id": String(storyId),
    limit: String(limit),
    fields:
      "headline,slug,hero-image-s3-key,hero-image-metadata,last-published-at,story-template,sections",
  });
  if (sectionId != null) params.set("section-id", String(sectionId));
  const data = await fetchJson<{ "related-stories"?: Story[] }>(
    `${WWW}/api/v1/stories/${storyId}/related-stories?${params.toString()}`,
    RELATED_REVALIDATE,
  );
  return data?.["related-stories"] ?? [];
}

/**
 * Stories from a Quintype collection (e.g. `trending`) — served by the www
 * host. Used for the article-bottom "Trending Stories" strip.
 */
export async function getCollectionStories(
  slug: string,
  limit = 6,
): Promise<Story[]> {
  const data = await fetchJson<{ items?: Array<{ story?: Story }> }>(
    `${WWW}/api/v1/collections/${slug}?limit=${limit}`,
    RELATED_REVALIDATE,
  );
  return (data?.items ?? [])
    .map((i) => i.story)
    .filter((s): s is Story => !!s?.slug);
}

/** A trending/story tag as returned by `/api/v1/tags/{slug}`. */
export interface TagInfo {
  id: number | string;
  name: string;
  slug: string;
}

/**
 * Validate a topic slug and resolve its canonical tag name. The advanced-search
 * endpoint returns *all* stories for a nonexistent tag, so — mirroring dinamani
 * — we first confirm the tag exists via `/tags/{slug}` and use the returned
 * `name` (not the slug) as the search key. Returns `null` when no tag matches.
 */
export async function getTagBySlug(slug: string): Promise<TagInfo | null> {
  const clean = encodeURIComponent(decodeURIComponent(slug));
  if (!clean) return null;
  const data = await fetchJson<{ tags?: TagInfo[] }>(
    `${WWW}/api/v1/tags/${clean}`,
    RELATED_REVALIDATE,
  );
  const tag = data?.tags?.[0];
  return tag?.name ? tag : null;
}

export interface TagStoriesResult {
  total: number;
  items: Story[];
}

/**
 * Stories carrying a given tag, newest first (Quintype `/advanced-search`).
 * `total` drives topic-page pagination. Empty result → `{ total: 0, items: [] }`.
 */
export async function getStoriesByTag(
  tagName: string,
  limit = 9,
  offset = 0,
): Promise<TagStoriesResult> {
  const params = new URLSearchParams({
    "tag-name": tagName,
    sort: "latest-published",
    limit: String(limit),
    offset: String(offset),
  });
  const data = await fetchJson<{ total?: number; items?: Story[] }>(
    `${WWW}/api/v1/advanced-search?${params.toString()}`,
    STORY_REVALIDATE,
  );
  return { total: data?.total ?? 0, items: data?.items ?? [] };
}

/**
 * Full-text story search (Quintype `/advanced-search?q=`), newest first. Powers
 * the `/search/{query}` page. Empty/blank query → `{ total: 0, items: [] }`.
 */
export async function searchStories(
  query: string,
  limit = 20,
  offset = 0,
): Promise<TagStoriesResult> {
  const q = query.trim();
  if (!q) return { total: 0, items: [] };
  const params = new URLSearchParams({
    q,
    sort: "latest-published",
    limit: String(limit),
    offset: String(offset),
  });
  const data = await fetchJson<{ total?: number; items?: Story[] }>(
    `${WWW}/api/v1/advanced-search?${params.toString()}`,
    60, // search stays fresh
  );
  return { total: data?.total ?? 0, items: data?.items ?? [] };
}

/** A single social profile link (platform key + destination URL). */
export interface AuthorSocialLink {
  platform: string;
  url: string;
}

export interface AuthorProfile {
  id: number | string;
  name: string;
  slug: string;
  bio?: string;
  avatarUrl?: string;
  jobTitle?: string;
  /** Verified social profile URLs (twitter/linkedin/…). */
  sameAs: string[];
  /** The author's own social links, keyed by platform (facebook/twitter/…). */
  social?: AuthorSocialLink[];
}

/**
 * Normalise the Quintype author `social` object (`{ facebook: { url } }`) plus a
 * bare `twitter-handle` into a de-duplicated list of `{ platform, url }` links.
 */
function authorSocialLinks(a: Record<string, any>): AuthorSocialLink[] {
  const out: AuthorSocialLink[] = [];
  const seen = new Set<string>();
  const push = (platform: string, url?: string | null) => {
    if (typeof url !== "string" || !/^https?:\/\//.test(url)) return;
    const key = url.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ platform: platform.toLowerCase(), url });
  };
  const social = a.social ?? a["social-accounts"] ?? {};
  if (social && typeof social === "object") {
    for (const [platform, val] of Object.entries<any>(social)) {
      push(platform, typeof val === "string" ? val : val?.url);
    }
  }
  const th = a["twitter-handle"];
  if (typeof th === "string" && th.trim())
    push("twitter", `https://twitter.com/${th.replace(/^@/, "").trim()}`);
  return out;
}

/**
 * Author profile by URL slug. Quintype author URLs are `/author/{name}-{id}`
 * (trailing numeric id); we fetch `/api/v1/authors/{id}`. When the slug carries
 * no id (or the fetch fails) we degrade to a title-cased display name derived
 * from the slug so the ProfilePage schema still emits a valid Person.
 */
export async function getAuthorBySlug(
  slug: string,
): Promise<AuthorProfile | null> {
  if (!slug) return null;
  const idMatch = slug.match(/(\d+)$/);
  const fallbackName = decodeURIComponent(slug)
    .replace(/-?\d+$/, "")
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());

  if (idMatch) {
    const data = await fetchJson<{ author?: Record<string, any> }>(
      `${WWW}/api/v1/authors/${idMatch[1]}`,
      RELATED_REVALIDATE,
    );
    const a = data?.author;
    if (a) {
      const social = a["social-accounts"] ?? a.social ?? {};
      const sameAs = Object.values(social)
        .map((v) => (typeof v === "string" ? v : (v as any)?.url))
        .filter(
          (u): u is string => typeof u === "string" && /^https?:\/\//.test(u),
        );
      return {
        id: a.id,
        name: a.name || fallbackName,
        slug,
        bio: a.bio || undefined,
        avatarUrl: a["avatar-url"] || a["avatar-s3-key"] || undefined,
        sameAs,
      };
    }
  }

  if (!fallbackName) return null;
  return { id: slug, name: fallbackName, slug, sameAs: [] };
}

/** One entry in the authors index (`/api/v1/authors`). */
export interface AuthorListItem {
  id: number | string;
  slug: string;
  name: string;
  bio?: string;
  avatarUrl?: string;
}

/**
 * Paginated authors index. Powers the `/authors` listing page. The Quintype
 * `/api/v1/authors` endpoint returns `{ page: { total }, authors: [...] }`.
 * Authors without a usable slug are dropped (can't be linked). Empty on failure.
 */
export async function getAuthorsList(
  limit = 24,
  offset = 0,
): Promise<{ total: number; authors: AuthorListItem[] }> {
  const data = await fetchJson<{
    page?: { total?: number };
    authors?: Array<Record<string, any>>;
  }>(
    `${WWW}/api/v1/authors?limit=${limit}&offset=${offset}`,
    RELATED_REVALIDATE,
  );
  const authors = (data?.authors ?? [])
    .filter((a) => a && a.slug)
    .map((a) => ({
      id: a.id,
      slug: String(a.slug),
      name: a.name || String(a.slug),
      bio: a.bio || undefined,
      avatarUrl: a["avatar-url"] || a["avatar-s3-key"] || undefined,
    }));
  return { total: data?.page?.total ?? authors.length, authors };
}

/**
 * Full author profile by its (non-numeric) URL slug, e.g. `chaitanya-hegde`.
 * The Quintype endpoint `/api/v1/authors/{slug}` accepts the slug directly and
 * returns `{ author: {...} }`. Returns the profile including the numeric `id`
 * (needed to fetch the author's story collection), or `null` when unknown.
 */
export async function getAuthorProfileBySlug(
  slug: string,
): Promise<AuthorProfile | null> {
  if (!slug) return null;
  const data = await fetchJson<{ author?: Record<string, any> }>(
    `${WWW}/api/v1/authors/${encodeURIComponent(slug)}`,
    RELATED_REVALIDATE,
  );
  const a = data?.author;
  if (!a || a.id == null) return null;
  const social = authorSocialLinks(a);
  return {
    id: a.id,
    name: a.name || slug,
    slug,
    bio: a.bio || undefined,
    avatarUrl: a["avatar-url"] || a["avatar-s3-key"] || undefined,
    sameAs: social.map((s) => s.url),
    social,
  };
}

/**
 * A page of an author's published stories, newest first, from
 * `/api/v1/authors/{id}/collection`. Each collection item wraps the story under
 * `item.story`; we unwrap and normalise `published-at` (the collection carries
 * `last-published-at`) so listing cards render the time-ago. Empty on failure.
 */
export async function getAuthorStories(
  authorId: number | string,
  limit = 9,
  offset = 0,
): Promise<{ total: number; items: Story[] }> {
  const data = await fetchJson<{
    "total-count"?: number;
    items?: Array<{ type?: string; story?: Story }>;
  }>(
    `${WWW}/api/v1/authors/${authorId}/collection?offset=${offset}&limit=${limit}&sort=latest-published`,
    RELATED_REVALIDATE,
  );
  const items = (data?.items ?? [])
    .filter((it) => it?.type === "story" && it.story)
    .map((it) => {
      const s = it.story as Story;
      if (s["published-at"] == null && s["last-published-at"] != null)
        s["published-at"] = s["last-published-at"];
      return s;
    });
  return { total: data?.["total-count"] ?? items.length, items };
}

export interface BreakingNewsItem {
  headline: string;
  /** Story slug to link to (may be null for a non-linked flash item). */
  slug: string | null;
}

/**
 * Breaking-news ticker items — sourced from the editor-curated `our-pick`
 * Quintype collection. Each item links to its story's own slug. Cached for 60s
 * so refreshed picks surface quickly. Empty array on any failure.
 */
export async function getBreakingNews(limit = 15): Promise<BreakingNewsItem[]> {
  const data = await fetchJson<{
    items?: Array<{
      type?: string;
      story?: { headline?: string; slug?: string };
    }>;
  }>(`${WWW}/api/v1/collections/our-pick?limit=${limit}`, 60);
  return (data?.items ?? [])
    .filter((i) => i.type === "story" && !!i.story?.headline)
    .slice(0, limit)
    .map((i) => ({
      headline: i.story!.headline as string,
      slug: i.story?.slug || null,
    }));
}

/**
 * Coarse "x ago" relative time from an epoch-ms timestamp. Mirrors the
 * builder's `relativeTime` (fetch.ts) so cards render consistently.
 */
export function formatTimeAgo(ts?: number | string): string {
  const n = typeof ts === "string" ? Date.parse(ts) : ts;
  if (!n || Number.isNaN(n)) return "";
  const diff = Date.now() - n;
  if (diff < 0) return "just now";
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return formatArticleDate(n);
}

/** Absolute, human date used in the hero byline (e.g. "12 Aug 2026, 11:40 PM"). */
export function formatArticleDate(ts?: number | string): string {
  const n = typeof ts === "string" ? Date.parse(ts) : ts;
  if (!n || Number.isNaN(n)) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(n));
}

/** Plain-text meta description from the first text elements of the story. */
export function extractMetaDescription(story: Story, max = 160): string {
  const parts: string[] = [];
  for (const card of story?.cards ?? []) {
    for (const el of card?.["story-elements"] ?? []) {
      if (el?.type === "text" && typeof el.text === "string") {
        parts.push(el.text.replace(/<[^>]*>/g, " "));
      }
      if (parts.join(" ").length > max) break;
    }
  }
  const text =
    (story?.summary as string) ||
    (story?.subheadline as string) ||
    parts.join(" ");
  const plain = text.replace(/\s+/g, " ").trim();
  return plain.length > max ? plain.slice(0, max).trimEnd() + "…" : plain;
}

/** The section path (no host) used for breadcrumbs / "next article". */
export function sectionPath(story: Story): string {
  const url = story?.sections?.[0]?.["section-url"];
  if (typeof url === "string") {
    return url.replace(/^https?:\/\/[^/]+/, "").replace(/^\/+/, "");
  }
  return story?.sections?.[0]?.slug ?? "";
}
