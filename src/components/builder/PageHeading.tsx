import type { CSSProperties } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { themeColor } from "@/lib/builder/style";
import type {
  BreadcrumbConfig,
  PageHeading as PageHeadingType,
} from "@/lib/builder/types";

/**
 * Page-level header — breadcrumb trail + configurable heading, ported from
 * dinamani's PageHeader/Breadcrumbs. Server-rendered (no theme/tab context).
 *
 * The heading text and the breadcrumb's current-page label can be bound to the
 * URL-matched section (`sourceType: "section_bind"`); the resolved section name
 * + url are passed in via `section`. All colours/sizes/margins/divider come from
 * the builder config and are applied as inline CSS (the builder emits arbitrary
 * values Tailwind can't produce statically).
 */

interface SectionInfo {
  name?: string;
  url?: string;
}

const ALIGN: Record<string, "left" | "center" | "right"> = {
  left: "left",
  center: "center",
  right: "right",
};

/** Resolve the heading text: explicit `text` wins, else the bound section name. */
function resolveHeadingText(
  heading: PageHeadingType,
  section?: SectionInfo,
): string {
  if (heading.text) return heading.text;
  const src = heading.sourceType;
  if ((src === "section_bind" || src === "page_bind") && section?.name) {
    return section.name;
  }
  return "";
}

function Breadcrumbs({
  config,
  section,
}: {
  config: BreadcrumbConfig;
  section?: SectionInfo;
}) {
  if (!config.enabled) return null;

  const separator = config.separator || "/";
  const navStyle: CSSProperties = {
    fontSize: config.fontSize || "14px",
    color: themeColor(config.color || "#666666"),
    fontWeight: config.fontWeight || 500,
    marginBottom: config.showDivider ? 0 : config.marginBottom || "8px",
  };
  const linkStyle: CSSProperties = {
    color: themeColor(config.color || "#666666"),
  };
  const activeStyle: CSSProperties = {
    color: themeColor(config.activeColor || config.color || "#000000"),
  };

  const elements: React.ReactNode[] = [];

  // Home
  if (config.showHome !== false) {
    elements.push(
      <Link key="home" href={config.homeUrl || "/"} className="hover:underline" style={linkStyle}>
        {config.homeLabel || "ಮುಖಪುಟ"}
      </Link>,
    );
  }

  // Static/dynamic trail items (dynamic labelField isn't used by the current
  // section template, but static label/url items are honoured).
  (config.items ?? []).forEach((item, i) => {
    const label = item.label || "";
    if (!label) return;
    const url = item.url || "";
    elements.push(
      url ? (
        <Link key={`i-${i}`} href={url} className="hover:underline" style={linkStyle}>
          {label}
        </Link>
      ) : (
        <span key={`i-${i}`} style={linkStyle}>
          {label}
        </span>
      ),
    );
  });

  // Current page — explicit label, else the bound section name.
  if (config.showCurrentPage !== false) {
    let currentLabel = config.currentPageLabel || "";
    if (!currentLabel && config.currentPageSourceType && section?.name) {
      currentLabel = section.name;
    }
    if (currentLabel) {
      elements.push(
        <span key="current" style={activeStyle}>
          {currentLabel}
        </span>,
      );
    }
  }

  if (elements.length === 0) return null;

  const dividerStyle: CSSProperties | undefined = config.showDivider
    ? {
        borderBottom: `1px solid ${themeColor(config.dividerColor || "#e5e7eb")}`,
        width: config.dividerWidth || "100%",
        marginTop: config.dividerMarginTop || "8px",
        marginBottom: config.marginBottom || "8px",
      }
    : undefined;

  return (
    <>
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center py-2" style={navStyle}>
        {elements.map((el, i) => (
          <span key={i} className="inline-flex items-center">
            {i > 0 && <span className="mx-1 text-808080">{separator}</span>}
            {el}
          </span>
        ))}
      </nav>
      {dividerStyle && <div style={dividerStyle} />}
    </>
  );
}

/** Optional page-level heading (+ breadcrumb) rendered above the sections. */
export default function PageHeading({
  heading,
  section,
  parts = "both",
}: {
  heading?: PageHeadingType;
  section?: SectionInfo;
  /** Which pieces to render: both, just the heading, or just the breadcrumb.
   *  Set by a PageMainHeading/Breadcrumb component's `props.parts`. */
  parts?: "both" | "heading" | "breadcrumb";
}) {
  if (!heading?.enabled) return null;

  const showHeading = parts !== "breadcrumb";
  const showCrumbs = parts !== "heading";

  const text = showHeading ? resolveHeadingText(heading, section) : "";
  const hasBreadcrumb = showCrumbs && !!heading.breadcrumbs?.enabled;
  if (!text && !hasBreadcrumb) return null;

  // Section/category pages already carry an <h1> in their story cards, so the
  // page heading is demoted to at least <h2> to avoid two <h1>s on the page.
  // (Visual size is set by the inline style / Tailwind, independent of the tag.)
  const configuredLevel = heading.level ?? 1;
  const level =
    heading.sourceType === "section_bind"
      ? Math.max(2, configuredLevel)
      : configuredLevel;
  const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;

  const headingStyle: CSSProperties = {
    color: themeColor(heading.color || "#020202"),
    textAlign: ALIGN[heading.align ?? "left"],
    fontWeight: heading.fontWeight || 700,
    marginTop: heading.marginTop || 0,
    marginBottom: heading.marginBottom || "16px",
    ...(heading.padding ? { padding: heading.padding } : {}),
    ...(heading.fontSize ? { fontSize: heading.fontSize } : {}),
  };

  const wrapperStyle: CSSProperties | undefined = heading.showDivider
    ? {
        borderBottom: `1px solid ${themeColor(heading.dividerColor || "#E8E8E8")}`,
        width: heading.dividerWidth || "100%",
      }
    : undefined;

  return (
    <div style={wrapperStyle}>
      {hasBreadcrumb && (
        <Breadcrumbs config={heading.breadcrumbs!} section={section} />
      )}
      {text && (
        <Tag
          className={cn(
            // Font family/size fall back to Tailwind when the config omits them.
            !heading.fontSize && "text-2xl leading-tight",
            "font-manrope",
            heading.customClass,
          )}
          style={headingStyle}
        >
          {text}
        </Tag>
      )}
    </div>
  );
}
