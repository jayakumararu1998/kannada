import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";

import { validateApiKey } from "@/lib/builder/api-key";
import { getStore, segmentCount } from "@/lib/builder/store";
import { syncSocialMetaSchemas } from "@/lib/seo/custom-schema-sync";
import type {
  ArticleTemplateConfig,
  CustomSchemaScript,
  MenuGroup,
  MenuHeaderCodeConfig,
  PageJSON,
  RouteConfig,
  SectionMeta,
  SocialMetaConfig,
  WebsiteSettingConfig,
} from "@/lib/builder/types";

import { json, preflight, unauthorized } from "../_shared";

export const dynamic = "force-dynamic";

type EntityType =
  | "page"
  | "route"
  | "menu"
  | "sectionMeta"
  | "articleTemplate"
  | "vuukleSettings"
  | "taboolaSettings"
  | "layoutCode"
  | "socialMeta"
  | "websiteSetting"
  | "customSchema"
  | "menuHeaderCode";

const TYPE_ALIASES: Record<string, EntityType> = {
  page: "page",
  pages: "page",
  route: "route",
  routes: "route",
  menu: "menu",
  menus: "menu",
  "section-meta": "sectionMeta",
  "section-metas": "sectionMeta",
  sectionmeta: "sectionMeta",
  sectionmetas: "sectionMeta",
  "article-template": "articleTemplate",
  "article-templates": "articleTemplate",
  articletemplate: "articleTemplate",
  articletemplates: "articleTemplate",
  article_template: "articleTemplate",
  "vuukle-settings": "vuukleSettings",
  "vuukle-setting": "vuukleSettings",
  vuuklesettings: "vuukleSettings",
  vuukle: "vuukleSettings",
  "taboola-settings": "taboolaSettings",
  "taboola-setting": "taboolaSettings",
  taboolasettings: "taboolaSettings",
  taboola: "taboolaSettings",
  "layout-codes": "layoutCode",
  "layout-code": "layoutCode",
  layoutcodes: "layoutCode",
  layoutcode: "layoutCode",
  layout: "layoutCode",
  "social-meta": "socialMeta",
  "social-metas": "socialMeta",
  socialmeta: "socialMeta",
  socialmetas: "socialMeta",
  "website-setting": "websiteSetting",
  "website-settings": "websiteSetting",
  websitesetting: "websiteSetting",
  websitesettings: "websiteSetting",
  "custom-schema": "customSchema",
  "custom-schemas": "customSchema",
  customschema: "customSchema",
  customschemas: "customSchema",
  "custom-schema-script": "customSchema",
  "menu-header-code": "menuHeaderCode",
  "menu-header-codes": "menuHeaderCode",
  menuheadercode: "menuHeaderCode",
  menuheadercodes: "menuHeaderCode",
};

export async function OPTIONS() {
  return preflight();
}

/**
 * Single-item sync: upsert or delete one page/route/menu/section-meta.
 * Body: { type, action?: "upsert"|"delete", id?, data? }
 *  - the entity can be passed as `data`, under its type key, or as `item`.
 */
