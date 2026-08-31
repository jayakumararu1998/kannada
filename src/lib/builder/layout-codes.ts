/**
 * GAM/GPT "layout codes" → renderable ad placements.
 *
 * Unlike the older positional `adCodes` (one code blob per position, resolved by
 * key-name convention — see `ad-codes.ts`), a layout code is a named entry with
 * SEPARATE header (`googletag.defineSlot(…)`) and body (`<div id> + display()`)
 * snippets, per page type and per device, plus AMP variants. Builder shape:
 *
 *   {
 *     name, slug, scope: "page_based" | …,
 *     headerCode, bodyCode,                        // generic (non page-based)
 *     homepageHeaderCode, homepageBodyCode,        // desktop, per page type
 *     sectionPageHeaderCode, sectionPageBodyCode,
 *     articlePageHeaderCode, articlePageBodyCode,
 *     hasSeparateMobileCode,
 *     mobileHeaderCode, mobileBodyCode,            // generic mobile
 *     mobileHomepageHeaderCode, … mobileArticlePageBodyCode,
 *     isAmpEnabled, ampHeaderCode, ampBodyCode, …
 *     isAdCode, isActive
 *   }
 *
 * We concatenate `header + body` for each device and hand the result to the SAME
 * `AdInject`/`RawEmbed` renderer the positional ads use — gpt.js is already in
 * the <head>, so `defineSlot` (header) then `display` (body) run off the shared
 * `googletag.cmd` queue. The entry's name/slug is bucketed to a layout slot
 * (`classify`), so e.g. "Interstitial_1x1" renders as a GPT out-of-page slot.
 */

import { classify, type AdPlacement, type PageType } from "./ad-codes";

/** Desktop field prefix for a page type (matches the builder's key names). */
const PREFIX: Record<PageType, string> = {
  homepage: "homepage",
  sectionPage: "sectionPage",
  articlePage: "articlePage",
};

function str(v: unknown): string {
  return typeof v === "string" && v.trim() ? v : "";
}
function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** `header + body`, skipping blank halves. Empty when both are blank. */
function joinCode(header: unknown, body: unknown): string {
  return [str(header), str(body)].filter(Boolean).join("\n");
}

/**
 * Resolve every ACTIVE layout code into an `AdPlacement` for the page type.
 * Falls back to the generic (`headerCode`/`bodyCode`) snippet when the entry is
 * not page-based or the page-type snippet is empty. Mobile code is only set when
 * the entry opts into a separate mobile code AND that code is non-empty — so
 * `AdInject` cleanly falls back to the desktop code on mobile otherwise.
 */
export function getLayoutCodePlacements(
  codes: Record<string, unknown> | undefined | null,
  pageType: PageType = "sectionPage",
): AdPlacement[] {
  if (!codes || typeof codes !== "object") return [];
  const prefix = PREFIX[pageType];
  const Prefix = cap(prefix);
  const out: AdPlacement[] = [];

  for (const [slug, raw] of Object.entries(codes)) {
    if (!raw || typeof raw !== "object") continue;
    const e = raw as Record<string, unknown>;
    if (e.isActive === false) continue;

    // Desktop: page-type snippet, else the generic (non page-based) snippet.
    const desktop =
      joinCode(e[`${prefix}HeaderCode`], e[`${prefix}BodyCode`]) ||
      joinCode(e.headerCode, e.bodyCode);
    if (!desktop) continue;

    // Mobile: only when the entry carries a separate, non-empty mobile snippet.
    let mobile: string | undefined;
    if (e.hasSeparateMobileCode) {
      const m =
        joinCode(e[`mobile${Prefix}HeaderCode`], e[`mobile${Prefix}BodyCode`]) ||
        joinCode(e.mobileHeaderCode, e.mobileBodyCode);
      if (m) mobile = m;
    }

    const rawPos = str(e.name) || slug;
    out.push({ position: slug, kind: classify(rawPos), desktop, mobile });
  }
  return out;
}

/** True when any active layout code renders for the page type. */
export function hasAnyLayoutCode(
  codes: Record<string, unknown> | undefined | null,
  pageType: PageType = "sectionPage",
): boolean {
  return getLayoutCodePlacements(codes, pageType).length > 0;
}
