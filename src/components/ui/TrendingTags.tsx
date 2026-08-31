"use client";

import { useEffect, useState } from "react";

import Link from "@/components/ui/PrefetchLink";

/** One trending tag as returned by Quintype's `/api/v1/trending/tags`. */
interface TrendingTag {
  name: string;
  slug: string;
}

interface TrendingTagsProps {
  /** How many chips to show (also the API `limit`). */
  limit?: number;
  /** Trending window passed to the API. */
  period?: "day" | "week" | "month";
  /**
   * Chip destination:
   *  - "topic"  → the tag's topic page `/topic/{slug}` (default)
   *  - "search" → the search results page `/search/{name}` (search-box context)
   */
  destination?: "topic" | "search";
  /** Called after a chip is clicked (e.g. to close the search panel). */
  onNavigate?: () => void;
  className?: string;
}

/** Small upward-trend glyph (inline SVG — no icon dependency, matches header). */
function TrendIcon() {
  return (
    <svg
      className="h-3 w-3 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 17L9 11L13 15L21 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 7H21V13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Trending-topic chips shown near the header search box (ported from dinamani's
 * `ChipsFormIcon` + `/api/trending-tags`). Fetches the current trending tags
 * client-side from the same-origin proxy route and links each to its Quintype
 * topic page (`/topic/{slug}`). Renders nothing until tags load / if empty, so
 * it never shows a stale hardcoded list.
 */
export default function TrendingTags({
  limit = 8,
  period = "day",
  destination = "topic",
  onNavigate,
  className,
}: TrendingTagsProps) {
  const [tags, setTags] = useState<TrendingTag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(
          `/api/trending-tags?period=${period}&limit=${limit}`,
          { signal: controller.signal },
        );
        const data = await res.json();
        const next: TrendingTag[] = (data?.tags ?? [])
          .filter((t: TrendingTag) => t?.name && t?.slug)
          .slice(0, limit);
        if (active) setTags(next);
      } catch {
        // Swallow — a failed fetch just renders nothing (no chips section).
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [limit, period]);

  if (loading) {
    return (
      <div className={className}>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-7 w-20 animate-pulse rounded-full bg-DFDFDF"
            />
          ))}
        </div>
      </div>
    );
  }

  if (tags.length === 0) return null;

  return (
    <div className={className}>
      <p className="mb-2 font-manrope text-[12px] font-semibold uppercase tracking-wide text-8B95A5">
        Trending
      </p>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Link
            key={tag.slug}
            href={
              destination === "search"
                ? `/search/${encodeURIComponent(tag.name)}`
                : `/topic/${encodeURIComponent(tag.slug)}`
            }
            onClick={onNavigate}
            className="inline-flex items-center gap-1.5 rounded-full border border-D2D2D2 bg-FFFFFF px-3 py-1.5 font-manrope text-[13px] font-medium text-333333 transition-colors hover:border-009EF9 hover:text-009EF9"
          >
            <TrendIcon />
            <span className="whitespace-nowrap">{tag.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
