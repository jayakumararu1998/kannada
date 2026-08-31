import "server-only";

import { cache } from "react";
import type { ReactNode } from "react";

/**
 * Request-scoped holder for the numbered pager, so it renders INSIDE the
 * paginated column (right under its listing) instead of being appended after
 * the whole page — where a trailing row (e.g. a Taboola bottom-ad) would push
 * it below the ad, out of the content column.
 *
 * `resolveBuilderPage` publishes `{ pager, columnId }`; `ColumnRenderer` renders
 * the pager when `column.id === columnId` (idempotent — no mutation-during-render
 * flags, safe under React re-renders).
 */
export interface PaginationContext {
  pager?: ReactNode;
  columnId?: string;
}

export const getPaginationContext = cache(
  (): { current: PaginationContext } => ({ current: {} }),
);
