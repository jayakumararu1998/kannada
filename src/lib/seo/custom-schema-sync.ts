import "server-only";

/**
 * Extract the `customSchemaScripts` carried on a social-meta record into the
 * custom-schema store, scoped to that record's page URL (dinamani parity).
 * Stored under deterministic ids `_socialmeta_<slug>_<entryId>` so a re-sync can
 * cleanly replace this page's schemas without touching global ones.
 */

import type { LocalStore } from "@/lib/builder/store";
import type { SocialMetaConfig } from "@/lib/builder/types";

export function syncSocialMetaSchemas(
  store: LocalStore,
  slug: string,
  meta: SocialMetaConfig,
): void {
  const prefix = `_socialmeta_${slug}_`;

  // Drop this page's previously-synced schemas so removals take effect.
  for (const id of Object.keys(store.getAllCustomSchemaScripts())) {
    if (id.startsWith(prefix)) store.deleteCustomSchemaScript(id);
  }

  const pageUrl = meta.pageUrl || `/${slug}`;

  // Editor-authored raw JSON-LD scripts.
  for (const entry of meta.customSchemaScripts ?? []) {
    const entryId = String(entry.id ?? entry.label ?? "");
    if (!entryId || !entry.script) continue;
    const storeId = `${prefix}${entryId}`;
    store.upsertCustomSchemaScript(storeId, {
      ...entry,
      id: storeId,
      pageUrl,
      enabled: entry.enabled !== false,
    });
  }

  // Structured ItemList schemas the builder attaches as objects (single +
  // array). Serialize each into a page-scoped script so it renders too.
  const itemLists: unknown[] = [
    ...(meta.itemListSchema != null ? [meta.itemListSchema] : []),
    ...(Array.isArray(meta.itemListSchemas) ? meta.itemListSchemas : []),
  ];
  itemLists.forEach((schema, i) => {
    if (schema == null || typeof schema !== "object") return;
    const storeId = `${prefix}itemlist_${i}`;
    store.upsertCustomSchemaScript(storeId, {
      id: storeId,
      pageUrl,
      enabled: true,
      script: JSON.stringify(schema),
    });
  });
}
