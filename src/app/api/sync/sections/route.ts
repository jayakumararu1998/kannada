import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";

import { validateApiKey } from "@/lib/builder/api-key";
import { getStore } from "@/lib/builder/store";
import type { SectionConfig } from "@/lib/builder/types";

import { json, preflight, unauthorized } from "../_shared";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return preflight();
}

/** List all stored section → collection mappings. */
export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorized(request);
  const sections = getStore().getAllSections();
  return json({
    success: true,
    count: Object.keys(sections).length,
    sections,
  });
}

/**
 * Push section → collection mappings. Accepts either:
 *   { sections: SectionConfig[], clearExisting?: boolean }         (keyed by section_url)
 *   { sections: { [section_url]: SectionConfig }, clearExisting? }
 */
export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorized(request);

  let body: {
    sections?: Record<string, SectionConfig> | SectionConfig[];
    clearExisting?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: "Invalid JSON body" }, 400);
  }

  const entries: Array<[string, SectionConfig]> = [];
  const incoming = body.sections ?? {};
  if (Array.isArray(incoming)) {
    for (const section of incoming) {
      const key = section.section_url;
      if (key) entries.push([key, section]);
    }
  } else {
    for (const [key, section] of Object.entries(incoming)) {
      entries.push([key, section]);
    }
  }

  const store = getStore();
  store.beginSync();
  if (body.clearExisting) store.clearSections();
  for (const [key, section] of entries) store.upsertSection(key, section);
  const persist = store.persist();
  store.endSync();

  revalidatePath("/", "layout");
  return json({
    success: true,
    count: entries.length,
    persist,
    store: store.stats(),
  });
}
