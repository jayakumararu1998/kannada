/**
 * Builder page-JSON types (trimmed clean port of dinamani's pageBuilder/routes types).
 *
 * The shape mirrors what the builder API produces, but only the fields the v1
 * renderer + sync actually use are kept. Everything is a plain data type — no
 * runtime, safe to import from anywhere (client or server).
 */

// ─────────────────────────────────────────────────────────────────────────────
// Routing
// ─────────────────────────────────────────────────────────────────────────────

export type PageType = "dynamic" | "static" | "article";

export interface RouteConfig {
  id: number;
  name: string;
  /** e.g. "/", "/cinema", "/topic/{slug}" — supports {param} and :param. */
  url_pattern: string;
  page_type: PageType;
  page_id: string | null;
  /** Number of path segments in the pattern (capped at 5 on ingest). */
  segment_count: number;
  /** Higher wins when multiple patterns match. */
  priority: number;
  page_slug?: string | null;
  page_name?: string | null;
  static_template?: string | null;
  json_config?: Record<string, unknown> | null;
  /** Hide the site chrome (Header/Footer) for this route. */
  hide_layout?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Responsive sizing
// ─────────────────────────────────────────────────────────────────────────────

export interface ResponsiveWidth {
  /** Tailwind column count (1–12) at each breakpoint. */
  mobile: number;
  tablet: number;
  desktop: number;
}

/** Per-breakpoint CSS padding (e.g. `{ tablet: "15px", desktop: "20px" }`).
 *  Values are CSS lengths; bare numbers are treated as px. Any subset may be set. */
export interface ResponsivePadding {
  mobile?: string;
  tablet?: string;
  desktop?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Data binding + field mapping
// ─────────────────────────────────────────────────────────────────────────────

/** A binding that fetches a collection/API and feeds items to descendants. */
export interface DataBinding {
  collection_id?: string;
  api_endpoint?: string;
  limit?: number;
  /** Dot/array path into the response to reach the items array. */
  responsePath?: string;
  cacheDuration?: number;
  /** Pagination offset (items to skip) — applied to paginated columns. */
  offset?: number;
}

/** Column pagination config (builder: { type: "numbered", enabled: true }). */
export interface PaginationConfig {
  enabled?: boolean;
  type?: string;
  pageSize?: number;
}

/** field_map value: shorthand string (apiField) or a full entry. */
export type FieldMapValue = string | FieldMapEntry;

export interface FieldMapEntry {
  /** Single API field path (checked against item._raw then item). */
  apiField?: string;
  /** Try each in order, first truthy wins. */
  apiFields?: string[];
  /** Static override — used verbatim when no apiField resolves. */
  value?: unknown;
  /** Passed through to FieldConfig-shaped props. */
  hidden?: boolean;
  customClass?: string;
}

export type FilterOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with";

export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: string | number | boolean;
}

export interface DataConfig {
  mode: "single" | "loop";
  loop_count?: number;
  /** First item index to render (offset into the bound list). Lets multiple
   *  components in one column consume the same list without repeating items. */
  loop_start?: number;
  /** When true, render an underline (divider) below every card. */
  underline?: boolean;
  /** Desktop grid columns for loop mode (1 = stacked). */
  grid_columns?: number;
  mobile_grid_columns?: number;
  /** Give mobile its own grid layout (don't inherit the desktop grid_columns). */
  mobile_grid_separate?: boolean;
  field_map?: Record<string, FieldMapValue>;
  filter_enabled?: boolean;
  filter_logic?: "AND" | "OR";
  filter_conditions?: FilterCondition[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Navigation + visibility
// ─────────────────────────────────────────────────────────────────────────────

export interface NavigationParam {
  paramName: string;
  fieldName: string;
}

export interface ComponentNavigation {
  type: "template" | "direct" | "dynamic";
  /** For "template"/"direct": URL with {placeholder} tokens. */
  urlTemplate?: string;
  /** For "dynamic": item field holding the URL/slug. */
  urlField?: string;
  params?: NavigationParam[];
}

export interface ComponentVisibility {
  mobile?: boolean;
  tablet?: boolean;
  desktop?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Headings / borders / layout decoration
// ─────────────────────────────────────────────────────────────────────────────

export interface HeadingNavigation {
  enabled: boolean;
  linkText?: string;
  pageSlug?: string;
  openInNewTab?: boolean;
  /** Render the "more" link at the BOTTOM of the column instead of the heading bar. */
  showAtBottom?: boolean;
}

/** A row/column heading strip (distinct from the page-level PageHeading). */
export interface ColumnHeading {
  text: string;
  enabled: boolean;
  navigation?: HeadingNavigation;
  showDivider?: boolean;
  color?: string;
  fontSize?: string;
  fontWeight?: "normal" | "medium" | "semibold" | "bold";
  align?: "left" | "center" | "right";
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Builder-configured spacing around the heading (string or per-breakpoint). */
  padding?: string | ResponsivePadding;
  margin?: string | ResponsivePadding;
  /** References a page SectionBinding; the resolved collection is injected here. */
  sectionBindingId?: string;
  apiEndpoint?: string;
  collectionId?: string;
}

export interface BorderSides {
  top?: boolean;
  right?: boolean;
  bottom?: boolean;
  left?: boolean;
}

export interface BorderConfig {
  enabled?: boolean;
  width?: string;
  style?: "solid" | "dashed" | "dotted" | "none";
  color?: string;
  radius?: string;
  sides?: BorderSides;
}

export interface ResponsiveJustify {
  mobile?: string;
  tablet?: string;
  desktop?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tabs + sliders
// ─────────────────────────────────────────────────────────────────────────────

export interface Tab {
  id: string;
  label: string;
  rows: Row[];
  hidden?: boolean;
  /** Section URL this tab maps to. When enabled the tab becomes a link and is
   *  marked active when the current page URL matches it. */
  sectionUrl?: string;
  sectionUrlEnabled?: boolean;
}

export interface TabBar {
  id: string;
  tabs: Tab[];
  tabPosition?: "top" | "bottom" | "left" | "right";
  defaultActiveTab?: string;
  hidden?: boolean;
  tabTextColor?: string;
  tabActiveTextColor?: string;
  tabActiveBackgroundColor?: string;
  tabInactiveBackgroundColor?: string;
  tabActiveBorderColor?: string;
  tabFontSize?: string;
  stickyTabs?: boolean;
  stickyTop?: string;
}

export interface SliderConfig {
  id: string;
  rows: Row[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  slidesToShow?: { mobile?: number; tablet?: number; desktop?: number };
  loop?: boolean;
}

export interface ChildOrder {
  id: string;
  type: "component" | "nested-column" | "nested-row" | "include-section";
}

// ─────────────────────────────────────────────────────────────────────────────
// Menus (dynamic header/nav)
// ─────────────────────────────────────────────────────────────────────────────

export interface MenuItem {
  id?: string | number;
  title: string;
  url: string;
  rank?: number;
  parentId?: string | number | null;
  target?: "_self" | "_blank";
  /** Nested items (built from parentId, or provided directly). */
  children?: MenuItem[];
}

/** A named menu (e.g. slug "header") holding an ordered list of items. */
export interface MenuGroup {
  id?: string | number;
  slug: string;
  name?: string;
  items: MenuItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout tree
// ─────────────────────────────────────────────────────────────────────────────

/**
 * An "include section" reference (dinamani parity). A column (or component) can
 * embed a reusable named section by `slug`; the slug is resolved against the
 * SECTION_REGISTRY to a real component type and rendered with the bound data.
 */
export interface IncludeSection {
  slug: string;
  id?: string;
  name?: string;
}

export interface PageComponent {
  id: string;
  /** Registry key, e.g. "VerticalBigImageNews". */
  component_type?: string;
  /** For an include-section component (component_type "IncludeSection"): the section slug. */
  slug?: string;
  /** Builder widget kind, e.g. "include-section" / "html" (parallel to component_type). */
  widget_type?: string;
  /** Raw "layout code" (html) widget: its markup/styles live at the top level
   *  (not in `props`), rendered verbatim and gated by `visibility` per device. */
  htmlContent?: string;
  cssContent?: string;
  /** Section id an include-section references. */
  sectionId?: string;
  /** Taboola widget (`widget_type: "taboola"`): which placement + which page-type
   *  config to pull the ad code from. `position` matches a config key
   *  (midAd/bottomAd/rightRailAd); `page_type` selects `config.pages[page_type]`. */
  position?: string;
  page_type?: string;
  /** Builder toggle: when true, render an underline (divider) below every card. */
  underline?: boolean;
  /** Static defaults merged under mapped props. */
  props?: Record<string, unknown>;
  data_config?: DataConfig;
  navigation?: ComponentNavigation;
  visibility?: ComponentVisibility;
  /** Per-breakpoint padding applied around this component when rendered. */
  padding?: string | ResponsivePadding;
  /** Instance ad slot (component_type is null): the builder binds a GPT ad here.
   *  `instanceDesktopAdCode`/`instanceMobileAdCode` are self-contained ad markup
   *  (googletag defineSlot + display + the target <div>). */
  useInstanceAdCode?: boolean;
  instanceDesktopAdCode?: string;
  instanceMobileAdCode?: string;
  slot_id?: string;
  provider?: string;
}

export interface Column {
  id: string;
  width: ResponsiveWidth;
  heading?: ColumnHeading;
  components?: PageComponent[];
  /** Nested columns (recurse into their own 12-col grid). */
  columns?: Column[];
  /** Nested rows rendered inside this column. */
  rows?: Row[];
  /** Explicit render order across components / nested columns / nested rows. */
  children_order?: ChildOrder[];
  data_binding?: DataBinding;
  /** References a page-level PageApiBinding; the URL slug is injected here. */
  pageApiBindingId?: string;
  /** References a page-level SectionBinding; the section's collection is injected here. */
  sectionBindingId?: string;
  /** Embed a reusable named section (resolved via SECTION_REGISTRY). */
  includeSection?: IncludeSection;
  /** Builder toggle: underline (divider) below every card in this column. */
  componentUnderline?: { enabled?: boolean };
  /** A "more" link rendered BELOW the column (plain link + chevron, no underline). */
  more?: ColumnMore;
  /** Numbered pagination for this column's bound collection. */
  pagination?: PaginationConfig;
  /** Mobile stacking order (CSS order); desktop keeps the side-by-side layout.
   *  Builder emits an object `{ mobile }`; a bare number is also accepted. */
  order?: number | { mobile?: number; tablet?: number; desktop?: number };
  mobileOrder?: number;
  tabBar?: TabBar;
  slider?: SliderConfig;
  border?: BorderConfig;
  background?: string;
  /** Explicit dark-mode background color (builder "Dark Mode Background Color"
   *  field). When set, the column renders `light-dark(background, backgroundDark)`
   *  so the editor controls the exact dark color (e.g. #2A271F). When omitted,
   *  `background` auto-flips via `themeColor()`. */
  backgroundDark?: string;
  backgroundImage?: { url: string; enabled?: boolean };
  padding?: string | ResponsivePadding;
  /** CSS gap between this column's children (components / nested rows / columns). */
  gap?: string;
  justifyContent?: ResponsiveJustify;
  sticky?: boolean;
  stickyTop?: string;
  /** Horizontal-scroll the looped cards. A boolean applies to all breakpoints;
   *  an object toggles it per breakpoint (e.g. `{ mobile: true, desktop: false }`
   *  → scroll on mobile, normal grid/stack on desktop). `tablet` follows
   *  `desktop` when omitted. */
  horizontalScroll?: boolean | ResponsiveToggle;
  /** The builder also emits per-breakpoint scroll as SEPARATE sibling booleans
   *  (these take precedence over `horizontalScroll` when present). */
  horizontalScrollMobile?: boolean;
  horizontalScrollTablet?: boolean;
  horizontalScrollDesktop?: boolean;
  hidden?: boolean;
  hideWhenEmpty?: boolean;
}

/** Per-breakpoint on/off toggle. */
export interface ResponsiveToggle {
  mobile?: boolean;
  tablet?: boolean;
  desktop?: boolean;
}

/** A "more"/"view all" link rendered at the bottom of a column. */
export interface ColumnMore {
  enabled?: boolean;
  text?: string;
  /** Link target — absolute path or slug (url / pageSlug both accepted). */
  url?: string;
  pageSlug?: string;
  openInNewTab?: boolean;
}

export interface Row {
  id: string;
  columns: Column[];
  heading?: ColumnHeading;
  border?: BorderConfig;
  padding?: string | ResponsivePadding;
  hidden?: boolean;
  data_binding?: DataBinding;
}

export interface Section {
  id: string;
  name: string;
  rows: Row[];
}

/** One breadcrumb trail item — static (label/url) or dynamic (labelField). */
export interface BreadcrumbItem {
  label?: string;
  url?: string;
  isStatic?: boolean;
  labelField?: string;
  urlField?: string;
}

/** Page-level breadcrumb config (dinamani's BreadcrumbConfig), nested under the
 *  pageHeading. Rendered above the heading: Home › …items › current page. */
export interface BreadcrumbConfig {
  enabled?: boolean;
  separator?: string;
  fontSize?: string;
  color?: string;
  activeColor?: string;
  fontWeight?: string;
  marginBottom?: string;
  showHome?: boolean;
  homeUrl?: string;
  homeLabel?: string;
  items?: BreadcrumbItem[];
  showCurrentPage?: boolean;
  currentPageLabel?: string;
  /** "section_bind" | "page_bind" | "dynamic" — where the current-page label comes from. */
  currentPageSourceType?: string;
  showDivider?: boolean;
  dividerColor?: string;
  dividerWidth?: string;
  dividerMarginTop?: string;
}

export interface PageHeading {
  enabled: boolean;
  text?: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  align?: "left" | "center" | "right";
  customClass?: string;
  /** "dynamic"/"page_bind" pull from a page binding; "section_bind" from the
   *  URL-matched section; "static" uses `text`. */
  sourceType?: "static" | "dynamic" | "page_bind" | "section_bind";
  /** Which pageApiBinding to source the heading from (dynamic). */
  bindingId?: string;
  /** Which sectionBinding to source the heading from (section_bind). */
  sectionBindingId?: string;
  /** Field on the bound item to use as the heading (default: category → title). */
  field?: string;
  // Inline styling (from the builder — applied as CSS, not Tailwind).
  color?: string;
  fontWeight?: string;
  fontSize?: string;
  marginTop?: string;
  marginBottom?: string;
  padding?: string;
  showDivider?: boolean;
  dividerColor?: string;
  dividerWidth?: string;
  /** Breadcrumb trail rendered above the heading. */
  breadcrumbs?: BreadcrumbConfig;
}

/**
 * A page-level API binding. A template page declares these; columns reference
 * one via `pageApiBindingId`. At request time the URL slug is injected into the
 * binding's endpoint and the resulting collection is fetched + bound.
 * (dinamani's pageApiBindings concept.)
 */
export interface PageApiBinding {
  id: string;
  name?: string;
  enabled?: boolean;
  /** Which URL param supplies the slug (defaults to the last dynamic segment). */
  slug_param?: string;
  /** How the slug is applied to the endpoint. */
  slug_position?: "path" | "query";
  /** Base endpoint; may contain a {slug} token. */
  api_endpoint?: string;
  /** Or a collection id (resolved against the collections API). */
  collection_id?: string;
  /** Query param name when slug_position = "query". */
  query_param?: string;
  limit?: number;
  responsePath?: string;
}

/**
 * A page-level "section binding". A category/section template page declares ONE
 * of these; columns (and column headings) reference it via `sectionBindingId`.
 * At request time the URL slug is matched to a stored SectionConfig, whose
 * `collection_url` is injected as the column's data_binding. This lets a single
 * template render every section URL (/karnataka, /sports, …) with the right data.
 * (dinamani's sectionBindings concept.)
 */
export interface SectionBinding {
  id: string;
  name?: string;
  enabled?: boolean;
  query_params?: unknown[];
}

/**
 * A stored section → collection mapping (synced from the builder / derived from
 * section-meta). Keyed in the store by `section_url` (URL path, no leading slash).
 */
export interface SectionConfig {
  /** URL path this section responds to, e.g. "sports" or "videos/health". */
  section_url: string;
  section_name?: string;
  collection_name?: string;
  collection_type?: string;
  collection_slug?: string;
  /** Absolute collection endpoint bound into columns at request time. */
  collection_url: string;
  is_active?: boolean;
}

export interface PageMeta {
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  /**
   * "dynamic" → use the inline seo_* fields on this page.
   * "master"  → inherit from a shared SectionMeta record identified by
   *             `master_meta_owner_id` (falls back to inline fields if missing).
   */
  meta_source?: "master" | "dynamic";
  master_meta_id?: number;
  master_meta_owner_id?: number;
}

/**
 * A reusable "master" SEO record (section-level metadata). Pages inherit it by
 * `master_meta_owner_id`, or it is matched by `slug` against the page URL.
 * Stored as its own entity, synced from `/api/section-meta/public`.
 */
export interface SectionMeta {
  id?: string;
  ownerId?: string | number;
  ownerType?: string;
  publisherId?: number;
  /** Browser tab / <title>. */
  pageTitle?: string;
  /** OG / social / heading title. */
  title?: string;
  description?: string;
  keywords?: string;
  /** Section URL/slug this record applies to (used for URL matching). */
  slug?: string | null;
  name?: string | null;
  displayName?: string | null;
  [key: string]: unknown;
}

/**
 * A builder-synced article template — the dynamic layout the article page uses
 * for a given story-template (`text`, `video`, `listicle`, …). `heroFields`
 * drives the dynamic hero (see src/lib/article/hero-fields.ts); `pageJson`/
 * `sections` carry the full template tree when authored. Kept loose — the
 * article renderer reads only the fields it understands and falls back to its
 * built-in defaults for the rest.
 */
export interface ArticleTemplateConfig {
  /** Which story-template this applies to (the store key). */
  templateType: string;
  /** "default" = HTML article page, "amp" = AMP variant. Same templateType. */
  variant?: "default" | "amp" | string;
  heroFields?: unknown[];
  pageJson?: { sections?: Section[]; [key: string]: unknown };
  sections?: Section[];
  articleFieldMapping?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * A per-URL social/OpenGraph/Twitter override, synced from the builder
 * (`/api/social-meta/public`) and matched at render time by `pageUrl`. Ported
 * 1:1 from dinamani's SocialMetaConfig. Any field left null/undefined falls back
 * to the page's own resolved metadata. `customSchemaScripts` carries per-page
 * JSON-LD authored in the builder (see CustomSchemaScript).
 */
export interface SocialMetaConfig {
  id?: string;
  name?: string;
  slug: string;
  /** URL path this record applies to (e.g. "/about-us"). Match key at render. */
  pageUrl?: string | null;
  description?: string | null;
  isActive?: boolean;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  ogImageWidth?: number | null;
  ogImageHeight?: number | null;
  ogType?: string;
  ogUrl?: string | null;
  ogSiteName?: string | null;
  ogLocale?: string;
  twitterCard?: string;
  twitterTitle?: string | null;
  twitterDescription?: string | null;
  twitterImage?: string | null;
  twitterSite?: string | null;
  twitterCreator?: string | null;
  canonicalUrl?: string | null;
  keywords?: string | null;
  /**
   * The Kannada builder nests OG/Twitter under objects instead of the flat
   * `og*`/`twitter*` fields above. The resolver reads NESTED first, then flat.
   */
  openGraph?: {
    title?: string | null;
    description?: string | null;
    image?: string | null;
    imageWidth?: number | null;
    imageHeight?: number | null;
    type?: string | null;
    url?: string | null;
    siteName?: string | null;
    locale?: string | null;
  } | null;
  twitter?: {
    card?: string | null;
    title?: string | null;
    description?: string | null;
    image?: string | null;
    site?: string | null;
    creator?: string | null;
  } | null;
  /** Extra ItemList JSON-LD the builder attaches to a page (rendered too). */
  itemListSchema?: unknown;
  itemListSchemas?: unknown[];
  /** Per-page builder JSON-LD (rendered by CustomSchemaScripts). */
  customSchemaScripts?: CustomSchemaScriptEntry[];
  createdAt?: string;
  updatedAt?: string | null;
  [key: string]: unknown;
}

/**
 * Site-wide application config synced from the builder
 * (`/api/website-settings/public`). A generic slug → value store (site name,
 * logo, social handles, feature flags, ad-slot settings, …). Kept loose; each
 * consumer reads the slug it understands. Ported from dinamani WebsiteSetting.
 */
export interface WebsiteSettingConfig {
  slug?: string;
  name?: string;
  valueType?: string;
  value?: unknown;
  [key: string]: unknown;
}

/**
 * A builder-authored custom JSON-LD script. Global (no `pageUrl`) or scoped to a
 * single page. Rendered verbatim inside a <script type="application/ld+json">.
 * Synced via `/api/sync/custom-schemas` and extracted from social-meta records.
 */
export interface CustomSchemaScript {
  id: string;
  label?: string | null;
  enabled?: boolean;
  /** Raw JSON-LD, already serialized to a string. */
  script: string;
  /** Restrict to one page URL; null/absent = global. */
  pageUrl?: string | null;
  [key: string]: unknown;
}

/** A custom schema entry as carried on a PageJSON / social-meta record. */
export interface CustomSchemaScriptEntry {
  id: string;
  label?: string | null;
  enabled?: boolean;
  script: string;
}

export interface PageJSON {
  slug: string;
  title: string;
  page_id: string;
  sections: Section[];
  pageHeading?: PageHeading;
  pageMeta?: PageMeta;
  /** Per-page custom JSON-LD authored in the builder. */
  customSchemaScripts?: CustomSchemaScriptEntry[];
  /** Page-level API bindings (URL-slug → collection) for dynamic templates. */
  pageApiBindings?: PageApiBinding[];
  /** Section bindings (URL → section collection) for section/category templates. */
  sectionBindings?: SectionBinding[];
  /** Raw HTML for a static/HTML page. When set, it renders instead of sections. */
  html?: string;
  /** Optional CSS injected alongside `html`. */
  css?: string;
  /** Hide the site chrome (Header/Footer). Overrides the route-level flag. */
  hide_layout?: boolean;
  [key: string]: unknown;
}

// ─────────────────────────────────────────────────────────────────────────────
// Fetched/normalised data
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalised item handed to the renderer. Common fields are surfaced flat for
 * convenience; the untouched API object lives on `_raw` so field_map can reach
 * any original path (e.g. "hero-image-s3-key").
 */
export interface TransformedItem {
  id?: string;
  title?: string;
  slug?: string;
  imageSrc?: string;
  category?: string;
  excerpt?: string;
  timeAgo?: string;
  sectionUrl?: string;
  templatetype?: string;
  isliveblog?: string;
  navigateUrl?: string;
  _raw?: Record<string, unknown>;
  [key: string]: unknown;
}

/** endpoint(normalised URL) → items. */
export type CollectionsData = Map<string, TransformedItem[]>;

// ─────────────────────────────────────────────────────────────────────────────
// Menu Header Codes (CMS image/HTML banners above the header / below breaking news)
// ─────────────────────────────────────────────────────────────────────────────

export type MenuHeaderPosition = "above_header" | "below_breaking_news";

/** One renderable banner slot — an image (with optional link) or raw HTML. */
export interface MenuHeaderSlot {
  type?: "image" | "html";
  imageUrl?: string;
  imageAlt?: string;
  imageLink?: string;
  html?: string;
}

/** A page-specific / url-specific entry with its own slot(s). */
export interface MenuHeaderEntry {
  pageId?: string;
  pageSlug?: string;
  urlPattern?: string;
  content?: MenuHeaderSlot;
  mobileContent?: MenuHeaderSlot;
}

/**
 * A CMS "menu header code" — an image/HTML banner shown at `position`. `scope`
 * decides which pages it applies to and where its slot comes from. Ported 1:1
 * from dinamani's MenuHeaderCodeConfig.
 */
export interface MenuHeaderCodeConfig {
  slug?: string;
  isActive?: boolean;
  position?: MenuHeaderPosition;
  scope?: "all_pages" | "page_based" | "specific_page" | "url_based";
  hasSeparateMobile?: boolean;
  // all_pages
  content?: MenuHeaderSlot;
  mobileContent?: MenuHeaderSlot;
  // page_based
  homepageContent?: MenuHeaderSlot;
  sectionPageContent?: MenuHeaderSlot;
  articlePageContent?: MenuHeaderSlot;
  mobileHomepageContent?: MenuHeaderSlot;
  mobileSectionPageContent?: MenuHeaderSlot;
  mobileArticlePageContent?: MenuHeaderSlot;
  // specific_page / url_based
  specificPageCodes?: MenuHeaderEntry[];
  urlBasedCodes?: MenuHeaderEntry[];
  [key: string]: unknown;
}
