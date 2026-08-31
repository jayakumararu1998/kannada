/**
 * Dynamic Header / Footer — the builder stores ONE config (slug "default") with a
 * `header` and a `footer` block. This module holds the RAW builder shape, the
 * trimmed VIEW shapes the chrome components consume, and pure normalizers between
 * them. It has NO server-only guard so both the client Header/Footer (type-only
 * import) and the server SiteChrome (runtime normalize) can use it.
 *
 * Builder endpoint: GET {BUILDER_API_URL}/api/header-footer/public
 *   {
 *     slug,
 *     header: { logos, topBar, mainBar, navBar, buttons, dateTime, groupLinks,
 *               socialLinks },
 *     footer: { logo, groups, layout, quickLinks, recentNews, socialLinks,
 *               copyrightText, tagline, appLinks },
 *   }
 */

// ─────────────────────────────────────────────────────────────────────────────
// Raw builder shapes (only the fields we read; everything else is tolerated)
// ─────────────────────────────────────────────────────────────────────────────

interface RawLogo {
  url?: string;
  alt?: string;
}
interface RawLink {
  url?: string;
  label?: string;
  openInNewTab?: boolean;
}
interface RawButton {
  url?: string;
  label?: string;
  style?: string;
}
interface RawSocial {
  url?: string;
  platform?: string;
}
interface RawFooterGroup {
  title?: string;
  columns?: number;
  layout?: string;
  links?: RawLink[];
}
/** One builder-authored nav entry; children may arrive as `children` or `items`. */
interface RawNavItem {
  url?: string;
  label?: string;
  title?: string;
  openInNewTab?: boolean;
  children?: RawNavItem[];
  items?: RawNavItem[];
}

export interface RawHeaderFooterConfig {
  slug?: string;
  header?: {
    logos?: {
      mainLogo?: RawLogo | null;
      groupLogo?: RawLogo | null;
      /** Dark-mode logos (shown when `.dark` is active). */
      mainLogoDark?: RawLogo | null;
      groupLogoDark?: RawLogo | null;
    };
    topBar?: {
      enabled?: boolean;
      background?: string;
      textColor?: string;
      languageLinks?: RawLink[];
      showSocialLinks?: boolean;
    };
    mainBar?: {
      account?: {
        url?: string;
        label?: string;
        enabled?: boolean;
        showIcon?: boolean;
      };
      logoAlign?: string;
      showSearch?: boolean;
      showMenuButton?: boolean;
      showThemeToggle?: boolean;
    };
    navBar?: {
      items?: RawNavItem[];
      sticky?: boolean;
      enabled?: boolean;
      background?: string;
      textColor?: string;
      activeColor?: string;
      maxVisibleItems?: number;
    };
    buttons?: RawButton[];
    dateTime?: { enabled?: boolean; locale?: string; format?: string };
    groupLinks?: RawLink[];
    socialLinks?: RawSocial[];
  };
  footer?: {
    logo?: RawLogo | null;
    /** Dark-mode footer logo (shown when `.dark` is active). */
    logoDark?: RawLogo | null;
    groups?: RawFooterGroup[];
    quickLinks?: RawLink[];
    socialLinks?: RawSocial[];
    copyrightText?: string;
    tagline?: string;
    recentNews?: {
      enabled?: boolean;
      title?: string;
      columns?: number;
      count?: number;
      position?: string;
      categorySlug?: string | null;
      /** API endpoint the panel fetches its news list from. */
      apiUrl?: string;
      /** Dot/array path into the response to reach the items array. */
      dataPath?: string;
      source?: string;
      /** Override field paths: { title, url, image, date, summary } → API path. */
      fieldMapping?: Record<string, string>;
    };
    layout?: {
      linkColumns?: number;
      showTopDivider?: boolean;
      showLinkDividers?: boolean;
      bottomBarSeparator?: string;
      socialIconShape?: string;
      socialIconStyle?: string;
    };
  };
  [key: string]: unknown;
}

