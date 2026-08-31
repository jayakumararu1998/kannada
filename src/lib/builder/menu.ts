import "server-only";

/**
 * Read helpers for the dynamic header menu. Builds a nested nav tree from the
 * stored menu-group (flat items linked by parentId), sorted by rank.
 */

import { HEADER_MENU_SLUG } from "./config";
import { getStore } from "./store";
import type { MenuItem } from "./types";

export interface NavItem {
  title: string;
  url: string;
  target?: "_self" | "_blank";
  children: NavItem[];
}

function buildTree(items: MenuItem[]): NavItem[] {
  const byId = new Map<string, NavItem & { _parent: string | null }>();
  const roots: (NavItem & { _parent: string | null })[] = [];

  const ordered = [...items].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
  for (const item of ordered) {
    byId.set(String(item.id ?? item.title), {
      title: item.title,
      url: item.url,
      target: item.target,
      children: [],
      _parent: item.parentId != null ? String(item.parentId) : null,
    });
  }
  for (const node of byId.values()) {
    const parent = node._parent ? byId.get(node._parent) : null;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  // Strip the internal _parent field.
  const clean = (n: NavItem & { _parent?: string | null }): NavItem => ({
    title: n.title,
    url: n.url,
    target: n.target,
    children: n.children.map(clean),
  });
  return roots.map(clean);
}

/** Header nav items (top-level, with children) from the configured menu slug. */
export function getHeaderMenu(slug: string = HEADER_MENU_SLUG): NavItem[] {
  const group = getStore().getMenu(slug);
  if (!group?.items?.length) return [];
  return buildTree(group.items);
}
