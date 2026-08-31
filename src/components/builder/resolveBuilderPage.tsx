import type { ReactNode } from "react";

import {
  applyDynamicHeading,
  bindPageToUrl,
  buildPageBindingsData,
} from "@/lib/builder/binding";
import { fetchAllPageData } from "@/lib/builder/fetch";
import {
  applyPagination,
  findPagination,
  MAX_PAGE_COUNT,
} from "@/lib/builder/pagination";
import { getPaginationContext } from "@/lib/builder/pagination-context";
import {
  getBuilderRequestContext,
  normalizePathname,
} from "@/lib/builder/request-context";
import { resolveRoute } from "@/lib/builder/route-resolver";
import {
  bindIncludeSections,
  bindSectionToUrl,
  resolveSectionBinding,
} from "@/lib/builder/section-binding";

import BuilderPagination from "./BuilderPagination";
import HtmlPage from "./HtmlPage";
import PageRenderer from "./PageRenderer";

export interface BuilderRender {
  content: ReactNode;
  hideLayout: boolean;
}

/**
 * Resolve a URL to a builder page, bind the URL slug into its pageApiBindings,
 * fetch all data (including bound + column data_bindings), and return the
 * rendered content. Shared by the catch-all route and the home page. Returns
 * null when no route/page matches. `currentPage` drives column pagination.
 */
export async function resolveBuilderPage(
  urlSlug: string,
  currentPage = 1,
): Promise<BuilderRender | null> {
  const resolved = resolveRoute(urlSlug);
  if (!resolved) return null;

  // Publish the current path so nested components (e.g. TabBar) can mark the
  // element whose `sectionUrl` matches the URL as active.
  getBuilderRequestContext().current.pathname = normalizePathname(urlSlug);

  const { hideLayout, params } = resolved;
  let page = resolved.page;

  // Static / raw-HTML page.
  if (typeof page.html === "string" && page.html.length > 0) {
    return { content: <HtmlPage html={page.html} css={page.css} />, hideLayout };
  }

  // Inject the URL slug into page API bindings (dynamic templates).
  if (page.pageApiBindings?.length) {
    page = bindPageToUrl(page, params);
  }

  // Section/category templates: match the URL to a stored section → collection
  // and inject it into the columns that reference the page's sectionBinding.
  // Also capture the matched section (name + url) so a `section_bind` page
  // heading / breadcrumb can label itself with the current section.
  let sectionInfo: { name?: string; url?: string } | undefined;
  if (page.sectionBindings?.length) {
    const matched = resolveSectionBinding(page, urlSlug);
    // The generic section template (matched via a `/{slug}` route) also captures
    // URLs that are NOT real sections — static / custom-URL pages (/about-us,
    // /t20worldcup, …) or articles. Rather than render an empty section, bail so
    // the catch-all falls through to the article / static-page handling.
    if (!matched && urlSlug !== "/") return null;
    if (matched) {
      sectionInfo = {
        name: matched.section.section_name || matched.section.collection_name,
        url: "/" + String(matched.section.section_url ?? "").replace(/^\/+/, ""),
      };
    }
    page = bindSectionToUrl(page, urlSlug);
  }

  // Include-sections without their own binding (e.g. homepage "trendingsection")
  // get a default collection injected onto their column so they have data.
  page = bindIncludeSections(page);

  // Numbered pagination: offset the paginated column's collection for this page.
  const pageInfo = findPagination(page);
  if (pageInfo) page = applyPagination(page, currentPage);

  const { data: collectionsData, totals } = await fetchAllPageData(page);

  if (page.pageApiBindings?.length) {
    const bindingsData = buildPageBindingsData(page, collectionsData, params);
    applyDynamicHeading(page, params, bindingsData);
  }

  // Build the pager from the paginated collection's total-count. The totals map
  // is keyed by the fetched URL, which bakes in the offset — so reconstruct the
  // same offset key (base?offset=N) rather than the bare endpoint.
  let pager: ReactNode = null;
  if (pageInfo) {
    // Re-resolve on the APPLIED page: its binding carries the injected
    // limit/offset, so its endpoint is exactly the key fetchAllPageData used.
    const appliedKey = findPagination(page)?.endpoint ?? pageInfo.endpoint;
    const total = totals.get(appliedKey) ?? totals.get(pageInfo.endpoint) ?? 0;
    // Cap the pager at MAX_PAGE_COUNT (500) — a big collection can imply
    // thousands of pages, so we only ever offer page 1 … 500.
    const totalPages = Math.min(
      MAX_PAGE_COUNT,
      Math.max(1, Math.ceil(total / pageInfo.pageSize)),
    );
    const basePath = urlSlug.startsWith("/") ? urlSlug : `/${urlSlug}`;
    pager = (
      <BuilderPagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath={basePath === "//" ? "/" : basePath}
      />
    );
  }

  // Publish the pager so it renders INSIDE its paginated column (under the
  // listing), not appended after the whole page — otherwise a trailing row
  // like a Taboola bottom-ad pushes it below the ad. Fall back to a page-level
  // append only when we couldn't identify the column.
  const columnId = pageInfo?.columnId;
  getPaginationContext().current = { pager, columnId };
  const pageLevelPager = columnId ? null : pager;

  return {
    content: (
      <>
        <PageRenderer page={page} collectionsData={collectionsData} section={sectionInfo} />
        {pageLevelPager}
      </>
    ),
    hideLayout,
  };
}
