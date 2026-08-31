import type { CSSProperties, ReactNode } from "react";

import NextLink from "next/link";

import { cn } from "@/lib/utils";
import { resolveEndpoint } from "@/lib/builder/fetch";
import { resolveSectionType } from "@/lib/builder/registry";
import { borderStyle, themeBackground } from "@/lib/builder/style";
import {
  PaddingBox,
  PaddingStyle,
  hasPadding,
  paddingClass,
} from "@/lib/builder/padding";
import type {
  Column,
  CollectionsData,
  ResponsiveToggle,
  TransformedItem,
} from "@/lib/builder/types";

/**
 * Effective horizontal-scroll for a column. The builder emits per-breakpoint
 * scroll as SEPARATE sibling booleans (`horizontalScrollMobile`/`…Tablet`/
 * `…Desktop`) — when any is present they win over the legacy `horizontalScroll`
 * boolean, so e.g. mobile:true + desktop:false really means scroll on mobile,
 * normal grid on desktop.
 */
function columnScroll(
  column: Column,
): boolean | ResponsiveToggle | undefined {
  if (
    column.horizontalScrollMobile !== undefined ||
    column.horizontalScrollTablet !== undefined ||
    column.horizontalScrollDesktop !== undefined
  ) {
    return {
      mobile: !!column.horizontalScrollMobile,
      tablet: column.horizontalScrollTablet,
      desktop: !!column.horizontalScrollDesktop,
    };
  }
  return column.horizontalScroll;
}

import { getPaginationContext } from "@/lib/builder/pagination-context";
import {
  getBuilderRequestContext,
  normalizePathname,
} from "@/lib/builder/request-context";

import ColumnHeading from "./ColumnHeading";
import ComponentRenderer from "./ComponentRenderer";
import RowRenderer from "./RowRenderer";
import TabBar from "./TabBar";
import Slider from "./Slider";

/** Static col-span maps per breakpoint (no interpolated class strings). */
const COL_SPAN: Record<number, string> = {
  1: "col-span-1", 2: "col-span-2", 3: "col-span-3", 4: "col-span-4",
  5: "col-span-5", 6: "col-span-6", 7: "col-span-7", 8: "col-span-8",
  9: "col-span-9", 10: "col-span-10", 11: "col-span-11", 12: "col-span-12",
};
const MD_COL_SPAN: Record<number, string> = {
  1: "md:col-span-1", 2: "md:col-span-2", 3: "md:col-span-3", 4: "md:col-span-4",
  5: "md:col-span-5", 6: "md:col-span-6", 7: "md:col-span-7", 8: "md:col-span-8",
  9: "md:col-span-9", 10: "md:col-span-10", 11: "md:col-span-11", 12: "md:col-span-12",
};
const LG_COL_SPAN: Record<number, string> = {
  1: "lg:col-span-1", 2: "lg:col-span-2", 3: "lg:col-span-3", 4: "lg:col-span-4",
  5: "lg:col-span-5", 6: "lg:col-span-6", 7: "lg:col-span-7", 8: "lg:col-span-8",
  9: "lg:col-span-9", 10: "lg:col-span-10", 11: "lg:col-span-11", 12: "lg:col-span-12",
};

/** The mobile stacking order for a column. Builder sends `order: { mobile }`;
 *  a bare `order` number or `mobileOrder` are also accepted. */
function mobileOrderOf(column: Column): number | undefined {
  const o = column.order;
  if (typeof o === "number") return o;
  if (o && typeof o === "object" && typeof o.mobile === "number") return o.mobile;
  return column.mobileOrder;
}

/**
 * Mobile stacking order for a column — DYNAMIC (any number). The value is fed
 * via the `--kp-order` CSS var (inline style) and read by the arbitrary class
 * `order-[var(--kp-order)]`; `md:order-none` resets to source order at md+ so
 * the desktop side-by-side layout is unaffected.
 */
function orderClass(column: Column): string {
  return mobileOrderOf(column) == null ? "" : "order-[var(--kp-order)] md:order-none";
}

