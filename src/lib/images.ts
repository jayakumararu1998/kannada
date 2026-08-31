import { MEDIA_BASE_URL } from "@/lib/constants";

export const DEFAULT_THUMBNAIL_IMAGE =
  "/images/astrology%20images/thumbnail1.png";

/** Blank person-silhouette avatar for authors with no profile picture. */
export const AUTHOR_AVATAR_PLACEHOLDER = "/images/avatar-placeholder.svg";

const MEDIA = MEDIA_BASE_URL.replace(/\/+$/, "");

/**
 * Resolve ANY image reference to a MEDIA_BASE_URL (media.kannadaprabha.com) URL.
 *  - data: URIs pass through
 *  - full/protocol-relative CDN URLs (gumlet/assettype/etc.) → host rewritten to
 *    MEDIA_BASE_URL, keeping the path (the publisher CDN serves the same keys)
 *  - local app assets (leading "/", e.g. /images/…) pass through
 *  - bare Quintype s3 keys → prefixed with MEDIA_BASE_URL
 */
export function toMediaUrl(src?: string | null): string | undefined {
  if (typeof src !== "string") return undefined;
  const s = src.trim();
  if (!s) return undefined;
  if (s.startsWith("data:")) return s;

  if (/^https?:\/\//i.test(s) || s.startsWith("//")) {
    try {
      // Keep the query string — it carries the CDN resize params
      // (mediaThumb's w/q) which must survive re-normalisation.
      const u = new URL(s.startsWith("//") ? `https:${s}` : s);
      return `${MEDIA}${u.pathname}${u.search}`;
    } catch {
      return s;
    }
  }

  // Local app asset served from /public.
  if (s.startsWith("/")) return s;

  // Bare s3 key.
  return `${MEDIA}/${s.replace(/^\/+/, "")}`;
}

/**
 * A resized/compressed variant of a media-CDN image. The publisher CDN
 * (Gumlet) resizes on the fly via query params — `?w=800&q=70` turns a
 * multi-hundred-KB original into a few tens of KB and auto-serves
 * AVIF/WebP per the Accept header. Only applies to MEDIA_BASE_URL images
 * (local /public assets and data: URIs pass through untouched).
 */
/**
 * Shared srcset/sizes for the article hero image. The <img> in ArticleHero and
 * the <link rel=preload> in the article renderers MUST use identical strings
 * or the browser preloads one variant and fetches another (double download).
 */
export const HERO_SIZES = "(max-width: 767px) 100vw, 800px";

export function heroSrcSet(src?: string | null): string | undefined {
  const url = toMediaUrl(src);
  if (!url || !url.startsWith(`${MEDIA}/`)) return undefined;
  return [480, 800, 1200]
    .map((w) => `${mediaThumb(url, w, 75)} ${w}w`)
    .join(", ");
}

export function mediaThumb(
  src?: string | null,
  width = 800,
  quality = 70,
): string | undefined {
  const url = toMediaUrl(src);
  if (!url || !url.startsWith(`${MEDIA}/`)) return url;
  if (/[?&]w=/.test(url)) return url; // already sized — don't double-apply
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}w=${width}&q=${quality}&auto=format,compress`;
}

/**
 * Responsive card thumbnails.
 *
 * Every card image is rendered `w-full` inside a grid cell, so its CSS width
 * ranges from ~137px (a small "more news" thumb on a phone) up to the full
 * 380px column — but a single `mediaThumb(key, 800, 70)` URL was being served
 * to all of them. PageSpeed measured ~600 KiB of wasted image bytes on the
 * home page alone from that mismatch, which is what pushes mobile LCP out.
 *
 * `cardSrcSet()` re-derives the SAME url at a ladder of widths (the media CDN
 * resizes on the fly from the `w=` param), so the browser can pick the variant
 * that matches the box it actually laid out. Pair it with `CARD_SIZES_AUTO`
 * (`sizes="auto"`, lazy images) or `CARD_SIZES` (eager/LCP images) — see
 * `components/ui/CardImage`.
 */
// Deliberately short. Every entry is ~110 characters that ships TWICE on a
// builder page — once in the HTML, once in the RSC flight payload — and the
// home page carries ~100 cards, so a seven-step ladder added 165 KB of raw
// markup (only ~1 KB gzipped, but all of it still has to be parsed) and cost
// more in FCP than it saved in image bytes. Four steps cover every card size
// the mobile layout actually produces: ~230 px thumbs, ~490 px half-columns
// and ~665 px full-width cards.
const CARD_WIDTHS = [240, 400, 640, 800] as const;

/** Widest candidate: what non-`sizes=auto` browsers fall back to. */
export const CARD_SIZES = "(max-width: 767px) 100vw, 400px";

/**
 * Swap the `w=` of an already-sized media URL, keeping every other param
 * (`q`, `auto=format,compress`) intact. Returns undefined for anything that
 * isn't a resizable media-CDN url (local /public assets, data: URIs).
 */
function withWidth(url: string, width: number): string | undefined {
  if (!url.startsWith(`${MEDIA}/`)) return undefined;
  if (!/[?&]w=\d+/.test(url)) return undefined;
  return url.replace(/([?&]w=)\d+/, `$1${width}`);
}

/**
 * A `srcset` for a card thumbnail whose `src` already carries `?w=…`.
 * Returns undefined when the source can't be resized, so the caller just
 * renders a plain `src`.
 */
export function cardSrcSet(src?: string | null): string | undefined {
  if (typeof src !== "string" || !src) return undefined;
  const url = toMediaUrl(src);
  if (!url) return undefined;
  const entries: string[] = [];
  for (const w of CARD_WIDTHS) {
    const variant = withWidth(url, w);
    if (variant) entries.push(`${variant} ${w}w`);
  }
  return entries.length > 1 ? entries.join(", ") : undefined;
}