// ─────────────────────────────────────────────────────────────────────────────
// View shapes (what Header.tsx / Footer.tsx consume)
// ─────────────────────────────────────────────────────────────────────────────

/** Platforms the SocialIconsHeadeer component can render. */
export type SocialPlatform =
  | "facebook"
  | "x"
  | "instagram"
  | "youtube"
  | "whatsapp";

export interface SocialItem {
  platform: SocialPlatform;
  href: string;
  ariaLabel?: string;
}

export interface HeaderButton {
  label: string;
  url: string;
  style?: string;
}

/** A plain labelled link, shared by the header and footer views. */
export interface ChromeLink {
  label: string;
  url: string;
  openInNewTab?: boolean;
}

export type FooterLink = ChromeLink;
export type HeaderLink = ChromeLink;

/** A header nav entry, with optional one-level-plus dropdown children. */
export interface HeaderNavLink extends ChromeLink {
  children?: HeaderNavLink[];
}

/** Header top strip: date/time, language links, social icons. */
export interface HeaderTopBar {
  enabled: boolean;
  showSocialLinks: boolean;
  /** Builder colours — exposed for theming; not applied by default. */
  background?: string;
  textColor?: string;
  /** Undefined → the component keeps its built-in language list. */
  languageLinks?: HeaderLink[];
}

/** Header "my account" entry in the main bar. */
export interface HeaderAccount {
  enabled: boolean;
  showIcon: boolean;
  url: string;
  label?: string;
}

/** Header main bar: menu/search/theme toggles, logo, account, CTA buttons. */
export interface HeaderMainBar {
  showMenuButton: boolean;
  showSearch: boolean;
  showThemeToggle: boolean;
  logoAlign: "left" | "center" | "right";
  account: HeaderAccount;
}

/** Header category nav strip below the main bar. */
export interface HeaderNavBar {
  enabled: boolean;
  sticky: boolean;
  /** Cap on items rendered inline; the rest stay in the mega menu. */
  maxVisibleItems?: number;
  /** Builder colours — exposed for theming; not applied by default. */
  background?: string;
  textColor?: string;
  activeColor?: string;
  /** Builder-authored nav. Empty → the synced Quintype menu is used instead. */
  items?: HeaderNavLink[];
}

export interface HeaderView {
  logoUrl?: string;
  logoAlt?: string;
  /** Dark-mode logo (shown when `.dark` is active); falls back to `logoUrl`. */
  logoDarkUrl?: string;
  groupLogoUrl?: string;
  groupLogoAlt?: string;
  buttons?: HeaderButton[];
  dateTime?: { enabled?: boolean; locale?: string; format?: string };
  /** Header top-bar social icons. Undefined → component keeps its defaults. */
  social?: SocialItem[];
  /** Sister-site links from the builder (no slot in the current layout). */
  groupLinks?: HeaderLink[];
  topBar: HeaderTopBar;
  mainBar: HeaderMainBar;
  navBar: HeaderNavBar;
}

export interface FooterGroup {
  title?: string;
  columns?: number;
  links: FooterLink[];
}

/** One resolved news card in the footer "recent news" panel. */
export interface FooterNewsItem {
  title: string;
  url: string;
  imageUrl?: string;
  date?: string;
  summary?: string;
}

/** Footer "recent news" panel config (right side), driven by a builder API URL. */
export interface FooterRecentNews {
  enabled?: boolean;
  title?: string;
  columns?: number;
  count?: number;
  apiUrl?: string;
  dataPath?: string;
  source?: string;
  fieldMapping?: Record<string, string>;
  /** Resolved news list — filled server-side after fetching `apiUrl`. */
  items?: FooterNewsItem[];
}

