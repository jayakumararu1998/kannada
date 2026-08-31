import "server-only";

/**
 * LocalStore — a disk-backed, in-memory singleton holding builder `routes` and
 * `pages` (dinamani ports 14 entities; we keep only the two the v1 features
 * need). Memory is a fast cache over a JSON file that is the real source of
 * truth, so multiple server workers converge via a short mtime hot-reload.
 *
 * Resilience: a missing file starts empty; a read-only filesystem degrades to
 * in-memory only. Neither ever throws to the caller.
 */

import fs from "node:fs";
import path from "node:path";

import { STORE_PATH } from "./config";
import type {
  ArticleTemplateConfig,
  CustomSchemaScript,
  MenuGroup,
  MenuHeaderCodeConfig,
  PageJSON,
  RouteConfig,
  SectionConfig,
  SectionMeta,
  SocialMetaConfig,
  WebsiteSettingConfig,
} from "./types";

interface StoreData {
  version: number;
  lastSync: number;
  routes: Record<string, RouteConfig>;
  pages: Record<string, PageJSON>;
  sectionMetas?: Record<string, SectionMeta>;
  menus?: Record<string, MenuGroup>;
  sections?: Record<string, SectionConfig>;
  articleTemplates?: Record<string, ArticleTemplateConfig>;
  ampArticleTemplates?: Record<string, ArticleTemplateConfig>;
  adCodes?: Record<string, unknown>;
  /** Vuukle comment settings, keyed by slug (usually "default"). */
  vuukleSettings?: Record<string, unknown>;
  /** Taboola ad/widget settings, keyed by slug (usually "default"). */
  taboolaSettings?: Record<string, unknown>;
  /** GAM/GPT layout ad-codes (page/section/article/AMP variants), keyed by slug. */
  layoutCodes?: Record<string, unknown>;
  /** Per-URL social/OG/Twitter overrides, keyed by slug. */
  socialMetas?: Record<string, SocialMetaConfig>;
  /** Site-wide application config, keyed by slug. */
  websiteSettings?: Record<string, WebsiteSettingConfig>;
  /** Builder-authored custom JSON-LD, keyed by id. */
  customSchemaScripts?: Record<string, CustomSchemaScript>;
  /** CMS image/HTML banners above the header / below breaking news, keyed by slug. */
  menuHeaderCodes?: Record<string, MenuHeaderCodeConfig>;
  /** Dynamic header/footer config (builder slug "default"). One config object. */
  headerFooter?: Record<string, unknown>;
}

/** Store key for a section: URL path without leading/trailing slashes. */
export function sectionKey(urlPath: string): string {
  return (urlPath || "").replace(/^\/+|\/+$/g, "");
}

const RELOAD_DEBOUNCE_MS = 10_000;

function normalizeSlug(slug: string): string {
  if (!slug || slug === "/") return "/";
  const withLead = slug.startsWith("/") ? slug : `/${slug}`;
  // Drop trailing slash except for root.
  return withLead.length > 1 ? withLead.replace(/\/+$/, "") : withLead;
}

/** Segment count of a URL/pattern, capped at 5 (matches dinamani). Null-safe. */
export function segmentCount(pattern: string | null | undefined): number {
  if (!pattern || typeof pattern !== "string") return 0;
  return Math.min(pattern.split("/").filter(Boolean).length, 5);
}

/**
 * A routable pattern must be a non-empty string starting with "/". Routes
 * WITHOUT one (e.g. the builder's "Article Page" template, `url_pattern: null`)
 * are NOT URL routes — storing them would normalize to "/" and clobber the real
 * homepage route, so they must be filtered out on ingest.
 */
export function isRoutablePattern(pattern: unknown): pattern is string {
  return typeof pattern === "string" && pattern.startsWith("/");
}

function isDynamicPattern(pattern: string): boolean {
  return pattern.includes("{") || pattern.includes(":");
}

