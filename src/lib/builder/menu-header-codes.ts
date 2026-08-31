/**
 * Resolve which Menu Header Code slot applies to the current page (dinamani
 * parity, trimmed). Pure functions — safe on server (SSR) and client (SPA
 * re-resolution). A "menu header code" is an image/HTML banner rendered either
 * above the header or below the breaking-news bar; `scope` decides which pages
 * it applies to and where its slot comes from.
 */

import type {
  MenuHeaderCodeConfig,
  MenuHeaderPosition,
  MenuHeaderSlot,
} from "./types";

export type PageKind = "home" | "section" | "article";

export interface ActiveMenuHeaderBanner {
  slug: string;
  slot: MenuHeaderSlot;
}

/** Strip origin, ensure a single leading slash, drop the trailing slash. */
export function normalizePath(p: string): string {
  const s = "/" + String(p ?? "").replace(/^https?:\/\/[^/]+/, "").replace(/^\/+|\/+$/g, "");
  return s === "" ? "/" : s;
}

/** Classify a URL: home / article (deep, dated) / section (everything else). */
export function detectPageKind(pathname: string): PageKind {
  const path = normalizePath(pathname);
  if (path === "/") return "home";
  const segs = path.split("/").filter(Boolean);
  // Quintype articles look like /section/2026/Aug/12/headline (has a Y/Mon/D run).
  if (segs.length >= 4 || /\/\d{4}\/[A-Za-z]{3}\/\d{1,2}\//.test(path)) return "article";
  return "section";
}

/** Simple pattern match: exact, `*` wildcard, or `{param}`/`:param` segments. */
export function matchUrlPattern(pattern: string, pathname: string): boolean {
  const pat = normalizePath(pattern);
  const path = normalizePath(pathname);
  if (pat === path) return true;
  if (pat.includes("*")) {
    const re = new RegExp("^" + pat.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$");
    return re.test(path);
  }
  const pSegs = pat.split("/").filter(Boolean);
  const uSegs = path.split("/").filter(Boolean);
  if (pSegs.length !== uSegs.length) return false;
  return pSegs.every(
    (seg, i) => seg.startsWith("{") || seg.startsWith(":") || seg === uSegs[i],
  );
}

/** A slot renders only if it carries content. */
function slotHasContent(slot?: MenuHeaderSlot | null): slot is MenuHeaderSlot {
  if (!slot) return false;
  if (slot.type === "image") return !!slot.imageUrl;
  if (slot.type === "html") return !!(slot.html && slot.html.trim());
  // Untyped slot — accept whichever content it carries.
  return !!(slot.imageUrl || (slot.html && slot.html.trim()));
}

/** Prefer the mobile slot when the code opts into it and we're on mobile. */
function pickSlot(
  desktop: MenuHeaderSlot | undefined,
  mobile: MenuHeaderSlot | undefined,
  hasSeparateMobile: boolean,
  isMobile: boolean,
): MenuHeaderSlot | null {
  if (hasSeparateMobile && isMobile && slotHasContent(mobile)) return mobile!;
  return slotHasContent(desktop) ? desktop! : null;
}

/** Resolve the slot a single code contributes for the current page/device. */
export function resolveSlotForCode(
  code: MenuHeaderCodeConfig,
  pathname: string,
  pageKind: PageKind,
  isMobile: boolean,
): MenuHeaderSlot | null {
  if (code.isActive === false) return null;
  const hasMobile = code.hasSeparateMobile === true;

  switch (code.scope ?? "all_pages") {
    case "all_pages":
      return pickSlot(code.content, code.mobileContent, hasMobile, isMobile);

    case "page_based": {
      const desktop =
        pageKind === "home" ? code.homepageContent
          : pageKind === "section" ? code.sectionPageContent
            : code.articlePageContent;
      const mobile =
        pageKind === "home" ? code.mobileHomepageContent
          : pageKind === "section" ? code.mobileSectionPageContent
            : code.mobileArticlePageContent;
      return pickSlot(desktop, mobile, hasMobile, isMobile);
    }

    case "specific_page": {
      const norm = normalizePath(pathname);
      for (const entry of code.specificPageCodes ?? []) {
        if (
          entry.pageSlug &&
          (norm === normalizePath(`/${entry.pageSlug}`) ||
            norm.startsWith(normalizePath(`/${entry.pageSlug}`) + "/"))
        ) {
          return pickSlot(entry.content, entry.mobileContent, hasMobile, isMobile);
        }
      }
      return null;
    }

    case "url_based": {
      for (const entry of code.urlBasedCodes ?? []) {
        if (entry.urlPattern && matchUrlPattern(entry.urlPattern, pathname)) {
          return pickSlot(entry.content, entry.mobileContent, hasMobile, isMobile);
        }
      }
      return null;
    }

    default:
      return null;
  }
}

/** Every active banner for a position on the current page (slug order). */
export function getActiveMenuHeaderBanners(
  allCodes: Record<string, MenuHeaderCodeConfig>,
  pathname: string,
  isMobile: boolean,
  position: MenuHeaderPosition,
): ActiveMenuHeaderBanner[] {
  const pageKind = detectPageKind(pathname);
  const out: ActiveMenuHeaderBanner[] = [];
  for (const [slug, code] of Object.entries(allCodes)) {
    if (code.isActive === false) continue;
    if ((code.position || "below_breaking_news") !== position) continue;
    const slot = resolveSlotForCode(code, pathname, pageKind, isMobile);
    if (slot) out.push({ slug, slot });
  }
  return out.sort((a, b) => a.slug.localeCompare(b.slug));
}
