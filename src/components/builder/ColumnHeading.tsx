import type { CSSProperties } from "react";

import WhiteBarRightButton from "@/components/ui/WhiteBarRightButton";
import { hasPadding, spacingStyle } from "@/lib/builder/padding";
import { alignClass, fontWeight } from "@/lib/builder/style";
import type { ColumnHeading as ColumnHeadingType } from "@/lib/builder/types";

/**
 * A row/column heading, rendered with the WhiteBarRightButton bar. Honours the
 * heading style properties (color / fontSize / fontWeight / align), the
 * builder-configured padding/margin, and shows the "more" control as a link when
 * navigation is enabled.
 */
export default function ColumnHeading({
  heading,
  id = "col",
}: {
  heading?: ColumnHeadingType;
  /** Column id — namespaces the scoped padding/margin style. */
  id?: string;
}) {
  if (!heading?.enabled || !heading.text) return null;

  // Builder-configured responsive padding + margin around the heading strip.
  // Keep the default bottom margin only when no margin is explicitly configured.
  const spacing = spacingStyle(id, heading.padding, heading.margin);
  const wrapClass =
    [spacing.className, hasPadding(heading.margin) ? "" : "mb-3"]
      .filter(Boolean)
      .join(" ") || undefined;

  const titleStyle: CSSProperties = {
    color: heading.color,
    fontSize: heading.fontSize,
    fontWeight: fontWeight(heading.fontWeight),
  };

  const nav = heading.navigation;
  // When showAtBottom is set, the "more" link renders below the column
  // (ColumnRenderer), not in the heading bar — so hide the top control.
  const showMore = Boolean(nav?.enabled && nav?.pageSlug && !nav?.showAtBottom);
  const href =
    showMore && nav?.pageSlug
      ? nav.pageSlug.startsWith("/")
        ? nav.pageSlug
        : `/${nav.pageSlug}`
      : undefined;

  return (
    <div className={wrapClass}>
      {spacing.style}
      <WhiteBarRightButton
        title={heading.text}
        titleStyle={titleStyle}
        titleClassName={alignClass(heading.align)}
        buttonLabel={nav?.linkText || "ಎಲ್ಲಾ ನೋಡಿ"}
        href={href}
        openInNewTab={nav?.openInNewTab}
        showButton={showMore}
      />
      {heading.showDivider && (
        <div className="mt-2 h-px w-full bg-[var(--color-D2D2D2)]" />
      )}
    </div>
  );
}