export class LocalStore {
  private routes = new Map<string, RouteConfig>();
  private pages = new Map<string, PageJSON>();
  /** slug → pageId index for O(1) findPageBySlug. */
  private pagesBySlug = new Map<string, string>();
  /** ownerId → section meta (master SEO records). */
  private sectionMetas = new Map<string, SectionMeta>();
  /** normalized slug → ownerId index for URL matching. */
  private sectionMetasBySlug = new Map<string, string>();
  /** menu slug → menu group (e.g. "default" = header nav). */
  private menus = new Map<string, MenuGroup>();
  /** section_url (URL path, no leading slash) → section→collection mapping. */
  private sections = new Map<string, SectionConfig>();
  /** story-template (e.g. "text","video") → dynamic article template (HTML). */
  private articleTemplates = new Map<string, ArticleTemplateConfig>();
  /** story-template → AMP-variant article template (builder `variant:"amp"`).
   *  Kept separate so the AMP and HTML variants (same templateType) don't
   *  overwrite each other; the HTML page reads `articleTemplates`, AMP reads this. */
  private ampArticleTemplates = new Map<string, ArticleTemplateConfig>();
  /** Global positional ad codes (top/lhs/rhs/sticky/anchor). One config object. */
  private adCodes: Record<string, unknown> = {};
  /** Vuukle comment settings, keyed by slug. */
  private vuukleSettings: Record<string, unknown> = {};
  /** Taboola ad/widget settings, keyed by slug. */
  private taboolaSettings: Record<string, unknown> = {};
  /** GAM/GPT layout ad-codes, keyed by slug. */
  private layoutCodes: Record<string, unknown> = {};
  /** Per-URL social/OG/Twitter overrides, keyed by slug. */
  private socialMetas = new Map<string, SocialMetaConfig>();
  /** Site-wide application config, keyed by slug. */
  private websiteSettings = new Map<string, WebsiteSettingConfig>();
  /** Builder-authored custom JSON-LD, keyed by id. */
  private customSchemaScripts = new Map<string, CustomSchemaScript>();
  /** CMS image/HTML header banners, keyed by slug. */
  private menuHeaderCodes = new Map<string, MenuHeaderCodeConfig>();
  /** Dynamic header/footer config (builder slug "default"). One config object. */
  private headerFooter: Record<string, unknown> = {};

  private lastSync = 0;
  private dirty = false;
  private lastLoadedMtimeMs = 0;
  private lastReloadCheck = 0;
  private syncing = false;

  constructor(private readonly persistPath: string) {
    this.loadFromDisk();
  }

  // ── Persistence ───────────────────────────────────────────────────────────

  private loadFromDisk(): void {
    try {
      const raw = fs.readFileSync(this.persistPath, "utf8");
      const data = JSON.parse(raw) as StoreData;
      this.hydrate(data);
      this.lastLoadedMtimeMs = this.currentMtimeMs();
    } catch {
      // Missing/corrupt file → start empty. Not fatal.
    }
  }

  private hydrate(data: Partial<StoreData>): void {
    this.routes.clear();
    this.pages.clear();
    this.pagesBySlug.clear();
    this.sectionMetas.clear();
    this.sectionMetasBySlug.clear();
    this.menus.clear();
    this.sections.clear();
    this.articleTemplates.clear();
    this.socialMetas.clear();
    this.websiteSettings.clear();
    this.customSchemaScripts.clear();
    this.menuHeaderCodes.clear();
    for (const route of Object.values(data.routes ?? {})) {
      this.routes.set(normalizeSlug(route.url_pattern), route);
    }
    for (const [id, page] of Object.entries(data.pages ?? {})) {
      this.pages.set(id, page);
      if (page?.slug) this.pagesBySlug.set(normalizeSlug(page.slug), id);
    }
    for (const [id, meta] of Object.entries(data.sectionMetas ?? {})) {
      this.indexSectionMeta(id, meta);
    }
    for (const [slug, menu] of Object.entries(data.menus ?? {})) {
      this.menus.set(slug, menu);
    }
    for (const [key, section] of Object.entries(data.sections ?? {})) {
      this.sections.set(sectionKey(key), section);
    }
    for (const [type, tpl] of Object.entries(data.articleTemplates ?? {})) {
      this.articleTemplates.set(type, tpl);
    }
    for (const [type, tpl] of Object.entries(data.ampArticleTemplates ?? {})) {
      this.ampArticleTemplates.set(type, tpl);
    }
    this.adCodes = data.adCodes ?? {};
    this.vuukleSettings = data.vuukleSettings ?? {};
    this.taboolaSettings = data.taboolaSettings ?? {};
    this.layoutCodes = data.layoutCodes ?? {};
    for (const [slug, meta] of Object.entries(data.socialMetas ?? {})) {
      this.socialMetas.set(slug, meta);
    }
    for (const [slug, setting] of Object.entries(data.websiteSettings ?? {})) {
      this.websiteSettings.set(slug, setting);
    }
    for (const [id, cfg] of Object.entries(data.customSchemaScripts ?? {})) {
      this.customSchemaScripts.set(id, cfg);
    }
    for (const [slug, cfg] of Object.entries(data.menuHeaderCodes ?? {})) {
      this.menuHeaderCodes.set(slug, cfg);
    }
    this.headerFooter = data.headerFooter ?? {};
    this.lastSync = data.lastSync ?? this.lastSync;
  }

