import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";

import { validateApiKey } from "@/lib/builder/api-key";
import { normalizePageShape } from "@/lib/builder/normalize";
import { getStore } from "@/lib/builder/store";
import type { PageJSON } from "@/lib/builder/types";

import { json, preflight, unauthorized } from "../_shared";

export const dynamic = "force-dynamic";

function isValidPage(p: unknown): p is PageJSON {
  if (!p || typeof p !== "object") return false;
  const page = p as Record<string, unknown>;
  return page.sections === undefined || Array.isArray(page.sections);
}

export async function OPTIONS() {
  return preflight();
}

/** List all stored pages. */
export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorized(request);
  const store = getStore();
  const pages = store.getAllPages();
  return json({ success: true, count: Object.keys(pages).length, pages });
}

/** Push pages: { pages: { [pageId]: PageJSON }, clearExisting?: boolean }. */
export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorized(request);

  let body: { pages?: Record<string, unknown>; clearExisting?: boolean };
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: "Invalid JSON body" }, 400);
  }

  const incoming = body.pages ?? {};
  const valid: Record<string, PageJSON> = {};
  for (const [id, page] of Object.entries(incoming)) {
    // Unwrap builder shape (layout_json/published_json) → canonical PageJSON.
    const norm = normalizePageShape(page) ?? (isValidPage(page) ? (page as PageJSON) : null);
    if (norm) valid[id] = { ...norm, page_id: id };
  }

  const store = getStore();
  store.beginSync();
  if (body.clearExisting) store.clearPages();
  for (const [id, page] of Object.entries(valid)) store.upsertPage(id, page);
  const persist = store.persist();
  store.endSync();

  revalidatePath("/", "layout");
  return json({
    success: true,
    count: Object.keys(valid).length,
    persist,
    store: store.stats(),
  });
}
