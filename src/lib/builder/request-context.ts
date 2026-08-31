import "server-only";

import { cache } from "react";

/**
 * Request-scoped holder for the current builder page path, so deeply nested
 * server components (e.g. a TabBar that marks the tab whose `sectionUrl` matches
 * the current URL active) can read it without prop-drilling. Published once by
 * `resolveBuilderPage`. Same `React.cache` pattern as the heading/pagination
 * contexts.
 */
export interface BuilderRequestContext {
  pathname?: string;
}

export const getBuilderRequestContext = cache(
  (): { current: BuilderRequestContext } => ({ current: {} }),
);

/** Normalise a path for comparison: ensure a leading slash, drop trailing. */
export function normalizePathname(path: string | undefined | null): string {
  if (!path) return "/";
  let p = String(path).trim();
  // Strip origin if an absolute URL slipped in.
  p = p.replace(/^https?:\/\/[^/]+/i, "");
  if (!p.startsWith("/")) p = `/${p}`;
  return p.length > 1 ? p.replace(/\/+$/, "") : "/";
}
