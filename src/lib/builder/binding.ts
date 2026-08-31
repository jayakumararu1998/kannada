import "server-only";

/**
 * Page ↔ URL binding (dinamani's pageApiBindings). A template page declares
 * `pageApiBindings`; columns reference one via `pageApiBindingId`. Given the URL
 * params, we:
 *   1. resolve each binding's endpoint with the slug (path or query),
 *   2. inject a `data_binding` into every column that references it,
 *   3. (after fetch) expose the bound data for the page heading.
 *
 * Injection produces a NEW page object (the store's copy is never mutated).
 */

import { COLLECTIONS_BASE } from "./config";
import type {
  Column,
  CollectionsData,
  DataBinding,
  PageApiBinding,
  PageJSON,
  Row,
  TransformedItem,
} from "./types";
import { resolveEndpoint } from "./fetch";

/** The slug a binding should use from the URL params. */
function slugForBinding(
  binding: PageApiBinding,
  params: Record<string, string> | null,
): string | null {
  if (!params) return null;
  if (binding.slug_param && params[binding.slug_param]) {
    return params[binding.slug_param];
  }
  const values = Object.values(params);
  return values.length ? values[values.length - 1] : null;
}

/** Resolve a binding + slug into a concrete data_binding endpoint. */
export function resolveBindingDataBinding(
  binding: PageApiBinding,
  slug: string,
): DataBinding | null {
  let url = binding.api_endpoint;

  if (url && /\{slug\}|\{param\}/.test(url)) {
    url = url.replace(/\{slug\}|\{param\}/g, encodeURIComponent(slug));
  } else if (url) {
    if (binding.slug_position === "query") {
      const p = binding.query_param || binding.slug_param || "slug";
      url += (url.includes("?") ? "&" : "?") + `${p}=${encodeURIComponent(slug)}`;
    } else {
      url = url.replace(/\/+$/, "") + "/" + encodeURIComponent(slug);
    }
  } else {
    // No endpoint given → treat the slug (or collection_id) as a collection.
    const col = binding.collection_id || slug;
    url = `${COLLECTIONS_BASE}/api/v1/collections/${encodeURIComponent(col)}`;
  }

  return { api_endpoint: url, limit: binding.limit, responsePath: binding.responsePath };
}

/**
 * Inject resolved data_bindings into all columns referencing a page binding,
 * and replace {slug}/{param} tokens in the page heading text. Returns a clone.
 */
export function bindPageToUrl(
  page: PageJSON,
  params: Record<string, string> | null,
): PageJSON {
  const bindings = (page.pageApiBindings ?? []).filter((b) => b.enabled !== false);
  if (!bindings.length) return page;

  const byId = new Map(bindings.map((b) => [b.id, b]));
  const clone: PageJSON = structuredClone(page);

  const applyColumn = (col: Column) => {
    if (col.pageApiBindingId && !col.data_binding) {
      const binding = byId.get(col.pageApiBindingId);
      const slug = binding ? slugForBinding(binding, params) : null;
      if (binding && slug) {
        const db = resolveBindingDataBinding(binding, slug);
        if (db) col.data_binding = db;
      }
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

  // Token replacement in the heading (e.g. "{slug} news").
  if (clone.pageHeading?.text && params) {
    clone.pageHeading.text = clone.pageHeading.text.replace(
      /\{(\w+)\}/g,
      (_m, key) => params[key] ?? "",
    );
  }

  return clone;
}

/** binding id → representative fetched item (for heading/breadcrumb sourcing). */
export function buildPageBindingsData(
  page: PageJSON,
  collectionsData: CollectionsData,
  params: Record<string, string> | null,
): Map<string, TransformedItem> {
  const out = new Map<string, TransformedItem>();
  for (const binding of page.pageApiBindings ?? []) {
    if (binding.enabled === false) continue;
    const slug = slugForBinding(binding, params);
    if (!slug) continue;
    const db = resolveBindingDataBinding(binding, slug);
    const url = resolveEndpoint(db ?? undefined);
    if (!url) continue;
    const items = collectionsData.get(url);
    if (items && items.length) out.set(binding.id, items[0]);
  }
  return out;
}

/**
 * Resolve a dynamic page heading from bound data. Mutates the (already cloned)
 * page's heading text in place. Falls back to the URL slug.
 */
export function applyDynamicHeading(
  page: PageJSON,
  params: Record<string, string> | null,
  bindingsData: Map<string, TransformedItem>,
): void {
  const h = page.pageHeading;
  if (!h?.enabled || h.sourceType !== "dynamic") return;

  const item = h.bindingId ? bindingsData.get(h.bindingId) : undefined;
  const field = h.field;
  const fromItem =
    (field && (item?.[field] as string)) ||
    item?.category ||
    item?.title ||
    undefined;

  const fallback = params ? Object.values(params).slice(-1)[0] : undefined;
  h.text = (fromItem || h.text || fallback || "").toString();
}
