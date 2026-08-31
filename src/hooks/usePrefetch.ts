"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Hover-based prefetch (ported from dinamani-website).
 *
 * A news page shows 50+ article links at once, so Next's default viewport
 * prefetch would fire an `_rsc` request for every visible card and flood the
 * origin. Instead we disable the built-in prefetch (see the Link wrapper) and
 * warm the router cache only for the link the user is actually pointing at,
 * after a short debounce.
 */
const prefetchCache = new Map<
  string,
  { timestamp: number; status: "pending" | "done" | "error" }
>();
const PREFETCH_CACHE_TTL = 60_000; // 1 minute
const MAX_PREFETCH_ENTRIES = 200;

export function usePrefetch() {
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const prefetch = useCallback(
    (href: string) => {
      // Skip external links, hash links, and the current page.
      if (
        !href ||
        href.startsWith("http") ||
        href.startsWith("#") ||
        (typeof window !== "undefined" && href === window.location.pathname)
      ) {
        return;
      }

      const normalizedHref = href.startsWith("/") ? href : `/${href}`;

      const cached = prefetchCache.get(normalizedHref);
      if (cached) {
        const age = Date.now() - cached.timestamp;
        if (age < PREFETCH_CACHE_TTL && cached.status !== "error") return;
      }

      if (prefetchCache.size >= MAX_PREFETCH_ENTRIES) prefetchCache.clear();

      prefetchCache.set(normalizedHref, {
        timestamp: Date.now(),
        status: "pending",
      });

      try {
        router.prefetch(normalizedHref);
        prefetchCache.set(normalizedHref, {
          timestamp: Date.now(),
          status: "done",
        });
      } catch {
        prefetchCache.set(normalizedHref, {
          timestamp: Date.now(),
          status: "error",
        });
      }
    },
    [router],
  );

  // Wait 100ms before prefetching so a cursor sweeping across many cards doesn't
  // trigger a prefetch for every card it passes over.
  const prefetchDebounced = useCallback(
    (href: string) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => prefetch(href), 100);
    },
    [prefetch],
  );

  const cancelPrefetch = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return { prefetch, prefetchDebounced, cancelPrefetch };
}
