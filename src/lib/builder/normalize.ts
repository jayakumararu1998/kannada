/**
 * Normalise a raw builder page into the canonical PageJSON the renderer expects.
 * The builder wraps content under `layout_json` (draft) or `published_json`, and
 * may double-wrap under `page`. We unwrap to the object that actually holds
 * `sections` (or `html`), preserving id/slug from the outer envelope.
 */

import type { PageJSON } from "./types";

export function normalizePageShape(raw: unknown): PageJSON | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;

  const candidates = [
    d.layout_json,
    d.published_json,
    (d.page as Record<string, unknown> | undefined)?.published_json,
    (d.page as Record<string, unknown> | undefined)?.layout_json,
    d.page,
    d,
  ];

  for (const c of candidates) {
    if (!c || typeof c !== "object") continue;
    const inner = c as Record<string, unknown>;
    if (Array.isArray(inner.sections) || typeof inner.html === "string") {
      return {
        ...(inner as unknown as PageJSON),
        page_id: (inner.page_id ?? d.page_id ?? d.id ?? "") as string,
        slug: (inner.slug ?? d.slug ?? "") as string,
        title: (inner.title ?? d.title ?? "") as string,
      };
    }
  }
  return null;
}