export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorized(request);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ success: false, error: "Invalid JSON body" }, 400);
  }

  const rawType = String(body.type ?? "").toLowerCase();
  const type = TYPE_ALIASES[rawType];
  if (!type) {
    return json(
      {
        success: false,
        error: `Unknown type '${body.type}'. Use one of: page, route, menu, section-meta, article-template, vuukle-settings, taboola-settings, layout-codes, social-meta, website-setting, custom-schema, menu-header-code.`,
      },
      400,
    );
  }

  const action = body.action === "delete" ? "delete" : "upsert";
  const data = (body.data ??
    body[type] ??
    body[rawType] ??
    body.item ??
    {}) as Record<string, unknown>;
  const id = body.id != null ? String(body.id) : undefined;

  const store = getStore();
  store.beginSync();
  try {
    switch (type) {
      case "page": {
        const pageId = id ?? (data.page_id != null ? String(data.page_id) : "");
        if (!pageId) throw new Error("page requires id / page_id");
        if (action === "delete") store.deletePage(pageId);
        else store.upsertPage(pageId, { ...(data as PageJSON), page_id: pageId });
        break;
      }
      case "route": {
        const key =
          id ?? (data.url_pattern != null ? String(data.url_pattern) : "");
        if (action === "delete") {
          if (!key) throw new Error("route delete requires id / url_pattern");
          store.deleteRoute(key);
        } else {
          if (!data.url_pattern) throw new Error("route requires url_pattern");
          const route = data as unknown as RouteConfig;
          store.upsertRoute({
            ...route,
            segment_count: segmentCount(route.url_pattern),
          });
        }
        break;
      }
      case "menu": {
        const slug = id ?? (data.slug != null ? String(data.slug) : "");
        if (!slug) throw new Error("menu requires id / slug");
        if (action === "delete") store.deleteMenu(slug);
        else store.upsertMenu(slug, { ...(data as unknown as MenuGroup), slug });
        break;
      }
      case "sectionMeta": {
        const ownerId =
          id ??
          (data.ownerId != null
            ? String(data.ownerId)
            : data.id != null
              ? String(data.id)
              : "");
        if (!ownerId) throw new Error("sectionMeta requires id / ownerId");
        if (action === "delete") store.deleteSectionMeta(ownerId);
        else store.upsertSectionMeta(ownerId, data as SectionMeta);
        break;
      }
      case "articleTemplate": {
        const key =
          id ??
          String(
            data.templateType ??
              data["template-type"] ??
              data.type ??
              data["story-template"] ??
              data.slug ??
              "",
          );
        if (!key)
          throw new Error("articleTemplate requires id / templateType");
        if (action === "delete") store.deleteArticleTemplate(key);
        else
          store.upsertArticleTemplate(key, {
            ...(data as ArticleTemplateConfig),
            templateType: key,
          });
        break;
      }
      case "vuukleSettings": {
        const slug =
          id ?? (data.slug != null ? String(data.slug) : "default");
        if (action === "delete") store.setVuukleSettings(slug, null);
        else store.setVuukleSettings(slug, { ...data, slug });
        break;
      }
      case "taboolaSettings": {
        const slug =
          id ?? (data.slug != null ? String(data.slug) : "default");
        if (action === "delete") store.setTaboolaSettings(slug, null);
        // Store the `{ slug, config }` entry — `data` may be the bare config or
        // already `{ slug, config }`; normalise to a config wrapper either way.
        else {
          const config = data.config ?? data;
          store.setTaboolaSettings(slug, { slug, config });
        }
        break;
      }
      case "layoutCode": {
        const slug = id ?? (data.slug != null ? String(data.slug) : "");
        if (!slug) {
          return json({ success: false, error: "Missing slug." }, 400);
        }
        if (action === "delete") store.setLayoutCode(slug, null);
        // `data` may be the bare entry or a `{ layoutCode }` wrapper.
        else {
          const entry = (data.layoutCode ?? data) as Record<string, unknown>;
          store.setLayoutCode(slug, { ...entry, slug });
        }
        break;
      }
      case "socialMeta": {
        const slug =
          id ??
          (data.slug != null
            ? String(data.slug)
            : data.id != null
              ? String(data.id)
              : "");
        if (!slug) throw new Error("socialMeta requires id / slug");
        if (action === "delete") {
          store.deleteSocialMeta(slug);
        } else {
          const meta = { ...(data as SocialMetaConfig), slug };
          store.upsertSocialMeta(slug, meta);
          syncSocialMetaSchemas(store, slug, meta);
        }
        break;
      }
      case "websiteSetting": {
        const slug =
          id ??
          String(data.slug ?? data.name ?? "");
        if (!slug) throw new Error("websiteSetting requires id / slug");
        if (action === "delete") store.deleteWebsiteSetting(slug);
        else store.upsertWebsiteSetting(slug, data as WebsiteSettingConfig);
        break;
      }
      case "customSchema": {
        const schemaId =
          id ?? String(data.id ?? data.label ?? "");
        if (!schemaId) throw new Error("customSchema requires id");
        if (action === "delete") store.deleteCustomSchemaScript(schemaId);
        else
          store.upsertCustomSchemaScript(schemaId, {
            ...(data as CustomSchemaScript),
            id: schemaId,
          });
        break;
      }
      case "menuHeaderCode": {
        const slug = id ?? String(data.slug ?? data.id ?? "");
        if (!slug) throw new Error("menuHeaderCode requires id / slug");
        if (action === "delete") store.deleteMenuHeaderCode(slug);
        else
          store.upsertMenuHeaderCode(slug, {
            ...(data as MenuHeaderCodeConfig),
            slug,
          });
        break;
      }
    }
  } catch (error) {
    store.endSync();
    return json({ success: false, error: (error as Error).message }, 400);
  }

  const persist = store.persist();
  store.endSync();
  revalidatePath("/", "layout");

  return json({ success: true, type, action, persist, store: store.stats() });
}
