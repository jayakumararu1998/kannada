import "server-only";

/**
 * Column pagination helpers. A column with `pagination.enabled` paginates its
 * bound collection: we inject an `offset` into that column's data_binding for the
 * current page, and expose the endpoint + pageSize so the page can render a
 * numbered pager from the collection's total-count.
 */

import { resolveEndpoint } from "./fetch";
import {
  getBuilderRequestContext,
  normalizePathname,
} from "./request-context";
import type { Column, PageJSON, Row } from "./types";

export const DEFAULT_PAGE_SIZE = 20;

/** Page size for a paginated column. Falls back to the binding's own `limit`
 *  (the builder often enables pagination without a pageSize but sets the
 *  collection limit — that limit IS the intended page size). */
function pageSizeOf(col: Column): number {
  return (
    col.pagination?.pageSize || col.data_binding?.limit || DEFAULT_PAGE_SIZE
  );
}

/**
 * Rows of the ACTIVE tab of a column's TabBar (same selection as renderTabBar:
 * the tab whose sectionUrl matches the current URL, else the configured
 * default, else the first visible tab). Only the active tab's panel is in the
 * DOM, so only its column may paginate — offsetting a hidden tab's binding
 * would corrupt its panel and render the pager somewhere invisible.
 */
function activeTabRows(col: Column): Row[] | undefined {
  const bar = col.tabBar;
  if (bar?.hidden || !bar?.tabs?.length) return undefined;
  const tabs = bar.tabs.filter((t) => !t.hidden);
  if (!tabs.length) return undefined;
  const currentPath = normalizePathname(
    getBuilderRequestContext().current.pathname,
  );
  const active =
    tabs.find(
      (t) =>
        t.sectionUrlEnabled &&
        t.sectionUrl &&
        normalizePathname(t.sectionUrl) === currentPath,
    ) ??
    tabs.find((t) => t.id === bar.defaultActiveTab) ??
    tabs[0];
  return active.rows;
}

/** Hard cap on how many pages the pager exposes. A large collection can imply
 *  thousands of pages; we only ever offer up to this many (page 1 … 500). This
 *  also aligns with typical API offset limits (500 × 20 = 10 000 items). */
export const MAX_PAGE_COUNT = 500;

export interface PaginationInfo {
  /** Resolved collection endpoint the pager is for. */
  endpoint: string;
  pageSize: number;
  /** Id of the paginated column, so the pager renders INSIDE it (not appended
   *  after the whole page, which would drop it below trailing rows like ads). */
  columnId?: string;
}

/** Find the first column with pagination enabled that has a resolvable endpoint. */
export function findPagination(page: PageJSON): PaginationInfo | null {
  let found: PaginationInfo | null = null;
  const visitCol = (col: Column) => {
    if (found) return;
    if (col.pagination?.enabled) {
      const endpoint = resolveEndpoint(col.data_binding);
      if (endpoint) {
        found = {
          endpoint,
          pageSize: pageSizeOf(col),
          columnId: col.id,
        };
        return;
      }
    }
    col.columns?.forEach(visitCol);
    col.rows?.forEach(visitRow);
    activeTabRows(col)?.forEach(visitRow);
  };
  const visitRow = (row: Row) => row.columns.forEach(visitCol);
  for (const section of page.sections ?? []) {
    for (const row of section.rows ?? []) visitRow(row);
  }
  return found;
}

/**
 * Inject offset/limit into every paginated column's data_binding for `currentPage`.
 * Returns a clone when anything is paginated (otherwise the original page).
 */
export function applyPagination(page: PageJSON, currentPage: number): PageJSON {
  if (!findPagination(page)) return page;
  const clone: PageJSON = structuredClone(page);
  const applyCol = (col: Column) => {
    if (col.pagination?.enabled && col.data_binding) {
      const size = pageSizeOf(col);
      col.data_binding = {
        ...col.data_binding,
        limit: size,
        offset: Math.max(0, (currentPage - 1) * size),
      };
    }
    col.columns?.forEach(applyCol);
    col.rows?.forEach((r) => r.columns.forEach(applyCol));
    activeTabRows(col)?.forEach((r) => r.columns.forEach(applyCol));
  };
  clone.sections?.forEach((s) => s.rows?.forEach((r) => r.columns.forEach(applyCol)));
  return clone;
}

/**
 * Windowed page list with ellipses, e.g. [1,2,3,"...",67,68]. `compact` keeps
 * only first/last and the current-page window (≤7 entries) so the pager fits a
 * phone viewport on one line.
 */
export function buildPageList(
  current: number,
  total: number,
  compact = false,
): Array<number | "..."> {
  if (total <= (compact ? 5 : 7))
    return Array.from({ length: total }, (_, i) => i + 1);
  const keep = new Set(
    compact
      ? [1, total, current - 1, current, current + 1]
      : [1, 2, 3, total - 1, total, current - 1, current, current + 1],
  );
  const sorted = [...keep].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: Array<number | "..."> = [];
  let prev = 0;
  for (const n of sorted) {
    if (n - prev > 1) out.push("...");
    out.push(n);
    prev = n;
  }
  return out;
}
