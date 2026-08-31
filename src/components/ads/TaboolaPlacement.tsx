import { resolveTaboolaPlacement } from "@/lib/builder/taboola";

import TaboolaSlot from "./TaboolaSlot";

/**
 * Server wrapper: resolve the builder Taboola config for a (pageType, position)
 * and render the lazy client `TaboolaSlot`. Renders nothing when the feature is
 * off or that placement has no configured code. Shared by the dynamic page
 * builder (`widget_type:"taboola"`) and the article template
 * (`ArticleTaboolaBottom` / `ArticleTaboolaRightRail`).
 */
export default function TaboolaPlacement({
  pageType,
  position,
  className,
  sticky,
}: {
  pageType?: string;
  position?: string;
  className?: string;
  /** Stick the placement to the top of the viewport (e.g. the article right rail). */
  sticky?: boolean;
}) {
  const placement = resolveTaboolaPlacement({ pageType, position });
  if (!placement) return null;
  const slot = (
    <TaboolaSlot
      html={placement.html}
      headerCode={placement.headerCode}
      flushCode={placement.flushCode}
      className={className}
    />
  );
  return sticky ? <div className="lg:sticky lg:top-4">{slot}</div> : slot;
}