  private indexSectionMeta(ownerId: string, meta: SectionMeta): void {
    this.sectionMetas.set(ownerId, meta);
    if (meta.slug) this.sectionMetasBySlug.set(normalizeSlug(meta.slug), ownerId);
  }

  private currentMtimeMs(): number {
    try {
      return fs.statSync(this.persistPath).mtimeMs;
    } catch {
      return 0;
    }
  }

  /** Reload from disk if the file changed since we last read it (debounced). */
  private maybeReload(): void {
    if (this.syncing) return;
    const now = Date.now();
    if (now - this.lastReloadCheck < RELOAD_DEBOUNCE_MS) return;
    this.lastReloadCheck = now;
    const mtime = this.currentMtimeMs();
    if (mtime && mtime !== this.lastLoadedMtimeMs) {
      this.loadFromDisk();
    }
  }

  /** Atomically write the store to disk. Read-only FS is non-fatal. */
  persist(): { success: boolean; error?: string } {
    const data: StoreData = {
      version: 1,
      lastSync: this.lastSync,
      routes: Object.fromEntries(this.routes),
      pages: Object.fromEntries(this.pages),
      sectionMetas: Object.fromEntries(this.sectionMetas),
      menus: Object.fromEntries(this.menus),
      sections: Object.fromEntries(this.sections),
      articleTemplates: Object.fromEntries(this.articleTemplates),
      ampArticleTemplates: Object.fromEntries(this.ampArticleTemplates),
      adCodes: this.adCodes,
      vuukleSettings: this.vuukleSettings,
      taboolaSettings: this.taboolaSettings,
      layoutCodes: this.layoutCodes,
      socialMetas: Object.fromEntries(this.socialMetas),
      websiteSettings: Object.fromEntries(this.websiteSettings),
      customSchemaScripts: Object.fromEntries(this.customSchemaScripts),
      menuHeaderCodes: Object.fromEntries(this.menuHeaderCodes),
      headerFooter: this.headerFooter,
    };
    try {
      fs.mkdirSync(path.dirname(this.persistPath), { recursive: true });
      const tmp = `${this.persistPath}.${process.pid}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(data), "utf8");
      fs.renameSync(tmp, this.persistPath);
      this.lastLoadedMtimeMs = this.currentMtimeMs();
      this.dirty = false;
      return { success: true };
    } catch (error) {
      // Degrade to in-memory only.
      return { success: false, error: (error as Error).message };
    }
  }

  // ── Sync lifecycle ──────────────────────────────────────────────────────────

  beginSync(): void {
    this.syncing = true;
  }

  endSync(): void {
    this.syncing = false;
    this.lastSync = Date.now();
  }

  // ── Routes ──────────────────────────────────────────────────────────────────

  upsertRoute(route: RouteConfig): void {
    // Final safety net: never let a non-URL pattern (null/empty) be stored — it
    // would normalize to "/" and overwrite the homepage route.
    if (!isRoutablePattern(route.url_pattern)) return;
    const key = normalizeSlug(route.url_pattern);
    this.routes.set(key, {
      ...route,
      url_pattern: key,
      segment_count: segmentCount(key),
    });
    this.dirty = true;
  }

  getAllRoutes(): RouteConfig[] {
    this.maybeReload();
    return [...this.routes.values()];
  }

  /**
   * Resolve a URL to its best-matching route. Precedence:
   *   1. exact/static match  2. most static segments  3. higher priority
   * so `/sports/cricket` never falls to `/sports/{x}` when an exact route exists.
   */
  getRouteByMatch(url: string): RouteConfig | null {
    this.maybeReload();
    const slug = normalizeSlug(url);

    const exact = this.routes.get(slug);
    if (exact) return exact;

    const urlSegs = slug.split("/").filter(Boolean);
    const urlCount = Math.min(urlSegs.length, 5);

    const candidates = [...this.routes.values()]
      .filter((r) => matchPattern(r.url_pattern, slug))
      .sort((a, b) => {
        const aDyn = isDynamicPattern(a.url_pattern) ? 1 : 0;
        const bDyn = isDynamicPattern(b.url_pattern) ? 1 : 0;
        if (aDyn !== bDyn) return aDyn - bDyn; // static first
        const aStatic = staticSegmentCount(a.url_pattern);
        const bStatic = staticSegmentCount(b.url_pattern);
        if (aStatic !== bStatic) return bStatic - aStatic; // more static first
        return (b.priority ?? 0) - (a.priority ?? 0);
      });

    // Prefer patterns whose segment count matches the URL (5-cap tolerance).
    const best =
      candidates.find(
        (r) => r.segment_count === urlCount || r.segment_count === 5,
      ) ?? candidates[0];
    return best ?? null;
  }

  // ── Pages ────────────────────────────────────────────────────────────────────

  upsertPage(pageId: string, page: PageJSON): void {
    // Clear any stale slug index entry pointing at this id.
    for (const [slug, id] of this.pagesBySlug) {
      if (id === pageId) this.pagesBySlug.delete(slug);
    }
    this.pages.set(pageId, page);
    if (page?.slug) this.pagesBySlug.set(normalizeSlug(page.slug), pageId);
    this.dirty = true;
  }

  getPageById(pageId: string): PageJSON | null {
    this.maybeReload();
    return this.pages.get(pageId) ?? null;
  }

  findPageBySlug(
    slug: string,
  ): { pageId: string; page: PageJSON } | null {
    this.maybeReload();
    const pageId = this.pagesBySlug.get(normalizeSlug(slug));
    if (!pageId) return null;
    const page = this.pages.get(pageId);
    return page ? { pageId, page } : null;
  }

  /**
   * Find a page by its human title/name. Fallback for routes whose `page_id`
   * is a friendly identifier (e.g. "web-stories") that matches neither a page
   * UUID nor a page slug, but does match a page's title (a common builder state
   * when a page is cloned from another and its slug isn't re-pointed).
   */
  findPageByTitle(title: string): { pageId: string; page: PageJSON } | null {
    this.maybeReload();
    // Slugify to bridge a friendly page_id ("web-stories") and a display title
    // ("Web Stories"): lowercase, collapse non-alphanumerics to single hyphens.
    const slugify = (s: string) =>
      s
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    const target = slugify(title);
    if (!target) return null;
    for (const [pageId, page] of this.pages) {
      const name = page as { title?: string; page_name?: string; name?: string };
      const candidate = name.title ?? name.page_name ?? name.name ?? "";
      if (slugify(candidate) === target) return { pageId, page };
    }
    return null;
  }

  getAllPages(): Record<string, PageJSON> {
    this.maybeReload();
    return Object.fromEntries(this.pages);
  }

  // ── Section metas (master SEO records) ────────────────────────────────────────

  upsertSectionMeta(ownerId: string, meta: SectionMeta): void {
    // Drop any stale slug index entry pointing at this ownerId.
    for (const [slug, id] of this.sectionMetasBySlug) {
      if (id === ownerId) this.sectionMetasBySlug.delete(slug);
    }
    this.indexSectionMeta(ownerId, meta);
    this.dirty = true;
  }

  getSectionMetaByOwnerId(ownerId: string): SectionMeta | null {
    this.maybeReload();
    return this.sectionMetas.get(ownerId) ?? null;
  }

  getSectionMetaBySlug(slug: string): SectionMeta | null {
    this.maybeReload();
    const ownerId = this.sectionMetasBySlug.get(normalizeSlug(slug));
    return ownerId ? this.sectionMetas.get(ownerId) ?? null : null;
  }

  getAllSectionMetas(): Record<string, SectionMeta> {
    this.maybeReload();
    return Object.fromEntries(this.sectionMetas);
  }

  clearSectionMetas(): void {
    this.sectionMetas.clear();
    this.sectionMetasBySlug.clear();
    this.dirty = true;
  }

  // ── Article templates ───────────────────────────────────────────────────
  upsertArticleTemplate(type: string, tpl: ArticleTemplateConfig): void {
    if (!type) return;
    // The builder ships an HTML (`variant:"default"`) and an AMP
    // (`variant:"amp"`) template for the SAME templateType. Route them to
    // separate maps so the second-loaded one doesn't clobber the first.
    const map =
      tpl.variant === "amp" ? this.ampArticleTemplates : this.articleTemplates;
    map.set(type, tpl);
    this.dirty = true;
  }

  /**
   * The dynamic article template for a story-template, or null. `variant`
   * selects the HTML (`"default"`, used by the article page) or AMP (`"amp"`,
   * used by the AMP builder) template; AMP falls back to the HTML variant when
   * no dedicated AMP template exists.
   */
  getArticleTemplateByType(
    type: string,
    variant: "default" | "amp" = "default",
  ): ArticleTemplateConfig | null {
    this.maybeReload();
    // Exact match first, then a normalized fallback — the builder keys templates
    // inconsistently (story-template slug vs display name): e.g. `listicle` vs
    // stored `Listicle`, `question-and-answer` vs `Question and Answer`,
    // `story-listicle` vs `storylisticle`. Normalise both to lowercase
    // alphanumerics so the right template is still found.
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const target = norm(type);
    const lookup = (
      map: Map<string, ArticleTemplateConfig>,
    ): ArticleTemplateConfig | null => {
      const exact = map.get(type);
      if (exact) return exact;
      for (const [key, tpl] of map) if (norm(key) === target) return tpl;
      return null;
    };
    if (variant === "amp") return lookup(this.ampArticleTemplates) ?? lookup(this.articleTemplates);
    return lookup(this.articleTemplates);
  }

  getAllArticleTemplates(): Record<string, ArticleTemplateConfig> {
    this.maybeReload();
    return Object.fromEntries(this.articleTemplates);
  }

  clearArticleTemplates(): void {
    this.articleTemplates.clear();
    this.ampArticleTemplates.clear();
    this.dirty = true;
  }

  deleteArticleTemplate(type: string): void {
    this.articleTemplates.delete(type);
    this.dirty = true;
  }

  // ── Global ad codes (top/lhs/rhs/sticky/anchor) ─────────────────────────
  getAdCodes(): Record<string, unknown> {
    this.maybeReload();
    return this.adCodes;
  }

  /** Replace the ad-code config (or merge when `merge` is true). */
  setAdCodes(codes: Record<string, unknown>, merge = false): void {
    this.adCodes = merge ? { ...this.adCodes, ...codes } : codes;
    this.dirty = true;
  }

  // ── Vuukle comment settings ─────────────────────────────────────────────
  /** The raw stored entry (`{ slug, config }`) for a slug, or null. */
  getVuukleSettings(slug = "default"): Record<string, unknown> | null {
    this.maybeReload();
    return (this.vuukleSettings[slug] as Record<string, unknown>) ?? null;
  }

  /** Upsert (or delete) the Vuukle settings for a slug. */
  setVuukleSettings(slug: string, data: Record<string, unknown> | null): void {
    if (data === null) delete this.vuukleSettings[slug];
    else this.vuukleSettings[slug] = data;
    this.dirty = true;
  }

  // ── Taboola ad/widget settings ──────────────────────────────────────────
  /** The raw stored entry (`{ slug, config }`) for a slug, or null. */
  getTaboolaSettings(slug = "default"): Record<string, unknown> | null {
    this.maybeReload();
    return (this.taboolaSettings[slug] as Record<string, unknown>) ?? null;
  }

  /** All Taboola entries, keyed by slug (as returned by the sync GET). */
  getAllTaboolaSettings(): Record<string, unknown> {
    this.maybeReload();
    return { ...this.taboolaSettings };
  }

  /** Upsert (or delete) the Taboola settings for a slug. */
  setTaboolaSettings(slug: string, data: Record<string, unknown> | null): void {
    if (data === null) delete this.taboolaSettings[slug];
    else this.taboolaSettings[slug] = data;
    this.dirty = true;
  }

  /** Replace the entire Taboola settings map (used by the pull sync). */
  replaceTaboolaSettings(all: Record<string, unknown>): void {
    this.taboolaSettings = { ...all };
    this.dirty = true;
  }

  // ── GAM/GPT layout ad-codes ───────────────────────────────────────────────
  /** The raw stored ad-code entry for a slug, or null. */
  getLayoutCode(slug: string): Record<string, unknown> | null {
    this.maybeReload();
    return (this.layoutCodes[slug] as Record<string, unknown>) ?? null;
  }

  /** All layout ad-code entries, keyed by slug (as returned by the sync GET). */
  getAllLayoutCodes(): Record<string, unknown> {
    this.maybeReload();
    return { ...this.layoutCodes };
  }

  /** Upsert (or delete) a layout ad-code by slug. */
  setLayoutCode(slug: string, data: Record<string, unknown> | null): void {
    if (data === null) delete this.layoutCodes[slug];
    else this.layoutCodes[slug] = data;
    this.dirty = true;
  }

  /** Replace the entire layout ad-code map (used by the pull sync). */
  replaceLayoutCodes(all: Record<string, unknown>): void {
    this.layoutCodes = { ...all };
    this.dirty = true;
  }

  // ── Social metas (per-URL OG/Twitter overrides) ──────────────────────────
  upsertSocialMeta(slug: string, meta: SocialMetaConfig): void {
    if (!slug) return;
    this.socialMetas.set(slug, { ...meta, slug });
    this.dirty = true;
  }

  getSocialMeta(slug: string): SocialMetaConfig | null {
    this.maybeReload();
    return this.socialMetas.get(slug) ?? null;
  }

  getAllSocialMetas(): Record<string, SocialMetaConfig> {
    this.maybeReload();
    return Object.fromEntries(this.socialMetas);
  }

  /** Resolve the active social-meta record whose `pageUrl` matches a path. */
  getSocialMetaByPageUrl(pageUrl: string): SocialMetaConfig | null {
    this.maybeReload();
    const clean = normalizeSlug(pageUrl);
    for (const meta of this.socialMetas.values()) {
      if (meta.isActive === false || !meta.pageUrl) continue;
      if (normalizeSlug(meta.pageUrl) === clean) return meta;
    }
    return null;
  }

  deleteSocialMeta(slug: string): void {
    this.socialMetas.delete(slug);
    this.dirty = true;
  }

  clearSocialMetas(): void {
    this.socialMetas.clear();
    this.dirty = true;
  }

  // ── Website settings (site-wide application config) ──────────────────────
  upsertWebsiteSetting(slug: string, setting: WebsiteSettingConfig): void {
    if (!slug) return;
    this.websiteSettings.set(slug, { ...setting, slug });
    this.dirty = true;
  }

  getWebsiteSetting(slug: string): WebsiteSettingConfig | null {
    this.maybeReload();
    return this.websiteSettings.get(slug) ?? null;
  }

  getAllWebsiteSettings(): Record<string, WebsiteSettingConfig> {
    this.maybeReload();
    return Object.fromEntries(this.websiteSettings);
  }

  deleteWebsiteSetting(slug: string): void {
    this.websiteSettings.delete(slug);
    this.dirty = true;
  }

  clearWebsiteSettings(): void {
    this.websiteSettings.clear();
    this.dirty = true;
  }

  // ── Custom JSON-LD schema scripts (builder-authored) ─────────────────────
  upsertCustomSchemaScript(id: string, cfg: CustomSchemaScript): void {
    if (!id) return;
    this.customSchemaScripts.set(id, { ...cfg, id });
    this.dirty = true;
  }

  getCustomSchemaScript(id: string): CustomSchemaScript | null {
    this.maybeReload();
    return this.customSchemaScripts.get(id) ?? null;
  }

  getAllCustomSchemaScripts(): Record<string, CustomSchemaScript> {
    this.maybeReload();
    return Object.fromEntries(this.customSchemaScripts);
  }

  deleteCustomSchemaScript(id: string): void {
    this.customSchemaScripts.delete(id);
    this.dirty = true;
  }

  clearCustomSchemaScripts(): void {
    this.customSchemaScripts.clear();
    this.dirty = true;
  }

  // ── Menu header codes (CMS banners above header / below breaking news) ────
  upsertMenuHeaderCode(slug: string, cfg: MenuHeaderCodeConfig): void {
    if (!slug) return;
    this.menuHeaderCodes.set(slug, { ...cfg, slug });
    this.dirty = true;
  }

  getMenuHeaderCode(slug: string): MenuHeaderCodeConfig | null {
    this.maybeReload();
    return this.menuHeaderCodes.get(slug) ?? null;
  }

  getAllMenuHeaderCodes(): Record<string, MenuHeaderCodeConfig> {
    this.maybeReload();
    return Object.fromEntries(this.menuHeaderCodes);
  }

  deleteMenuHeaderCode(slug: string): void {
    this.menuHeaderCodes.delete(slug);
    this.dirty = true;
  }

  clearMenuHeaderCodes(): void {
    this.menuHeaderCodes.clear();
    this.dirty = true;
  }

  // ── Dynamic header/footer config ────────────────────────────────────────
  /** The stored header/footer config object (empty when never synced). */
  getHeaderFooter(): Record<string, unknown> {
    this.maybeReload();
    return this.headerFooter;
  }

  /** Replace the header/footer config (or shallow-merge when `merge` is true). */
  setHeaderFooter(config: Record<string, unknown>, merge = false): void {
    this.headerFooter = merge ? { ...this.headerFooter, ...config } : config;
    this.dirty = true;
  }

  // ── Menus ─────────────────────────────────────────────────────────────────────

  upsertMenu(slug: string, menu: MenuGroup): void {
    this.menus.set(slug, { ...menu, slug });
    this.dirty = true;
  }

  getMenu(slug: string): MenuGroup | null {
    this.maybeReload();
    return this.menus.get(slug) ?? null;
  }

  getAllMenus(): Record<string, MenuGroup> {
    this.maybeReload();
    return Object.fromEntries(this.menus);
  }

  clearMenus(): void {
    this.menus.clear();
    this.dirty = true;
  }

  // ── Sections (URL → collection mapping, for section bindings) ──────────────────

  upsertSection(urlPath: string, section: SectionConfig): void {
    const key = sectionKey(urlPath);
    this.sections.set(key, { ...section, section_url: key });
    this.dirty = true;
  }

  getSection(urlPath: string): SectionConfig | null {
    this.maybeReload();
    return this.sections.get(sectionKey(urlPath)) ?? null;
  }

  /**
   * Resolve a URL path to a section config. Tries an exact match, then the first
   * path segment (so "/news/politics" → "news"), then a scan by `section_url`.
   */
  getSectionByUrlPath(urlPath: string): SectionConfig | null {
    this.maybeReload();
    const key = sectionKey(urlPath);
    if (!key) return null;

    const exact = this.sections.get(key);
    if (exact) return exact;

    const firstSeg = key.split("/")[0];
    if (firstSeg && firstSeg !== key) {
      const seg = this.sections.get(firstSeg);
      if (seg) return seg;
    }

    for (const section of this.sections.values()) {
      if (section.section_url === key || section.section_url === firstSeg) {
        return section;
      }
    }
    return null;
  }

  getAllSections(): Record<string, SectionConfig> {
    this.maybeReload();
    return Object.fromEntries(this.sections);
  }

  clearSections(): void {
    this.sections.clear();
    this.dirty = true;
  }

  deleteSection(urlPath: string): void {
    this.sections.delete(sectionKey(urlPath));
    this.dirty = true;
  }

  // ── Single deletes (used by /api/sync/update) ─────────────────────────────────

  deleteRoute(urlPattern: string): void {
    this.routes.delete(normalizeSlug(urlPattern));
    this.dirty = true;
  }

  deletePage(pageId: string): void {
    this.pages.delete(pageId);
    for (const [slug, id] of this.pagesBySlug) {
      if (id === pageId) this.pagesBySlug.delete(slug);
    }
    this.dirty = true;
  }

  deleteSectionMeta(ownerId: string): void {
    this.sectionMetas.delete(ownerId);
    for (const [slug, id] of this.sectionMetasBySlug) {
      if (id === ownerId) this.sectionMetasBySlug.delete(slug);
    }
    this.dirty = true;
  }

  deleteMenu(slug: string): void {
    this.menus.delete(slug);
    this.dirty = true;
  }

  // ── Bulk / meta ──────────────────────────────────────────────────────────────

  bulkSync(opts: {
    routes?: RouteConfig[];
    pages?: Record<string, PageJSON>;
    sectionMetas?: Record<string, SectionMeta>;
    menus?: Record<string, MenuGroup>;
    sections?: Record<string, SectionConfig>;
    clearExisting?: boolean;
  }): void {
    if (opts.clearExisting) {
      this.routes.clear();
      this.pages.clear();
      this.pagesBySlug.clear();
      this.sectionMetas.clear();
      this.sectionMetasBySlug.clear();
      this.menus.clear();
      this.sections.clear();
    }
    for (const route of opts.routes ?? []) this.upsertRoute(route);
    for (const [id, page] of Object.entries(opts.pages ?? {})) {
      this.upsertPage(id, page);
    }
    for (const [id, meta] of Object.entries(opts.sectionMetas ?? {})) {
      this.upsertSectionMeta(id, meta);
    }
    for (const [slug, menu] of Object.entries(opts.menus ?? {})) {
      this.upsertMenu(slug, menu);
    }
    for (const [key, section] of Object.entries(opts.sections ?? {})) {
      this.upsertSection(key, section);
    }
  }

  clearPages(): void {
    this.pages.clear();
    this.pagesBySlug.clear();
    this.dirty = true;
  }

  clearRoutes(): void {
    this.routes.clear();
    this.dirty = true;
  }

  stats() {
    this.maybeReload();
    return {
      routes: this.routes.size,
      pages: this.pages.size,
      sectionMetas: this.sectionMetas.size,
      menus: this.menus.size,
      sections: this.sections.size,
      articleTemplates: this.articleTemplates.size,
      adCodes: Object.keys(this.adCodes).length,
      vuukleSettings: Object.keys(this.vuukleSettings).length,
      taboolaSettings: Object.keys(this.taboolaSettings).length,
      layoutCodes: Object.keys(this.layoutCodes).length,
      socialMetas: this.socialMetas.size,
      websiteSettings: this.websiteSettings.size,
      customSchemaScripts: this.customSchemaScripts.size,
      menuHeaderCodes: this.menuHeaderCodes.size,
      headerFooter: Object.keys(this.headerFooter).length,
      lastSync: this.lastSync,
      dirty: this.dirty,
      persistPath: this.persistPath,
    };
  }

  reload(): void {
    this.loadFromDisk();
  }
}

// ── Pattern matching (shared with route-resolver) ──────────────────────────────

function safeDecode(str: string): string {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
}

function staticSegmentCount(pattern: string): number {
  return pattern
    .split("/")
    .filter(Boolean)
    .filter((s) => !(s.startsWith("{") || s.startsWith(":"))).length;
}

/**
 * Does `pattern` match `slug`? Supports {param}/:param dynamic segments.
 * A 5-segment pattern matches any URL with ≥5 segments (dinamani parity).
 */
export function matchPattern(pattern: string, slug: string): boolean {
  if (!pattern || !slug) return false;
  const p = safeDecode(pattern);
  const s = safeDecode(slug);
  if (p === s) return true;
  if (!isDynamicPattern(p)) return false;

  const pSegs = p.split("/").filter(Boolean);
  const sSegs = s.split("/").filter(Boolean);

  if (pSegs.length === 5) {
    if (sSegs.length < 5) return false;
  } else if (pSegs.length !== sSegs.length) {
    return false;
  }

  for (let i = 0; i < pSegs.length; i++) {
    const ps = pSegs[i];
    if ((ps.startsWith("{") && ps.endsWith("}")) || ps.startsWith(":")) continue;
    if (ps !== sSegs[i]) return false;
  }
  return true;
}

// ── Singleton ──────────────────────────────────────────────────────────────────

// Stash on globalThis so it survives module re-evaluation (dev/Turbopack HMR).
const GLOBAL_KEY = Symbol.for("kannada-prabha.builder.store");
type GlobalWithStore = typeof globalThis & { [GLOBAL_KEY]?: LocalStore };

export function getStore(): LocalStore {
  const g = globalThis as GlobalWithStore;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = new LocalStore(STORE_PATH);
  }
  return g[GLOBAL_KEY];
}
