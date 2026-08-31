import type { ReactNode } from "react";
import NextLink from "@/components/ui/PrefetchLink";

import { cn } from "@/lib/utils";
import {
  getRegistryEntry,
  LIST_TYPES,
  resolveSectionType,
  SELF_LINKING_TYPES,
} from "@/lib/builder/registry";
import {
  buildNavigationUrl,
  filterItems,
  mapItemToProps,
  resolveFieldPath,
} from "@/lib/builder/field-map";
import type {
  PageComponent,
  ResponsiveToggle,
  TransformedItem,
} from "@/lib/builder/types";

import AdSlot from "./AdSlot";
import HtmlSection from "./HtmlSection";
import PageHeading from "./PageHeading";
import TaboolaPlacement from "@/components/ads/TaboolaPlacement";
import { getPageHeadingContext } from "@/lib/builder/page-heading-context";

/** Component types that render raw HTML instead of a registry component. */
const HTML_TYPES = new Set(["Html", "CustomHtml", "RawHtml", "HtmlSection"]);

/** Resolve an html/css value from field_map (dynamic) or static props. */
function resolveHtmlValue(
  component: PageComponent,
  key: "html" | "css",
  item: TransformedItem | undefined,
): string | undefined {
  const entry = component.data_config?.field_map?.[key];
  if (entry && item) {
    const path = typeof entry === "string" ? entry : entry.apiField;
    if (path) {
      const v = resolveFieldPath(item, path);
      if (typeof v === "string" && v) return v;
    }
    if (typeof entry !== "string" && typeof entry.value === "string") {
      return entry.value;
    }
  }
  const prop = component.props?.[key];
  return typeof prop === "string" ? prop : undefined;
}

/** Static Tailwind grid-cols maps (interpolated strings would be purged).
 *  GRID_COLS = mobile (base) count; MD_GRID_COLS = desktop count at md+. */
const GRID_COLS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
};
const MD_GRID_COLS: Record<number, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
  6: "md:grid-cols-6",
};

/** Normalise any URL/slug to a site path. */
function toPath(u?: string): string | null {
  if (!u) return null;
  const s = String(u).trim();
  if (!s) return null;
  if (s.startsWith("/")) return s;
  if (/^https?:\/\//i.test(s)) {
    try {
      return new URL(s).pathname;
    } catch {
      return null;
    }
  }
  return `/${s.replace(/^\/+/, "")}`;
}

/**
 * The URL a card should navigate to. Prefers the story's own URL (which lives
 * under its section), then the section URL, then the slug — so EVERY component is
 * navigatable even without an explicit navigation config.
 */
function resolveItemUrl(item: TransformedItem): string | null {
  return (
    toPath(item.navigateUrl) ||
    toPath(item.sectionUrl) ||
    toPath(item.slug) ||
    null
  );
}

function visibilityClass(v?: PageComponent["visibility"]): string {
  if (!v) return "";
  const m = v.mobile !== false;
  const t = v.tablet !== false;
  const d = v.desktop !== false;
  const cls: string[] = [m ? "block" : "hidden"];
  if (t !== m) cls.push(t ? "md:block" : "md:hidden");
  if (d !== t) cls.push(d ? "lg:block" : "lg:hidden");
  return cls.join(" ");
}

interface Props {
  component: PageComponent;
  items: TransformedItem[];
  priority?: boolean;
  /** Column-level underline toggle (column.componentUnderline.enabled). */
  underline?: boolean;
  /** Column-level gap (column.gap) — overrides the default gap between looped cards. */
  gap?: string;
  /** Column-level horizontal scroll — looped cards render in a scrolling row.
   *  boolean = all breakpoints; object = per-breakpoint (mobile/tablet/desktop). */
  horizontalScroll?: boolean | ResponsiveToggle;
}

/** Resolve horizontalScroll to concrete mobile/desktop booleans (md = tablet+desktop). */
function resolveScroll(hs?: boolean | ResponsiveToggle): {
  mobile: boolean;
  desktop: boolean;
} {
  if (hs == null) return { mobile: false, desktop: false };
  if (typeof hs === "boolean") return { mobile: hs, desktop: hs };
  return { mobile: !!hs.mobile, desktop: !!(hs.desktop ?? hs.tablet) };
}

