/**
 * Global positional ad codes (top / lhs / rhs / sticky / anchor), per page type.
 *
 * Builder shape (real): the synced config nests one or more ad-code GROUPS; the
 * `default` group holds keys `{pageType}{Position}Ad{Device}` plus a per-slot
 * status flag `{pageType}{Position}AdStatus`, e.g.
 *   { default: { homepageTopAdDesktop, homepageTopAdMobile, homepageTopAdStatus,
 *                sectionPageAnchorAdDesktop, articlePageStickyAdMobile, … } }
 * pageType ∈ homepage | sectionPage | articlePage; position ∈ top|lhs|rhs|
 * sticky|anchor. A slot renders only when its status is not explicitly false.
 *
 * Also tolerates flatter shapes ({topAdDesktop…} / {top:{desktop,mobile}}) so
 * simpler configs still work.
 */

export type AdPosition =
  | "top"
  | "lhs"
  | "rhs"
  | "sticky"
  | "anchor"
  | "interstitial";
export type PageType = "homepage" | "sectionPage" | "articlePage";

export const AD_POSITIONS: AdPosition[] = [
  "top",
  "lhs",
  "rhs",
  "sticky",
  "anchor",
  "interstitial",
];

export const AD_PLACEHOLDER: Record<
  AdPosition,
  { width: number; height: number }
> = {
  top: { width: 728, height: 90 },
  lhs: { width: 160, height: 600 },
  rhs: { width: 160, height: 600 },
  sticky: { width: 728, height: 90 },
  anchor: { width: 0, height: 0 },
  // Out-of-page 1x1 full-page format — GPT positions it, no inline box.
  interstitial: { width: 0, height: 0 },
};

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v : undefined;
}

/**
 * Find a group value by scanning keys for `{pageType}…{position}…Ad{device}`
 * (case-insensitive, allowing extra chars — so `homepageInterstitial1x1AdDesktop`
 * matches position "interstitial"). Used as a fallback when the exact key name
 * differs from the convention.
 */
function scanKey(
  group: Record<string, unknown>,
  pageType: string,
  position: string,
  device: "Desktop" | "Mobile",
): string | undefined {
  const re = new RegExp(`^${pageType}.*${position}.*Ad${device}$`, "i");
  for (const [k, v] of Object.entries(group)) {
    if (re.test(k)) {
      const s = str(v);
      if (s) return s;
    }
  }
  return undefined;
}

/** True when an object has any `{…}AdDesktop`/`{…}AdMobile` key. */
function isGroup(o: unknown): boolean {
  return (
    !!o &&
    typeof o === "object" &&
    Object.keys(o as object).some((k) => /Ad(Desktop|Mobile)$/.test(k))
  );
}

/** Pick the ad-code group object from the synced config. */
function pickGroup(
  config: Record<string, unknown> | undefined | null,
): Record<string, unknown> {
  if (!config || typeof config !== "object") return {};
  if (isGroup(config)) return config;
  const def = config.default;
  if (isGroup(def)) return def as Record<string, unknown>;
  for (const v of Object.values(config)) {
    if (isGroup(v)) return v as Record<string, unknown>;
  }
  return (def as Record<string, unknown>) ?? config;
}

/** Does a `specificPageAds` entry apply to `pathname`? Matches by any of the
 *  common URL/slug fields the builder might use. */
function entryMatchesPath(entry: Record<string, unknown>, pathname: string): boolean {
  const norm = (s: string) => "/" + s.replace(/^https?:\/\/[^/]+/, "").replace(/^\/+|\/+$/g, "");
  const target = norm(pathname);
  for (const k of ["url", "path", "slug", "pageUrl", "pageSlug", "sectionUrl"]) {
    const v = entry[k];
    if (typeof v === "string" && v && norm(v) === target) return true;
  }
  return false;
}

/**
 * Resolve the effective ad group for a page: the base group, overlaid with a
 * matching `specificPageAds` entry when `hasSpecificPageAds` is set. Returns
 * null when the whole config is inactive (`isActive === false`).
 */
function effectiveGroup(
  config: Record<string, unknown> | undefined | null,
  pathname?: string,
): Record<string, unknown> | null {
  const group = pickGroup(config);
  if (group.isActive === false) return null;

  if (group.hasSpecificPageAds && pathname && Array.isArray(group.specificPageAds)) {
    const match = (group.specificPageAds as unknown[]).find(
      (e) => e && typeof e === "object" && entryMatchesPath(e as Record<string, unknown>, pathname),
    );
    if (match) return { ...group, ...(match as Record<string, unknown>) };
  }
  return group;
}

