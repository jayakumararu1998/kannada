import "server-only";

/**
 * Section binding (dinamani's sectionBindings). A section/category TEMPLATE page
 * declares one `sectionBindings` entry; columns (and column headings) reference
 * it via `sectionBindingId`. Given the request URL we:
 *   1. match the URL path to a stored SectionConfig (section_url → collection),
 *   2. inject that collection as the `data_binding` of every column/heading that
 *      references the enabled binding.
 *
 * This is what lets ONE template render every section URL (/karnataka, /sports,
 * /videos/health, …) with the correct collection data. Injection clones the page
 * — the store's copy is never mutated.
 */

import { resolveSectionCollection } from "./registry";
import { getStore } from "./store";
import type {
  Column,
  PageComponent,
  PageJSON,
  Row,
  SectionConfig,
} from "./types";

export interface ResolvedSectionBinding {
  bindingId: string;
  apiEndpoint: string;
  section: SectionConfig;
}

/** Match a URL path to the page's (first enabled) section binding + collection. */
export function resolveSectionBinding(
  page: PageJSON,
  urlPath: string,
): ResolvedSectionBinding | null {
  const bindings = (page.sectionBindings ?? []).filter((b) => b.enabled !== false);
  if (!bindings.length) return null;

  const binding = bindings[0];
  const section = getStore().getSectionByUrlPath(urlPath);
  if (!section?.collection_url) return null;

  return { bindingId: binding.id, apiEndpoint: section.collection_url, section };
}

/**
 * Inject the resolved collection endpoint into every column / column-heading that
 * references `bindingId`. Returns a clone (never mutates the stored page).
 */
export function injectSectionDataBinding(
  page: PageJSON,
  bindingId: string,
  apiEndpoint: string,
): PageJSON {
  const collectionId = apiEndpoint.split("/").pop() || undefined;
  const clone: PageJSON = structuredClone(page);

  // Only a non-empty id may match — so a blank/absent sectionBindingId on a
  // column never accidentally binds it. A column binds ONLY when it explicitly
  // carries this exact binding id; every other column is left untouched.
  const matches = (id?: string) => !!bindingId && id === bindingId;

  const applyColumn = (col: Column) => {
    if (matches(col.sectionBindingId) && !col.data_binding) {
      col.data_binding = { collection_id: collectionId, api_endpoint: apiEndpoint };
    }
    if (col.heading && matches(col.heading.sectionBindingId)) {
      col.heading.apiEndpoint = apiEndpoint;
      col.heading.collectionId = collectionId;
    }
    col.columns?.forEach(applyColumn);
    col.rows?.forEach(applyRow);
    col.tabBar?.tabs?.forEach((t) => t.rows?.forEach(applyRow));
    col.slider?.rows?.forEach(applyRow);
  };
  const applyRow = (row: Row) => row.columns?.forEach(applyColumn);

  for (const section of clone.sections ?? []) {
    for (const row of section.rows ?? []) applyRow(row);
  }
  return clone;
}

/** True for an include-section component (widget_type or component_type). */
function isIncludeSection(c: PageComponent): boolean {
  return (
    c.widget_type === "include-section" ||
    c.component_type === "IncludeSection" ||
    c.component_type === "include-section"
  );
}

/** Does the page have any include-section column that needs a default binding? */
function needsIncludeBinding(page: PageJSON): boolean {
  let needs = false;
  const col = (c: Column) => {
    if (
      !c.data_binding &&
      c.components?.some((k) => isIncludeSection(k) && resolveSectionCollection(k.slug))
    ) {
      needs = true;
    }
    c.columns?.forEach(col);
    c.rows?.forEach((r) => r.columns.forEach(col));
  };
  page.sections?.forEach((s) => s.rows?.forEach((r) => r.columns.forEach(col)));
  return needs;
}

/**
 * Some include-sections (e.g. the homepage "trendingsection" widget) ship no
 * data_binding. Give their column a default collection endpoint (from
 * SECTION_DEFAULT_COLLECTION) so the section has data to render.
 */
export function bindIncludeSections(page: PageJSON): PageJSON {
  if (!needsIncludeBinding(page)) return page;
  const clone = structuredClone(page);
  const applyCol = (c: Column) => {
    if (!c.data_binding && c.components?.length) {
      const inc = c.components.find(isIncludeSection);
      const url = inc ? resolveSectionCollection(inc.slug) : null;
      // Trending strip is a horizontal-scroll row — fetch enough to scroll.
      if (url) c.data_binding = { api_endpoint: url, limit: 12 };
    }
    c.columns?.forEach(applyCol);
    c.rows?.forEach((r) => r.columns.forEach(applyCol));
  };
  clone.sections?.forEach((s) => s.rows?.forEach((r) => r.columns.forEach(applyCol)));
  return clone;
}

/** Convenience: resolve + inject in one call. Returns the (possibly cloned) page. */
export function bindSectionToUrl(page: PageJSON, urlPath: string): PageJSON {
  const resolved = resolveSectionBinding(page, urlPath);
  if (!resolved) return page;
  return injectSectionDataBinding(page, resolved.bindingId, resolved.apiEndpoint);
}
