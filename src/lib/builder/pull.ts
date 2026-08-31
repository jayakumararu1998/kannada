import "server-only";

/**
 * Shared "pull" logic: fetch routes / pages / section-metas from the builder API
 * and the main menu from the Quintype menu-groups API, then merge into the local
 * store. Used by BOTH the on-demand endpoint (POST /api/sync/pull) and the
 * periodic background scheduler.
 *
 * Merge policy: each entity is replaced only when the remote returns at least
 * one item. An empty/failed fetch leaves existing data untouched, so a transient
 * outage or a not-yet-populated endpoint never wipes the store.
 */

import { BUILDER_ENDPOINTS, COLLECTIONS_BASE, SYNC_API_KEY } from "./config";
import { normalizePageShape } from "./normalize";
import { getStore, isRoutablePattern, sectionKey } from "./store";
import { syncSocialMetaSchemas } from "@/lib/seo/custom-schema-sync";
import type {
  ArticleTemplateConfig,
  CustomSchemaScript,
  MenuGroup,
  MenuHeaderCodeConfig,
  MenuItem,
  PageJSON,
  RouteConfig,
  SectionConfig,
  SectionMeta,
  SocialMetaConfig,
  WebsiteSettingConfig,
} from "./types";
import { segmentCount } from "./store";

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

