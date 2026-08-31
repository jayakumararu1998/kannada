import type { CSSProperties } from "react";

import { resolveEndpoint } from "@/lib/builder/fetch";
import { borderStyle } from "@/lib/builder/style";
import { PaddingStyle, hasPadding, paddingClass } from "@/lib/builder/padding";
import { cn } from "@/lib/utils";
import type {
  CollectionsData,
  Row,
  TransformedItem,
} from "@/lib/builder/types";

import ColumnHeading from "./ColumnHeading";
import ColumnRenderer from "./ColumnRenderer";

interface Props {
  row: Row;
  collectionsData: CollectionsData;
  /** Items inherited from an ancestor column (for nested rows). */
  inheritedItems?: TransformedItem[];
  priority?: boolean;
}

/** Render a row as a 12-column grid, feeding row-level binding data downward. */
export default function RowRenderer({
  row,
  collectionsData,
  inheritedItems,
  priority,
}: Props) {
  if (row.hidden) return null;

  // A row's own data_binding takes precedence over inherited items.
  const endpoint = resolveEndpoint(row.data_binding);
  const rowItems = endpoint
    ? collectionsData.get(endpoint) ?? []
    : inheritedItems;

  // Responsive padding (mobile/tablet/desktop) is applied via a scoped <style>
  // + class — NOT inline style, which can't do the per-breakpoint object form.
  const style: CSSProperties = { ...borderStyle(row.border) };

  return (
    <div
      className={cn(hasPadding(row.padding) && paddingClass(row.id))}
      style={style}
    >
      <PaddingStyle id={row.id} padding={row.padding} />
      <ColumnHeading heading={row.heading} id={row.id} />
      <div className="grid grid-cols-12 gap-8">
        {row.columns.map((column) => (
          <ColumnRenderer
            key={column.id}
            column={column}
            collectionsData={collectionsData}
            inheritedItems={rowItems}
            priority={priority}
          />
        ))}
      </div>
    </div>
  );
}