function widthClass(w: Column["width"]): string {
  return [
    COL_SPAN[w?.mobile ?? 12] ?? "col-span-12",
    MD_COL_SPAN[w?.tablet ?? w?.mobile ?? 12] ?? "",
    LG_COL_SPAN[w?.desktop ?? w?.tablet ?? 12] ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

/** Normalise a CSS length: bare numbers become px, everything else passes through. */
function cssLength(v?: string): string | undefined {
  if (v == null || `${v}` === "") return undefined;
  return /^\d+(\.\d+)?$/.test(`${v}`) ? `${v}px` : v;
}

function columnStyle(column: Column): CSSProperties {
  const style: CSSProperties = { ...borderStyle(column.border) };
  const background = themeBackground(column.background, column.backgroundDark);
  if (background) style.background = background;
  if (column.backgroundImage?.enabled && column.backgroundImage.url) {
    style.backgroundImage = `url(${column.backgroundImage.url})`;
    style.backgroundSize = "cover";
    style.backgroundPosition = "center";
  }
  // column.padding is applied responsively via <PaddingStyle> + paddingClass,
  // not inline (it may be a per-breakpoint object).
  if (column.sticky) {
    style.position = "sticky";
    style.top = column.stickyTop ?? "0";
    style.alignSelf = "flex-start";
  }
  // Feed the dynamic mobile order to `order-[var(--kp-order)]`.
  const order = mobileOrderOf(column);
  if (order != null) {
    (style as Record<string, unknown>)["--kp-order"] = order;
  }
  return style;
}

interface Props {
  column: Column;
  collectionsData: CollectionsData;
  /** Items inherited from an ancestor row/column binding. */
  inheritedItems?: TransformedItem[];
  priority?: boolean;
}

/** Render a column: components, nested columns/rows, tab bar, or slider. */
export default function ColumnRenderer({
  column,
  collectionsData,
  inheritedItems,
  priority,
}: Props) {
  if (column.hidden) return null;

  // A column's own data_binding overrides inherited data for its subtree.
  const ownEndpoint = resolveEndpoint(column.data_binding);
  const items = ownEndpoint
    ? collectionsData.get(ownEndpoint) ?? []
    : inheritedItems ?? [];

  const hasStructure =
    !!column.tabBar ||
    !!column.slider ||
    !!column.columns?.length ||
    !!column.rows?.length;
  if (column.hideWhenEmpty && items.length === 0 && !hasStructure) {
    return null;
  }

  let content: ReactNode;

  if (column.includeSection?.slug) {
    content = renderIncludeSection(column, items);
  } else if (column.tabBar && !column.tabBar.hidden) {
    content = renderTabBar(column, items, collectionsData);
  } else if (column.slider) {
    content = renderSlider(column, items, collectionsData);
  } else {
    content = renderBody(column, items, collectionsData, priority);
  }

  // Numbered pager for THIS column (published by resolveBuilderPage). Rendering
  // it here keeps it inside the content column, directly under the listing —
  // instead of after the whole page, below any trailing Taboola/ad row.
  const paginationCtx = getPaginationContext().current;
  const columnPager =
    paginationCtx.columnId && column.id === paginationCtx.columnId
      ? paginationCtx.pager
      : null;

  return (
    <div
      className={cn(
        widthClass(column.width),
        orderClass(column),
        hasPadding(column.padding) && paddingClass(column.id),
      )}
      style={columnStyle(column)}
    >
      <PaddingStyle id={column.id} padding={column.padding} />
      <ColumnHeading heading={column.heading} id={column.id} />
      {content}
      {renderColumnMore(column)}
      {columnPager}
    </div>
  );
}

/** Bottom "more" link for a column — plain text + chevron, no underline.
 *  Sources: heading navigation with `showAtBottom`, or an explicit `column.more`. */
function renderColumnMore(column: Column): ReactNode {
  const nav = column.heading?.navigation;
  const more = column.more;

  let text: string | undefined;
  let target: string | undefined;
  let openInNewTab: boolean | undefined;

  if (nav?.enabled && nav.showAtBottom) {
    text = nav.linkText || column.heading?.text;
    target = nav.pageSlug;
    openInNewTab = nav.openInNewTab;
  } else if (more?.enabled) {
    text = more.text || column.heading?.text;
    target = more.url || more.pageSlug;
    openInNewTab = more.openInNewTab;
  } else {
    return null;
  }

  if (!target && !text) return null;
  const href = target
    ? target.startsWith("/")
      ? target
      : `/${target.replace(/^\/+/, "")}`
    : "#";
  return (
    <NextLink
      href={href}
      target={openInNewTab ? "_blank" : undefined}
      className="mt-4 inline-flex items-center gap-2 font-balootamma2 text-[15px] font-bold leading-none text-333333 no-underline"
    >
      <span>{text || "ಇನ್ನಷ್ಟು"}</span>
      <svg viewBox="0 0 16 16" className="h-[13px] w-[13px]" fill="none" aria-hidden="true">
        <path
          d="M6 4L10 8L6 12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </NextLink>
  );
}

/** Embed a reusable section: resolve its slug to a component type and render it
 *  with the column's bound data. */
function renderIncludeSection(
  column: Column,
  items: TransformedItem[],
): ReactNode {
  const inc = column.includeSection;
  const type = resolveSectionType(inc?.slug);
  if (!type) return null;
  // The widget renders its own header bar (like TrendingSection), titled by the
  // section's name (falling back to its slug).
  const title = inc?.name || inc?.slug || "";
  return (
    <ComponentRenderer
      component={{
        id: inc?.id ?? inc!.slug,
        component_type: type,
        data_config: { mode: "loop" },
        props: { title },
      }}
      items={items}
    />
  );
}

/** Components + nested columns + nested rows. */
function renderBody(
  column: Column,
  items: TransformedItem[],
  collectionsData: CollectionsData,
  priority?: boolean,
): ReactNode {
  const parts: ReactNode[] = [];
  // Column-level `gap` (builder style) applies as CSS gap between the column's
  // children, overriding the default gap-4 / gap-6.
  const gap = cssLength(column.gap);

  if (column.components?.length) {
    parts.push(
      <div
        key="components"
        className="flex flex-col gap-4"
        style={{
          ...(column.justifyContent?.desktop
            ? { justifyContent: column.justifyContent.desktop }
            : {}),
          ...(gap ? { gap } : {}),
        }}
      >
        {column.components.map((component, i) => (
          <PaddingBox key={component.id} id={component.id} padding={component.padding}>
            <ComponentRenderer
              component={component}
              items={items}
              priority={priority && i === 0}
              underline={!!column.componentUnderline?.enabled}
              gap={gap}
              horizontalScroll={columnScroll(column)}
            />
          </PaddingBox>
        ))}
      </div>,
    );
  }

  if (column.columns?.length) {
    parts.push(
      <div
        key="columns"
        className="grid grid-cols-12 gap-8"
        style={gap ? { gap } : undefined}
      >
        {column.columns.map((child) => (
          <ColumnRenderer
            key={child.id}
            column={child}
            collectionsData={collectionsData}
            inheritedItems={items}
            priority={priority}
          />
        ))}
      </div>,
    );
  }

  if (column.rows?.length) {
    parts.push(
      <div
        key="rows"
        className="flex flex-col gap-6"
        style={gap ? { gap } : undefined}
      >
        {column.rows.map((row, i) => (
          <RowRenderer
            key={row.id}
            row={row}
            collectionsData={collectionsData}
            inheritedItems={items}
            priority={priority && i === 0}
          />
        ))}
      </div>,
    );
  }

  return <>{parts}</>;
}

/** Pre-render each tab's rows on the server; hand panels to the client TabBar. */
function renderTabBar(
  column: Column,
  items: TransformedItem[],
  collectionsData: CollectionsData,
): ReactNode {
  const bar = column.tabBar!;
  const tabs = bar.tabs.filter((t) => !t.hidden);
  const panels = tabs.map((tab) => (
    <div className="flex flex-col gap-6">
      {tab.rows.map((row) => (
        <RowRenderer
          key={row.id}
          row={row}
          collectionsData={collectionsData}
          inheritedItems={items}
        />
      ))}
    </div>
  ));

  // Mark the tab whose `sectionUrl` matches the current page URL active. Those
  // tabs also become links (navigational section tabs). Falls back to the
  // builder's configured default tab when nothing matches.
  const currentPath = normalizePathname(
    getBuilderRequestContext().current.pathname,
  );
  const urlMatch = tabs.find(
    (t) =>
      t.sectionUrlEnabled &&
      t.sectionUrl &&
      normalizePathname(t.sectionUrl) === currentPath,
  );

  return (
    <TabBar
      tabs={tabs.map((t) => ({
        id: t.id,
        label: t.label,
        href:
          t.sectionUrlEnabled && t.sectionUrl
            ? normalizePathname(t.sectionUrl)
            : undefined,
      }))}
      panels={panels}
      defaultActiveId={urlMatch?.id ?? bar.defaultActiveTab}
      position={bar.tabPosition}
      sticky={bar.stickyTabs}
      stickyTop={bar.stickyTop}
      styleVars={{
        textColor: bar.tabTextColor,
        activeTextColor: bar.tabActiveTextColor,
        activeBg: bar.tabActiveBackgroundColor,
        inactiveBg: bar.tabInactiveBackgroundColor,
        activeBorder: bar.tabActiveBorderColor,
        fontSize: bar.tabFontSize,
      }}
    />
  );
}

/** Pre-render each slide's rows on the server; hand slides to the client Slider. */
function renderSlider(
  column: Column,
  items: TransformedItem[],
  collectionsData: CollectionsData,
): ReactNode {
  const slider = column.slider!;
  const slides = slider.rows.map((row) => (
    <RowRenderer
      key={row.id}
      row={row}
      collectionsData={collectionsData}
      inheritedItems={items}
    />
  ));

  return (
    <Slider
      slides={slides}
      autoPlay={slider.autoPlay}
      autoPlayInterval={slider.autoPlayInterval}
      showDots={slider.showDots}
      showArrows={slider.showArrows}
      loop={slider.loop}
      perView={slider.slidesToShow?.desktop ?? 1}
    />
  );
}
