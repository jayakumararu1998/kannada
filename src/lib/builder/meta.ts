import "server-only";

/**
 * SEO metadata resolution. Combines two concepts:
 *
 *   - Page meta   (`page.pageMeta`): per-page SEO. `meta_source: "dynamic"` uses
 *                 the inline seo_* fields; `"master"` inherits from a SectionMeta.
 *   - Section meta (store `sectionMetas`): reusable "master" SEO records, either
 *                 referenced by `master_meta_owner_id` or matched by URL slug.
 *
 * Resolution order (first hit wins per field, then site defaults):
 *   1. master SectionMeta referenced by pageMeta.master_meta_owner_id
 *   2. inline pageMeta.seo_* fields
 *   3. SectionMeta matched by the page URL slug
 *   4. page.title / siteConfig defaults
 */

import { siteConfig } from "@/config/site";

import { getStore } from "./store";
import type { PageJSON, SectionMeta } from "./types";

export interface ResolvedMeta {
  title: string;
  description: string;
  keywords?: string;
}

function fromSectionMeta(meta: SectionMeta | null): Partial<ResolvedMeta> {
  if (!meta) return {};
  return {
    title: meta.pageTitle || meta.title || undefined,
    description: meta.description || undefined,
    keywords: meta.keywords || undefined,
  };
}

export function resolvePageMeta(page: PageJSON, urlSlug: string): ResolvedMeta {
  const store = getStore();
  const pm = page.pageMeta;
  const parts: Partial<ResolvedMeta>[] = [];

  // 1. Explicit master reference.
  if (pm?.meta_source === "master" && pm.master_meta_owner_id != null) {
    parts.push(
      fromSectionMeta(store.getSectionMetaByOwnerId(String(pm.master_meta_owner_id))),
    );
  }

  // 2. Inline page-level SEO fields.
  if (pm && (pm.seo_title || pm.seo_description || pm.seo_keywords)) {
    parts.push({
      title: pm.seo_title,
      description: pm.seo_description,
      keywords: pm.seo_keywords,
    });
  }

  // 3. SectionMeta matched by URL slug (implicit master).
  parts.push(fromSectionMeta(store.getSectionMetaBySlug(urlSlug)));

  // Merge: first defined value wins per field.
  const pick = (key: keyof ResolvedMeta): string | undefined => {
    for (const p of parts) {
      const v = p[key];
      if (v) return v;
    }
    return undefined;
  };

  return {
    title: pick("title") || page.title || siteConfig.name,
    description: pick("description") || siteConfig.description,
    keywords: pick("keywords"),
  };
}