export interface FooterView {
  logoUrl?: string;
  logoAlt?: string;
  /** Dark-mode logo (shown when `.dark` is active); falls back to `logoUrl`. */
  logoDarkUrl?: string;
  groups: FooterGroup[];
  quickLinks: FooterLink[];
  social?: SocialItem[];
  copyrightText?: string;
  /** Separator rendered between bottom-bar quick links (e.g. "|"). */
  bottomBarSeparator?: string;
  showTopDivider?: boolean;
  recentNews?: FooterRecentNews;
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalizers
// ─────────────────────────────────────────────────────────────────────────────

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

/**
 * Fix the common UTF-8-decoded-as-latin1 mojibake (e.g. "Â©" → "©") that the
 * builder occasionally stores for symbols in free-text fields.
 */
function fixMojibake(s: string): string {
  return s.replace(/Â(?=[©®°±§¶·»«])/g, "");
}

/** Map a builder platform label ("X", "YouTube", …) to a renderable platform. */
function mapPlatform(platform: unknown): SocialPlatform | null {
  switch (String(platform ?? "").toLowerCase()) {
    case "x":
    case "twitter":
      return "x";
    case "youtube":
    case "yt":
      return "youtube";
    case "facebook":
    case "fb":
      return "facebook";
    case "whatsapp":
      return "whatsapp";
    case "instagram":
    case "ig":
      return "instagram";
    default:
      return null;
  }
}

/** Builder social links → renderable items (unknown platforms / empty urls dropped). */
function toSocial(links: RawSocial[] | undefined): SocialItem[] | undefined {
  if (!Array.isArray(links)) return undefined;
  const out: SocialItem[] = [];
  for (const link of links) {
    const platform = mapPlatform(link?.platform);
    const href = str(link?.url);
    if (platform && href) out.push({ platform, href });
  }
  return out.length ? out : undefined;
}

/** Builder links → footer links (drop entries with no usable url). */
function toLinks(links: RawLink[] | undefined): FooterLink[] {
  if (!Array.isArray(links)) return [];
  return links
    .map((l) => ({
      label: str(l?.label) ?? "",
      url: str(l?.url) ?? "",
      openInNewTab: l?.openInNewTab,
    }))
    .filter((l) => l.label && l.url);
}

/**
 * Like `toLinks` but keeps label-only entries (url → "#"). Header language and
 * group links are often authored as labels first, with URLs filled in later —
 * dropping them would silently fall back to the hard-coded list.
 */
function toLooseLinks(links: RawLink[] | undefined): ChromeLink[] | undefined {
  if (!Array.isArray(links)) return undefined;
  const out = links
    .map((l) => ({
      label: str(l?.label) ?? "",
      url: str(l?.url) ?? "#",
      openInNewTab: l?.openInNewTab,
    }))
    .filter((l) => l.label);
  return out.length ? out : undefined;
}

/** Builder nav items → nested header nav links (label-only entries kept). */
function toNavItems(items: RawNavItem[] | undefined): HeaderNavLink[] | undefined {
  if (!Array.isArray(items)) return undefined;
  const out = items
    .map((item) => {
      const children = toNavItems(item?.children ?? item?.items);
      return {
        label: str(item?.label) ?? str(item?.title) ?? "",
        url: str(item?.url) ?? "#",
        openInNewTab: item?.openInNewTab,
        ...(children ? { children } : {}),
      };
    })
    .filter((item) => item.label);
  return out.length ? out : undefined;
}

/** Builder logo align → the three values the header supports. */
function toLogoAlign(value: unknown): "left" | "center" | "right" {
  const align = String(value ?? "").toLowerCase();
  return align === "left" || align === "right" ? align : "center";
}

/** Unwrap a stored entry that may be `{ config }`-wrapped or the raw object. */
export function extractHeaderFooterConfig(
  entry: Record<string, unknown> | null | undefined,
): RawHeaderFooterConfig | null {
  if (!entry || typeof entry !== "object") return null;
  const config = (entry.config ?? entry) as RawHeaderFooterConfig;
  return config && typeof config === "object" ? config : null;
}

/** Raw config → HeaderView (null when there's no header block). */
export function toHeaderView(
  entry: Record<string, unknown> | null | undefined,
): HeaderView | null {
  const config = extractHeaderFooterConfig(entry);
  const header = config?.header;
  if (!header) return null;

  const buttons = (header.buttons ?? [])
    .map((b) => ({
      label: str(b?.label) ?? "",
      url: str(b?.url) ?? "#",
      style: str(b?.style),
    }))
    .filter((b) => b.label);

  const topBar = header.topBar;
  const mainBar = header.mainBar;
  const navBar = header.navBar;
  const account = mainBar?.account;

  return {
    logoUrl: str(header.logos?.mainLogo?.url),
    logoAlt: str(header.logos?.mainLogo?.alt),
    logoDarkUrl: str(header.logos?.mainLogoDark?.url),
    groupLogoUrl: str(header.logos?.groupLogo?.url),
    groupLogoAlt: str(header.logos?.groupLogo?.alt),
    buttons: buttons.length ? buttons : undefined,
    dateTime: header.dateTime
      ? {
          enabled: header.dateTime.enabled,
          locale: str(header.dateTime.locale),
          format: str(header.dateTime.format),
        }
      : undefined,
    social: toSocial(header.socialLinks),
    groupLinks: toLooseLinks(header.groupLinks),
    topBar: {
      enabled: topBar?.enabled ?? true,
      showSocialLinks: topBar?.showSocialLinks ?? true,
      background: str(topBar?.background),
      textColor: str(topBar?.textColor),
      languageLinks: toLooseLinks(topBar?.languageLinks),
    },
    mainBar: {
      showMenuButton: mainBar?.showMenuButton ?? true,
      showSearch: mainBar?.showSearch ?? true,
      showThemeToggle: mainBar?.showThemeToggle ?? true,
      logoAlign: toLogoAlign(mainBar?.logoAlign),
      account: {
        enabled: account?.enabled ?? true,
        showIcon: account?.showIcon ?? true,
        url: str(account?.url) ?? "#",
        label: str(account?.label),
      },
    },
    navBar: {
      enabled: navBar?.enabled ?? true,
      sticky: navBar?.sticky ?? true,
      maxVisibleItems:
        typeof navBar?.maxVisibleItems === "number" && navBar.maxVisibleItems > 0
          ? navBar.maxVisibleItems
          : undefined,
      background: str(navBar?.background),
      textColor: str(navBar?.textColor),
      activeColor: str(navBar?.activeColor),
      items: toNavItems(navBar?.items),
    },
  };
}

/** Raw config → FooterView (null when there's no footer block). */
export function toFooterView(
  entry: Record<string, unknown> | null | undefined,
): FooterView | null {
  const config = extractHeaderFooterConfig(entry);
  const footer = config?.footer;
  if (!footer) return null;

  const groups: FooterGroup[] = (footer.groups ?? [])
    .map((g) => ({
      title: str(g?.title),
      columns: typeof g?.columns === "number" ? g.columns : undefined,
      links: toLinks(g?.links),
    }))
    .filter((g) => g.links.length);

  const copyright = str(footer.copyrightText);

  return {
    logoUrl: str(footer.logo?.url),
    logoAlt: str(footer.logo?.alt),
    logoDarkUrl: str(footer.logoDark?.url),
    groups,
    quickLinks: toLinks(footer.quickLinks),
    social: toSocial(footer.socialLinks),
    copyrightText: copyright ? fixMojibake(copyright) : undefined,
    bottomBarSeparator: str(footer.layout?.bottomBarSeparator),
    showTopDivider: footer.layout?.showTopDivider,
    recentNews: footer.recentNews
      ? {
          enabled: footer.recentNews.enabled,
          title: str(footer.recentNews.title),
          columns: footer.recentNews.columns,
          count: footer.recentNews.count,
          apiUrl: str(footer.recentNews.apiUrl),
          dataPath: str(footer.recentNews.dataPath),
          source: str(footer.recentNews.source),
          fieldMapping: footer.recentNews.fieldMapping,
        }
      : undefined,
  };
}
