import "server-only";

/**
 * Server-only builder configuration. Reads secrets/URLs straight from
 * `process.env` at runtime — NEVER expose these via next.config.ts `env:`
 * (that block is inlined into the client bundle in plaintext).
 */

import path from "node:path";
import os from "node:os";

/** Base URL of the custom builder API (domain differs per site). */
export const BUILDER_API_URL = (
  process.env.BUILDER_API_URL || "https://api.kannada.mo.vc"
).replace(/\/+$/, "");

/** Shared secret required on every sync (push/pull) request. */
export const SYNC_API_KEY = process.env.SYNC_API_KEY || "";

/**
 * Where the local store persists. Defaults to a writable temp path so it works
 * under `output: "standalone"` and read-only app dirs. For local dev you can
 * point this at `src/data/store.json` to keep a committed seed.
 */
export const STORE_PATH =
  process.env.BUILDER_STORE_PATH ||
  path.join(os.tmpdir(), "kannada-prabha-builder-store.json");

/**
 * The site's main menu comes from the Quintype menu-groups API (same as
 * dinamani), not the builder. Configurable via MENU_API_BASE_URL.
 */
export const MENU_GROUPS_URL = `${(
  process.env.MENU_API_BASE_URL || "https://www.kannadaprabha.com"
).replace(/\/+$/, "")}/api/v1/menu-groups`;

/** Which menu-group slug feeds the header nav. */
export const HEADER_MENU_SLUG = process.env.HEADER_MENU_SLUG || "default";

/** Base for Quintype collection endpoints (used when binding a URL slug). */
export const COLLECTIONS_BASE = (
  process.env.QUINTYPE_API_BASE_URL || "https://www.kannadaprabha.com"
).replace(/\/+$/, "");

/**
 * Periodic (background) pull interval in ms. 0 (default) disables it — pull then
 * only happens on demand via POST /api/sync/pull. Recommended ≥ 60000.
 */
export const PULL_INTERVAL_MS = Number(process.env.BUILDER_PULL_INTERVAL_MS || 0);

/**
 * Fast background poll (ms) that refreshes ONLY the dynamic header/footer config,
 * so builder edits to the site chrome appear within this window without a full
 * pull. 0 (default) disables it. Recommended 15000–60000. The instant path is the
 * builder pushing to POST /api/sync/header-footer; this poll is the backstop.
 */
export const HEADER_FOOTER_POLL_MS = Number(
  process.env.HEADER_FOOTER_POLL_MS || 0,
);

/**
 * Endpoint the pull uses for section → collection mappings. If it isn't
 * available, the pull derives sections from the section-meta records instead.
 */
export const BUILDER_SECTIONS_URL =
  process.env.BUILDER_SECTIONS_URL || `${BUILDER_API_URL}/api/sections/public`;

/** Builder public GET endpoints used by the pull sync. */
export const BUILDER_ENDPOINTS = {
  routes: `${BUILDER_API_URL}/api/url-routing/public/config`,
  pageList: `${BUILDER_API_URL}/api/pages/public`,
  pageById: (id: string) => `${BUILDER_API_URL}/api/pages/public/${id}`,
  sectionMetas: `${BUILDER_API_URL}/api/section-meta/public`,
  sections: BUILDER_SECTIONS_URL,
  menuGroups: MENU_GROUPS_URL,
  socialMetas:
    process.env.BUILDER_SOCIAL_META_URL ||
    `${BUILDER_API_URL}/api/social-meta/public`,
  websiteSettings:
    process.env.BUILDER_WEBSITE_SETTINGS_URL ||
    `${BUILDER_API_URL}/api/website-settings/public`,
  customSchemas:
    process.env.BUILDER_CUSTOM_SCHEMA_URL ||
    `${BUILDER_API_URL}/api/custom-schema-script/public`,
  menuHeaderCodes:
    process.env.BUILDER_MENU_HEADER_CODES_URL ||
    `${BUILDER_API_URL}/api/menu-header-codes/public`,
  adCodes:
    process.env.BUILDER_AD_CODES_URL ||
    `${BUILDER_API_URL}/api/ad-codes/public`,
  articleTemplates:
    process.env.BUILDER_ARTICLE_TEMPLATES_URL ||
    `${BUILDER_API_URL}/api/article-templates/public`,
  // Taboola settings have no public endpoint — they're served from the builder's
  // authenticated sync endpoint (same shape we expose locally). The pull sends
  // the SYNC_API_KEY as `x-api-key`.
  taboolaSettings:
    process.env.BUILDER_TABOOLA_SETTINGS_URL ||
    `${BUILDER_API_URL}/api/sync/taboola-settings`,
  // Layout ad-codes (GAM/GPT) are likewise served only from the authenticated
  // sync endpoint; the pull sends the SYNC_API_KEY as `x-api-key`.
  layoutCodes:
    process.env.BUILDER_LAYOUT_CODES_URL ||
    `${BUILDER_API_URL}/api/sync/layout-codes`,
  headerFooter: `${BUILDER_API_URL}/api/header-footer/public`,
} as const;