/** GET a builder endpoint that requires the sync key (e.g. taboola-settings). */
async function getJsonAuthed(url: string): Promise<unknown> {
  const res = await fetch(url, {
    cache: "no-store",
    headers: SYNC_API_KEY ? { "x-api-key": SYNC_API_KEY } : {},
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

function pickArray(data: unknown, ...keys: string[]): unknown[] {
  if (Array.isArray(data)) return data;
  const obj = (data ?? {}) as Record<string, unknown>;
  for (const k of keys) if (Array.isArray(obj[k])) return obj[k] as unknown[];
  return [];
}

function extractPageJson(detail: unknown): PageJSON | null {
  // Unwraps layout_json / published_json / page and validates sections|html.
  return normalizePageShape(detail);
}

function toPath(url: string): string {
  if (!url) return "#";
  if (url.startsWith("/")) return url;
  if (/^https?:\/\//i.test(url)) {
    try {
      return new URL(url).pathname || "/";
    } catch {
      return url;
    }
  }
  return `/${url}`;
}

/** Normalise a Quintype menu item into our MenuItem shape. */
function normalizeMenuItem(raw: Record<string, unknown>): MenuItem {
  const sectionSlug = raw["section-slug"] as string | undefined;
  return {
    // Parent links use `id` (children's `parent-id` references it), NOT `item-id`.
    id: (raw.id as number) ?? (raw["item-id"] as number),
    title: (raw.title as string) ?? "",
    url: toPath((raw.url as string) ?? (sectionSlug ? `/${sectionSlug}` : "#")),
    rank: raw.rank as number | undefined,
    parentId: (raw["parent-id"] as number | null) ?? null,
  };
}

/** Normalise `{ "menu-groups": { slug: {...} } }` into MenuGroup records. */
function normalizeMenuGroups(json: unknown): Record<string, MenuGroup> {
  const obj = (json ?? {}) as Record<string, unknown>;
  const raw = (obj["menu-groups"] ?? obj.menuGroups ?? {}) as Record<
    string,
    Record<string, unknown>
  >;
  const out: Record<string, MenuGroup> = {};
  for (const [slug, group] of Object.entries(raw)) {
    const items = ((group.items as Record<string, unknown>[]) ?? []).map(
      normalizeMenuItem,
    );
    out[slug] = {
      id: group.id as number | undefined,
      slug,
      name: group.name as string | undefined,
      items,
    };
  }
  return out;
}

/** Absolute collection endpoint for a Quintype collection slug. */
function collectionUrlFor(slug: string): string {
  return `${COLLECTIONS_BASE}/api/v1/collections/${encodeURIComponent(slug)}`;
}

/** URL (absolute or path) → store section key (path, no leading slash). */
function urlToSectionKey(url: string): string {
  if (!url) return "";
  try {
    if (/^https?:\/\//i.test(url)) return sectionKey(new URL(url).pathname);
  } catch {
    /* fall through */
  }
  return sectionKey(url);
}

/** Normalise a builder "sections" API record into a SectionConfig. */
function normalizeSectionRecord(raw: Record<string, unknown>): SectionConfig | null {
  const sectionUrlRaw =
    (raw.section_url as string) ??
    (raw.sectionUrl as string) ??
    (raw.slug as string) ??
    "";
  const key = urlToSectionKey(sectionUrlRaw);
  if (!key) return null;

  const collectionSlug =
    (raw.collection_slug as string) ??
    (raw.collectionSlug as string) ??
    (raw.collection_id as string) ??
    "";
  const collectionUrl =
    (raw.collection_url as string) ??
    (raw.collectionUrl as string) ??
    (collectionSlug ? collectionUrlFor(collectionSlug) : "");
  if (!collectionUrl) return null;

  return {
    section_url: key,
    section_name: (raw.section_name as string) ?? (raw.name as string) ?? key,
    collection_name:
      (raw.collection_name as string) ?? (raw.collectionName as string) ?? "",
    collection_type: (raw.collection_type as string) ?? "",
    collection_slug: collectionSlug || undefined,
    collection_url: collectionUrl,
    is_active: raw.is_active !== false,
  };
}

/**
 * Derive section → collection mappings from the section-meta records (fallback
 * when the builder has no dedicated sections endpoint). Each meta carries a
 * sectionUrl + collectionSlug, which is exactly the mapping we need. Keyed by the
 * sectionUrl path so /sports, /videos/sports, /photogallery/sports stay distinct.
 */
function deriveSectionsFromMetas(
  metas: SectionMeta[],
): Record<string, SectionConfig> {
  const out: Record<string, SectionConfig> = {};
  for (const m of metas) {
    const collectionSlug = (m.collectionSlug as string) ?? "";
    if (!collectionSlug) continue;
    const sectionUrl = (m.sectionUrl as string) ?? (m.slug as string) ?? "";
    const key = urlToSectionKey(sectionUrl);
    if (!key || out[key]) continue;
    // Use the section's OWN host for the collection endpoint (it's the public
    // site host that actually serves collections), falling back to the base.
    let base = COLLECTIONS_BASE;
    try {
      if (/^https?:\/\//i.test(sectionUrl)) base = new URL(sectionUrl).origin;
    } catch {
      /* keep default */
    }
    out[key] = {
      section_url: key,
      section_name: (m.name as string) ?? key,
      collection_name: (m.collectionName as string) ?? "",
      collection_slug: collectionSlug,
      collection_url: `${base}/api/v1/collections/${encodeURIComponent(collectionSlug)}`,
      is_active: true,
    };
  }
  return out;
}

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export interface PullResult {
  routes: number;
  pages: number;
  sectionMetas: number;
  menus: number;
  sections: number;
  socialMetas: number;
  websiteSettings: number;
  customSchemas: number;
  menuHeaderCodes: number;
  adCodes: number;
  articleTemplates: number;
  taboolaSettings: number;
  layoutCodes: number;
  headerFooter: number;
  errors: string[];
}

/** True when the builder returned a usable header/footer config object. */
function isHeaderFooterConfig(data: unknown): data is Record<string, unknown> {
  return (
    !!data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    ("header" in data || "footer" in data)
  );
}

/**
 * Lightweight refresh of ONLY the dynamic header/footer config (one request).
 * Used by the fast background poll so the site picks up builder edits within the
 * poll interval without paying for a full pull. Returns true when it stored a
 * fresh config, false on an empty/failed fetch (store left untouched). Never throws.
 */
export async function runHeaderFooterPull(): Promise<boolean> {
  const store = getStore();
  const data = await safe<Record<string, unknown> | null>(async () => {
    const json = await getJson(BUILDER_ENDPOINTS.headerFooter);
    return isHeaderFooterConfig(json) ? json : null;
  }, null);
  if (!data) return false;
  store.setHeaderFooter(data);
  store.persist();
  return true;
}

/**
 * Lightweight refresh of ONLY the layout ad-codes (one authenticated request).
 * Used as the "ping" fallback when the builder POSTs the sync endpoint without a
 * usable body. Returns the number of codes stored (0 on empty/failed fetch, in
 * which case the store is left untouched). Never throws.
 */
export async function runLayoutCodesPull(): Promise<number> {
  const store = getStore();
  const map = await safe<Record<string, unknown>>(async () => {
    const data = (await getJsonAuthed(BUILDER_ENDPOINTS.layoutCodes)) as
      | Record<string, unknown>
      | null;
    const m = (data?.layoutCodes ?? data?.data ?? {}) as Record<
      string,
      unknown
    >;
    return m && typeof m === "object" && !Array.isArray(m) ? m : {};
  }, {});
  const count = Object.keys(map).length;
  if (!count) return 0;
  store.replaceLayoutCodes(map);
  store.persist();
  return count;
}

/** Fetch everything and merge into the store. Never throws. */
export async function runPull(): Promise<PullResult> {
  const store = getStore();
  const errors: string[] = [];
  store.beginSync();

  // Routes
  const routes = await safe<RouteConfig[]>(async () => {
    const data = await getJson(BUILDER_ENDPOINTS.routes);
    return pickArray(data, "routes", "data")
      .map((r) => r as RouteConfig)
      // Drop non-URL routes (e.g. the "Article Page" template, url_pattern:null);
      // otherwise they normalize to "/" and clobber the real homepage route.
      .filter((route) => isRoutablePattern(route.url_pattern))
      .map((route) => ({
        ...route,
        segment_count: segmentCount(route.url_pattern),
      }));
  }, []);
  if (!routes.length) errors.push("routes: empty/failed");

  // Pages (list then detail, batched)
  const pages = await safe<Record<string, PageJSON>>(async () => {
    const list = pickArray(await getJson(BUILDER_ENDPOINTS.pageList), "pages", "data");
    const acc: Record<string, PageJSON> = {};
    const BATCH = 5;
    for (let i = 0; i < list.length; i += BATCH) {
      await Promise.all(
        list.slice(i, i + BATCH).map(async (p) => {
          const id = String((p as Record<string, unknown>).id ?? "");
          if (!id) return;
          const page = extractPageJson(await getJson(BUILDER_ENDPOINTS.pageById(id)));
          if (page) acc[id] = { ...page, page_id: id };
        }),
      );
    }
    return acc;
  }, {});

  // Section metas — keep the raw array too so sections can be derived from it.
  const metaArray = await safe<SectionMeta[]>(async () => {
    return pickArray(
      await getJson(BUILDER_ENDPOINTS.sectionMetas),
      "data",
      "sectionMetas",
    ) as SectionMeta[];
  }, []);
  const sectionMetas: Record<string, SectionMeta> = {};
  for (const meta of metaArray) {
    const key = String(meta.ownerId ?? meta.id ?? "");
    if (key) sectionMetas[key] = meta;
  }

  // Sections (URL → collection). Prefer the builder's sections endpoint; fall
  // back to deriving from the section-meta records (sectionUrl + collectionSlug).
  const sections = await safe<Record<string, SectionConfig>>(async () => {
    const data = pickArray(
      await getJson(BUILDER_ENDPOINTS.sections),
      "sections",
      "data",
    );
    const acc: Record<string, SectionConfig> = {};
    for (const s of data) {
      const section = normalizeSectionRecord(s as Record<string, unknown>);
      if (section) acc[section.section_url] = section;
    }
    return acc;
  }, {});
  // Sections from the builder endpoint are authoritative (replace). If that's
  // empty, DERIVE from section-metas — but derived sections are only a bootstrap
  // fallback: they must NOT overwrite sections already pushed via
  // POST /api/sync/sections. So mark them and skip the write if the store
  // already has sections.
  let sectionsDerived = false;
  if (!Object.keys(sections).length) {
    Object.assign(sections, deriveSectionsFromMetas(metaArray));
    sectionsDerived = true;
  }
  if (!Object.keys(sections).length) errors.push("sections: empty/failed");

  // Menus (Quintype menu-groups)
  const menus = await safe<Record<string, MenuGroup>>(async () => {
    return normalizeMenuGroups(await getJson(BUILDER_ENDPOINTS.menuGroups));
  }, {});
  if (!Object.keys(menus).length) errors.push("menus: empty/failed");

  // Social metas (per-URL OG/Twitter overrides).
  const socialMetas = await safe<SocialMetaConfig[]>(async () => {
    return pickArray(
      await getJson(BUILDER_ENDPOINTS.socialMetas),
      "socialMetas",
      "data",
    ) as SocialMetaConfig[];
  }, []);

  // Website settings (site-wide application config).
  const websiteSettings = await safe<WebsiteSettingConfig[]>(async () => {
    const data = await getJson(BUILDER_ENDPOINTS.websiteSettings);
    // Accept an array, {settings|data:[...]}, or a bare {slug: value} map.
    const arr = pickArray(data, "settings", "data");
    if (arr.length) return arr as WebsiteSettingConfig[];
    if (data && typeof data === "object" && !Array.isArray(data)) {
      return Object.entries(data as Record<string, unknown>)
        .filter(([k]) => !k.startsWith("_") && k !== "success")
        .map(([slug, value]) => ({ slug, value }) as WebsiteSettingConfig);
    }
    return [];
  }, []);

  // Global custom JSON-LD schemas (non page-scoped).
  const customSchemas = await safe<CustomSchemaScript[]>(async () => {
    return pickArray(
      await getJson(BUILDER_ENDPOINTS.customSchemas),
      "customSchemaScripts",
      "data",
    ) as CustomSchemaScript[];
  }, []);

  // Menu header codes (CMS banners above header / below breaking news).
  const menuHeaderCodes = await safe<MenuHeaderCodeConfig[]>(async () => {
    return pickArray(
      await getJson(BUILDER_ENDPOINTS.menuHeaderCodes),
      "menuHeaderCodes",
      "data",
    ) as MenuHeaderCodeConfig[];
  }, []);

  // Global positional ad codes (top/lhs/rhs/sticky/anchor). One config object —
  // accept an array (first) or a bare object.
  const adCodes = await safe<Record<string, unknown> | null>(async () => {
    const data = await getJson(BUILDER_ENDPOINTS.adCodes);
    const arr = pickArray(data, "adCodes", "data");
    if (arr.length) return arr[0] as Record<string, unknown>;
    if (data && typeof data === "object" && !Array.isArray(data)) {
      const obj = data as Record<string, unknown>;
      return (obj.adCodes ?? obj.data ?? obj) as Record<string, unknown>;
    }
    return null;
  }, null);

  // Article templates (story-template → template).
  const articleTemplates = await safe<ArticleTemplateConfig[]>(async () => {
    return pickArray(
      await getJson(BUILDER_ENDPOINTS.articleTemplates),
      "articleTemplates",
      "data",
    ) as ArticleTemplateConfig[];
  }, []);

  // Taboola settings (authenticated). Response: `{ taboolaSettings: { slug: {...} } }`.
  const taboolaSettings = await safe<Record<string, unknown>>(async () => {
    const data = (await getJsonAuthed(BUILDER_ENDPOINTS.taboolaSettings)) as
      | Record<string, unknown>
      | null;
    const map = (data?.taboolaSettings ?? data?.data ?? {}) as Record<
      string,
      unknown
    >;
    return map && typeof map === "object" && !Array.isArray(map) ? map : {};
  }, {});
  // Layout ad-codes (authenticated). Response: `{ layoutCodes: { slug: {...} } }`.
  const layoutCodes = await safe<Record<string, unknown>>(async () => {
    const data = (await getJsonAuthed(BUILDER_ENDPOINTS.layoutCodes)) as
      | Record<string, unknown>
      | null;
    const map = (data?.layoutCodes ?? data?.data ?? {}) as Record<
      string,
      unknown
    >;
    return map && typeof map === "object" && !Array.isArray(map) ? map : {};
  }, {});
  // Dynamic header/footer config (single object, builder slug "default").
  const headerFooter = await safe<Record<string, unknown> | null>(async () => {
    const data = await getJson(BUILDER_ENDPOINTS.headerFooter);
    return isHeaderFooterConfig(data) ? data : null;
  }, null);
  if (!headerFooter) errors.push("headerFooter: empty/failed");

  // Merge (replace-per-entity only when non-empty).
  if (routes.length) {
    store.clearRoutes();
    routes.forEach((r) => store.upsertRoute(r));
  }
  if (Object.keys(pages).length) {
    store.clearPages();
    for (const [id, page] of Object.entries(pages)) store.upsertPage(id, page);
  }
  if (Object.keys(sectionMetas).length) {
    store.clearSectionMetas();
    for (const [id, meta] of Object.entries(sectionMetas)) store.upsertSectionMeta(id, meta);
  }
  if (Object.keys(menus).length) {
    store.clearMenus();
    for (const [slug, menu] of Object.entries(menus)) store.upsertMenu(slug, menu);
  }
  // Authoritative sections replace; derived sections only bootstrap an empty
  // store (never clobber sections pushed from the builder).
  const hasStoredSections =
    Object.keys(store.getAllSections()).length > 0;
  if (Object.keys(sections).length && !(sectionsDerived && hasStoredSections)) {
    store.clearSections();
    for (const [key, section] of Object.entries(sections)) {
      store.upsertSection(key, section);
    }
  }

  // Social metas — replace when non-empty; extract each record's per-page
  // custom JSON-LD into the custom-schema store (scoped to its pageUrl).
  if (socialMetas.length) {
    store.clearSocialMetas();
    for (const meta of socialMetas) {
      const slug = String(meta.slug ?? meta.id ?? "");
      if (!slug) continue;
      store.upsertSocialMeta(slug, { ...meta, slug });
      syncSocialMetaSchemas(store, slug, meta);
    }
  }

  // Website settings — replace when non-empty.
  if (websiteSettings.length) {
    store.clearWebsiteSettings();
    for (const setting of websiteSettings) {
      const slug = String(setting.slug ?? setting.name ?? "");
      if (slug) store.upsertWebsiteSetting(slug, setting);
    }
  }

  // Global custom schemas — replace the GLOBAL set only (keep `_socialmeta_*`).
  if (customSchemas.length) {
    for (const [id, cfg] of Object.entries(store.getAllCustomSchemaScripts())) {
      if (!id.startsWith("_socialmeta_") && !cfg.pageUrl) {
        store.deleteCustomSchemaScript(id);
      }
    }
    for (const entry of customSchemas) {
      const id = String(entry.id ?? entry.label ?? "");
      if (id) store.upsertCustomSchemaScript(id, { ...entry, id, pageUrl: null });
    }
  }

  // Menu header codes — replace when non-empty.
  if (menuHeaderCodes.length) {
    store.clearMenuHeaderCodes();
    for (const code of menuHeaderCodes) {
      const slug = String(code.slug ?? "");
      if (slug) store.upsertMenuHeaderCode(slug, { ...code, slug });
    }
  }

  // Ad codes — replace the single config object when present.
  if (adCodes && Object.keys(adCodes).length) {
    store.setAdCodes(adCodes);
  }

  // Taboola settings — replace the whole map when non-empty.
  if (Object.keys(taboolaSettings).length) {
    store.replaceTaboolaSettings(taboolaSettings);
  }
  // Layout ad-codes — replace the whole map when non-empty.
  if (Object.keys(layoutCodes).length) {
    store.replaceLayoutCodes(layoutCodes);
  }

  // Article templates — replace when non-empty (keyed by story-template).
  if (articleTemplates.length) {
    store.clearArticleTemplates();
    for (const tpl of articleTemplates) {
      const key = String(
        tpl.templateType ??
          (tpl as Record<string, unknown>)["story-template"] ??
          (tpl as Record<string, unknown>).slug ??
          "",
      );
      if (key) store.upsertArticleTemplate(key, { ...tpl, templateType: key });
    }
  }
  // Replace the header/footer config only when a usable one came back.
  if (headerFooter) store.setHeaderFooter(headerFooter);

  store.persist();
  store.endSync();

  return {
    routes: routes.length,
    pages: Object.keys(pages).length,
    sectionMetas: Object.keys(sectionMetas).length,
    menus: Object.keys(menus).length,
    menuHeaderCodes: menuHeaderCodes.length,
    adCodes: adCodes ? Object.keys(adCodes).length : 0,
    articleTemplates: articleTemplates.length,
    taboolaSettings: Object.keys(taboolaSettings).length,
    layoutCodes: Object.keys(layoutCodes).length,
    // Reflect what's actually stored (derived sections may have been skipped to
    // preserve pushed ones).
    sections: Object.keys(store.getAllSections()).length,
    socialMetas: Object.keys(store.getAllSocialMetas()).length,
    websiteSettings: Object.keys(store.getAllWebsiteSettings()).length,
    customSchemas: Object.keys(store.getAllCustomSchemaScripts()).length,
    headerFooter: headerFooter ? 1 : 0,
    errors,
  };
}