/**
 * Resolve `{ desktop, mobile }` for a position on a page type. Returns `{}` when
 * the slot's status is explicitly false (disabled in the builder) or no code is
 * configured.
 */
export function resolveAdCode(
  config: Record<string, unknown> | undefined | null,
  position: AdPosition,
  pageType: PageType = "sectionPage",
): { desktop?: string; mobile?: string } {
  const group = pickGroup(config);
  const P = cap(position);

  // Explicit disable via status flag (tolerant of naming variants).
  let status: unknown = group[`${pageType}${P}AdStatus`];
  if (status === undefined) {
    const sre = new RegExp(`^${pageType}.*${position}.*AdStatus$`, "i");
    for (const [k, v] of Object.entries(group)) {
      if (sre.test(k)) {
        status = v;
        break;
      }
    }
  }
  if (status === false) return {};

  const desktop =
    str(group[`${pageType}${P}AdDesktop`]) ??
    // page-type-agnostic fallbacks (simpler configs / my test shape)
    str(group[`${position}AdDesktop`]) ??
    str(group[`${position}Desktop`]) ??
    (() => {
      const n = group[position];
      return n && typeof n === "object"
        ? str((n as Record<string, unknown>).desktop)
        : undefined;
    })() ??
    // Tolerant scan (naming variants like Interstitial1x1).
    scanKey(group, pageType, position, "Desktop");
  const mobile =
    str(group[`${pageType}${P}AdMobile`]) ??
    str(group[`${position}AdMobile`]) ??
    str(group[`${position}Mobile`]) ??
    (() => {
      const n = group[position];
      return n && typeof n === "object"
        ? str((n as Record<string, unknown>).mobile)
        : undefined;
    })() ??
    scanKey(group, pageType, position, "Mobile");

  return { desktop, mobile };
}

/** True when any position has a usable ad code for the page type. */
export function hasAnyAdCode(
  config: Record<string, unknown> | undefined | null,
  pageType: PageType = "sectionPage",
): boolean {
  return getAdPlacements(config, pageType).length > 0;
}

/** A resolved ad slot to render: its raw position, a `kind` bucket that decides
 *  placement (known position or "generic"), and the device codes. */
export interface AdPlacement {
  position: string;
  kind: AdPosition | "generic";
  desktop?: string;
  mobile?: string;
}

/** Bucket a raw position name (e.g. "Interstitial1x1", "MidBanner") to a known
 *  layout slot, or "generic" for anything new. */
export function classify(pos: string): AdPosition | "generic" {
  const p = pos.toLowerCase();
  if (p.includes("interstit")) return "interstitial";
  if (p.includes("anchor")) return "anchor";
  if (p.includes("sticky")) return "sticky";
  if (p.includes("lhs") || p.includes("left")) return "lhs";
  if (p.includes("rhs") || p.includes("right")) return "rhs";
  if (p.includes("top") || p.includes("billboard") || p.includes("leaderboard"))
    return "top";
  return "generic";
}

/**
 * Discover EVERY ad slot configured for a page type — so any code added in the
 * builder renders, without needing a hard-coded position list. Scans the group
 * for `{pageType}<Position>Ad{Desktop|Mobile}` keys, honours the matching
 * `…AdStatus` flag, and returns one placement per distinct position.
 */
export function getAdPlacements(
  config: Record<string, unknown> | undefined | null,
  pageType: PageType = "sectionPage",
  pathname?: string,
): AdPlacement[] {
  const group = effectiveGroup(config, pathname);
  if (!group) return []; // inactive config
  const re = new RegExp(`^${pageType}(.+)Ad(Desktop|Mobile)$`);
  const out = new Map<string, AdPlacement>();

  for (const key of Object.keys(group)) {
    const m = key.match(re);
    if (!m) continue;
    const rawPos = m[1]; // e.g. "Top", "Interstitial1x1"
    const posKey = rawPos.toLowerCase();
    if (out.has(posKey)) continue;

    if (group[`${pageType}${rawPos}AdStatus`] === false) continue;
    const desktop = str(group[`${pageType}${rawPos}AdDesktop`]);
    const mobile = str(group[`${pageType}${rawPos}AdMobile`]);
    if (!desktop && !mobile) continue;

    out.set(posKey, { position: posKey, kind: classify(rawPos), desktop, mobile });
  }
  return [...out.values()];
}
