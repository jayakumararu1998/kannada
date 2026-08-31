import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";

import { validateApiKey } from "@/lib/builder/api-key";
import { getStore } from "@/lib/builder/store";
import type { ArticleTemplateConfig } from "@/lib/builder/types";

import { json, preflight, unauthorized } from "../_shared";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return preflight();
}

/** List all stored article templates (keyed by story-template). */
export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorized(request);
  const articleTemplates = getStore().getAllArticleTemplates();
  return json({
    success: true,
    count: Object.keys(articleTemplates).length,
    articleTemplates,
  });
}

/** Pull the `templateType` (store key) out of a loosely-shaped push item. */
function keyOf(tpl: Record<string, unknown>): string {
  return String(
    tpl.templateType ??
      tpl["template-type"] ??
      tpl.type ??
      tpl.storyTemplate ??
      tpl["story-template"] ??
      tpl.slug ??
      tpl.id ??
      "",
  );
}

/**
 * Push article templates. Tolerant of the builder's shapes so a valid push
 * never 400s on formatting:
 *   { articleTemplates: { [type]: tpl } }
 *   { articleTemplates: [tpl, ...] }            (keyed by templateType/type/id)
 *   { templates: ... } | { data: ... }          (aliases)
 *   { templateType, ... }                       (a single bare template)
 * Optional `clearExisting: true` replaces the whole set.
 */
export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorized(request);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ success: false, error: "Invalid JSON body" }, 400);
  }

  const incoming =
    body.articleTemplates ??
    body.templates ??
    body.data ??
    // A single bare template posted at the top level.
    (keyOf(body) ? body : undefined);

  const entries: Array<[string, ArticleTemplateConfig]> = [];
  if (Array.isArray(incoming)) {
    for (const tpl of incoming) {
      const key = keyOf(tpl as Record<string, unknown>);
      if (key) entries.push([key, tpl as ArticleTemplateConfig]);
    }
  } else if (incoming && typeof incoming === "object") {
    // Record keyed by type — but tolerate a single template object too.
    const rec = incoming as Record<string, unknown>;
    const selfKey = keyOf(rec);
    const looksLikeTemplate =
      selfKey && (rec.heroFields || rec.pageJson || rec.sections);
    if (looksLikeTemplate && !Array.isArray(rec)) {
      entries.push([selfKey, rec as ArticleTemplateConfig]);
    } else {
      for (const [k, tpl] of Object.entries(rec)) {
        if (!tpl || typeof tpl !== "object") continue;
        const key = keyOf(tpl as Record<string, unknown>) || k;
        entries.push([key, tpl as ArticleTemplateConfig]);
      }
    }
  }

  if (entries.length === 0) {
    return json(
      {
        success: false,
        error:
          "No article templates found. Send { articleTemplates: [...] | { [type]: tpl } } or a single template with a templateType.",
      },
      400,
    );
  }

  const store = getStore();
  store.beginSync();
  if (body.clearExisting) store.clearArticleTemplates();
  for (const [key, tpl] of entries) store.upsertArticleTemplate(key, tpl);
  const persist = store.persist();
  store.endSync();

  revalidatePath("/", "layout");
  return json({
    success: true,
    count: entries.length,
    types: entries.map(([k]) => k),
    persist,
    store: store.stats(),
  });
}
