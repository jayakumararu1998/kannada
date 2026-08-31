import "server-only";

import { cache } from "react";

import type { PageHeading } from "./types";

/**
 * Request-scoped holder for the page-level heading config, so a `PageMainHeading`
 * / `Breadcrumb` component placed ANYWHERE in the builder layout can render the
 * heading + breadcrumb at ITS position (instead of the fixed top-of-page slot).
 *
 * `React.cache` returns the same object per request render pass: `PageRenderer`
 * publishes the config once (before descending into the layout), and the deeply
 * nested `ComponentRenderer` reads it — no prop drilling through
 * Section/Row/Column renderers. `placedInLayout` lets PageRenderer skip the
 * default top heading when the layout carries its own PageMainHeading.
 */
export interface PageHeadingContext {
  heading?: PageHeading;
  section?: { name?: string; url?: string };
  /** True when the layout contains a PageMainHeading (suppress the top slot). */
  placedInLayout?: boolean;
}

export const getPageHeadingContext = cache(
  (): { current: PageHeadingContext } => ({ current: {} }),
);