/** Render one builder component, in `single` or `loop` mode, from item data. */
export default function ComponentRenderer({
  component,
  items,
  priority,
  underline,
  gap,
  horizontalScroll,
}: Props) {
  // Instance ad slot (component_type is null): the builder binds a GPT ad here.
  // Render the desktop/mobile ad code via the client AdSlot (gpt.js is loaded in
  // the document head). Checked first — these components have no component_type,
  // so they'd otherwise fall through to the "unknown type → null" branch.
  if (
    component.useInstanceAdCode ||
    component.instanceDesktopAdCode ||
    component.instanceMobileAdCode
  ) {
    return (
      <AdSlot
        desktop={component.instanceDesktopAdCode}
        mobile={component.instanceMobileAdCode}
      />
    );
  }

  // Include-section component: resolve its slug to a real component type via the
  // section registry, then render that (dinamani's include-section mechanism).
  // The builder emits this via `widget_type: "include-section"` (component_type
  // is null) OR component_type "IncludeSection".
  if (
    component.widget_type === "include-section" ||
    component.component_type === "IncludeSection" ||
    component.component_type === "include-section"
  ) {
    const slug =
      component.slug ??
      (component.props && !Array.isArray(component.props)
        ? (component.props.slug as string | undefined)
        : undefined);
    const type = resolveSectionType(slug);
    if (!type) return null;
    // Clear the include markers so the recursive call renders the resolved
    // component instead of re-matching this branch (infinite loop).
    return (
      <ComponentRenderer
        component={{
          ...component,
          component_type: type,
          widget_type: undefined,
        }}
        items={items}
        priority={priority}
        underline={underline}
        gap={gap}
        horizontalScroll={horizontalScroll}
      />
    );
  }

  // Page heading / breadcrumb placed inside the layout — render the page-level
  // heading config (published by PageRenderer) at THIS component's position
  // instead of the fixed top-of-page slot. `props.parts` selects heading only,
  // breadcrumb only, or both; a `Breadcrumb` component always means breadcrumb.
  if (
    component.component_type === "PageMainHeading" ||
    component.component_type === "Breadcrumb" ||
    component.component_type === "Breadcrumbs"
  ) {
    const ctx = getPageHeadingContext().current;
    if (!ctx.heading) return null;
    const rawParts =
      component.component_type === "PageMainHeading"
        ? (!Array.isArray(component.props)
            ? (component.props?.parts as string | undefined)
            : undefined) ?? "both"
        : "breadcrumb";
    const parts: "both" | "heading" | "breadcrumb" =
      rawParts === "heading"
        ? "heading"
        : rawParts === "breadcrumb" || rawParts === "breadcrumbs"
          ? "breadcrumb"
          : "both";
    const wrap = visibilityClass(component.visibility);
    const el = (
      <PageHeading heading={ctx.heading} section={ctx.section} parts={parts} />
    );
    return wrap ? <div className={wrap}>{el}</div> : el;
  }

  // Taboola widget — the builder binds a placement by `position` (bottomAd/
  // midAd/rightRailAd) + `page_type` (section/homepage/article/…). The actual
  // ad code comes from the pulled Taboola config; rendered by the lazy client
  // slot (loads Taboola's JS only when scrolled near — see TaboolaSlot).
  if (component.widget_type === "taboola") {
    const wrap = visibilityClass(component.visibility);
    const el = (
      <TaboolaPlacement
        pageType={component.page_type}
        position={component.position}
      />
    );
    return wrap ? <div className={wrap}>{el}</div> : el;
  }

  // Raw "layout code" (html) widget — the builder's `html` block stores its
  // markup in top-level `htmlContent`/`cssContent` (NOT props) and carries a
  // per-device `visibility`. Rendered verbatim, gated by visibility. Also
  // supports the legacy `component_type` HTML kinds (props/field_map-driven).
  if (
    component.widget_type === "html" ||
    component.htmlContent ||
    component.cssContent ||
    (component.component_type && HTML_TYPES.has(component.component_type))
  ) {
    const html =
      component.htmlContent ?? resolveHtmlValue(component, "html", items[0]);
    const css =
      component.cssContent ?? resolveHtmlValue(component, "css", items[0]);
    const wrap = visibilityClass(component.visibility);
    const el = <HtmlSection html={html} css={css} />;
    return wrap ? <div className={wrap}>{el}</div> : el;
  }

  const entry = component.component_type
    ? getRegistryEntry(component.component_type)
    : null;

  if (!entry) {
    // Unknown/unsupported type — render nothing (rather than crash the page).
    return null;
  }

  const { Component, shape } = entry;
  const cfg = component.data_config;
  const defaults = component.props;
  const wrap = visibilityClass(component.visibility);
  // Builder "underline" toggle → a divider line below every card. Set on the
  // column (column.componentUnderline.enabled, passed as `underline`) or the
  // component/data_config.
  const underlineClass =
    underline || component.underline || cfg?.underline
      ? "border-b border-D2D2D2 pb-4"
      : "";

  // Section/list components: render ONCE with the whole bound collection mapped
  // into a light `items` array (title / imageSrc / href), honouring loop_start /
  // loop_count. Hidden when there's no data.
  if (component.component_type && LIST_TYPES.has(component.component_type)) {
    const filtered = filterItems(items, cfg);
    const start = Math.max(0, cfg?.loop_start ?? 0);
    const sliced = cfg?.loop_count
      ? filtered.slice(start, start + cfg.loop_count)
      : filtered.slice(start);
    const listItems = sliced.map((it) => ({
      title: typeof it.title === "string" ? it.title : "",
      imageSrc: typeof it.imageSrc === "string" ? it.imageSrc : undefined,
      href: resolveItemUrl(it) ?? undefined,
      templatetype:
        typeof it.templatetype === "string" ? it.templatetype : undefined,
      isliveblog:
        typeof it.isliveblog === "string" || typeof it.isliveblog === "boolean"
          ? it.isliveblog
          : undefined,
    }));
    if (listItems.length === 0) return null;
    const el = <Component {...defaults} items={listItems} />;
    return wrap ? <div className={wrap}>{el}</div> : el;
  }

  const renderOne = (
    item: TransformedItem | undefined,
    key: string,
    i: number,
    wrapperClass = "",
  ) => {
    const source = item ?? ({} as TransformedItem);
    // Nav URL: explicit navigation config → the item's own URL (story/section).
    const navUrl =
      buildNavigationUrl(component.navigation, source) || resolveItemUrl(source);
    const props = mapItemToProps(source, cfg, shape, navUrl, defaults);
    // `componentdiv` is a container-level FieldConfig: its customClass styles the
    // card's outer wrapper (works for every component, not just ones that read it
    // internally); `hidden` drops the card entirely.
    const containerDiv = props.componentdiv as
      | { hidden?: boolean; customClass?: string }
      | undefined;
    if (containerDiv?.hidden) return null;
    const containerClass = containerDiv?.customClass;
    const node = <Component {...props} priority={priority && i === 0} />;
    // Self-linking components render their own <a> (fed via articleHref) — don't
    // double-wrap. Everything else gets wrapped so every card is navigatable.
    const selfLinks = SELF_LINKING_TYPES.has(component.component_type ?? "");
    return navUrl && !selfLinks ? (
      <NextLink
        key={key}
        href={navUrl}
        className={cn("block", containerClass, wrapperClass, underlineClass)}
      >
        {node}
      </NextLink>
    ) : (
      <div
        key={key}
        className={cn(containerClass, wrapperClass, underlineClass) || undefined}
      >
        {node}
      </div>
    );
  };

  // No data binding → single static component using its defaults. Honour
  // loop_start so a "featured" single card can point at a specific item.
  if (!cfg || cfg.mode === "single") {
    const start = Math.max(0, cfg?.loop_start ?? 0);
    const el = renderOne(items[start], component.id, 0);
    return wrap ? <div className={wrap}>{el}</div> : el;
  }

  // Loop mode. `loop_start` offsets into the bound list so several components in
  // the same column consume different slices instead of repeating from item 0.
  const filtered = filterItems(items, cfg);
  const start = Math.max(0, cfg.loop_start ?? 0);
  const available = Math.max(0, filtered.length - start);
  const count = Math.min(cfg.loop_count ?? available, available);
  const list = filtered.slice(start, start + count);
  if (list.length === 0) return null;

  const cols = cfg.grid_columns ?? 1;
  // Mobile grid count. Priority: explicit mobile_grid_columns → a "separate
  // mobile grid" (keeps a real grid, capped at 2 so 6-col isn't cramped; a 2-col
  // stays 2) → otherwise collapse to a single stacked column.
  const mobileCols =
    cfg.mobile_grid_columns ??
    (cfg.mobile_grid_separate ? Math.min(cols, 2) : 1);
  const gapStyle = gap ? { gap } : undefined;

  // Resolve horizontal scroll per breakpoint (mobile = base, desktop = md+).
  // Where a breakpoint scrolls, cards keep a fixed width in a flex row; where it
  // doesn't, they fall back to the normal grid (cols>1) or a stacked column.
  const scroll = resolveScroll(horizontalScroll);

  const container: string[] = ["gap-4"];
  // Mobile (base) layout.
  if (scroll.mobile) {
    container.push(
      "flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
    );
  } else if (cols > 1) {
    container.push("grid", GRID_COLS[mobileCols] ?? "grid-cols-1");
  } else {
    container.push("flex flex-col");
  }
  // Desktop (md+) override — only when it differs from mobile.
  if (scroll.desktop && !scroll.mobile) {
    container.push("md:flex md:flex-row md:overflow-x-auto");
  } else if (!scroll.desktop && scroll.mobile) {
    container.push("md:overflow-visible");
    if (cols > 1) container.push("md:grid", MD_GRID_COLS[cols] ?? "md:grid-cols-1");
    else container.push("md:flex-col");
  } else if (!scroll.mobile && !scroll.desktop && cols > 1 && cols !== mobileCols) {
    container.push(MD_GRID_COLS[cols] ?? "");
  }

  // Per-card fixed-width class, scoped to the scrolling breakpoint(s).
  let cardClass: string | undefined;
  if (scroll.mobile && scroll.desktop) cardClass = "w-[280px] shrink-0";
  else if (scroll.mobile) cardClass = "w-[280px] shrink-0 md:w-auto md:shrink";
  else if (scroll.desktop) cardClass = "md:w-[280px] md:shrink-0";

  const children = list.map((item, i) =>
    renderOne(item, `${component.id}-${i}`, i, cardClass),
  );
  const inner: ReactNode = (
    <div className={cn(...container)} style={gapStyle}>
      {children}
    </div>
  );

  return wrap ? <div className={wrap}>{inner}</div> : inner;
}
