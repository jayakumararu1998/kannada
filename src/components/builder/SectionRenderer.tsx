import type { CollectionsData, Section } from "@/lib/builder/types";

import RowRenderer from "./RowRenderer";

interface Props {
  section: Section;
  collectionsData: CollectionsData;
  /** True for the first section on the page (drives LCP priority). */
  isFirst?: boolean;
}

/** Render a section's rows in order. */
export default function SectionRenderer({
  section,
  collectionsData,
  isFirst,
}: Props) {
  return (
    <section className="flex flex-col gap-6" data-section={section.name}>
      {section.rows.map((row, i) => (
        <RowRenderer
          key={row.id}
          row={row}
          collectionsData={collectionsData}
          // First TWO rows: builder pages often lead with an image-less strip
          // (trending chips, heading) — the LCP card sits in the next row.
          priority={isFirst && i <= 1}
        />
      ))}
    </section>
  );
}
