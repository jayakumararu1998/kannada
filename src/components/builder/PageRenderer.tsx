import type { CollectionsData, PageJSON } from "@/lib/builder/types";
import { getPageHeadingContext } from "@/lib/builder/page-heading-context";

import PageHeading from "./PageHeading";
import SectionRenderer from "./SectionRenderer";

interface Props {
  page: PageJSON;
  collectionsData: CollectionsData;
  /** URL-matched section (name + url) for a `section_bind` heading/breadcrumb. */
  section?: { name?: string; url?: string };
}

/** component_type values that render the page heading at their own position. */
const HEADING_COMPONENTS = new Set(["PageMainHeading", "Breadcrumb", "Breadcrumbs"]);

/** Does the layout contain a PageMainHeading/Breadcrumb component anywhere? */
function layoutHasHeadingComponent(page: PageJSON): boolean {
  let found = false;
  const walk = (node: unknown): void => {
    if (found || !node) return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (typeof node === "object") {
      const obj = node as Record<string, unknown>;
      if (HEADING_COMPONENTS.has(String(obj.component_type ?? ""))) {
        found = true;
        return;
      }
      for (const v of Object.values(obj)) {
        if (v && typeof v === "object") walk(v);
      }
    }
  };
  walk(page.sections ?? []);
  return found;
}

/** Top-level renderer: page heading + all sections. Full-width (no max-width);
 *  the surrounding <main> is provided by SiteChrome, so this is a plain <div>. */
export default function PageRenderer({ page, collectionsData, section }: Props) {
  // Publish the page-level heading config so a PageMainHeading/Breadcrumb
  // component placed inside the layout can render it at ITS position.
  const placedInLayout = layoutHasHeadingComponent(page);
  getPageHeadingContext().current = {
    heading: page.pageHeading,
    section,
    placedInLayout,
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-[60px] py-6">
      {/* Only render the default top heading when the layout DOESN'T carry its
          own PageMainHeading — otherwise it would appear twice. */}
      {!placedInLayout && (
        <PageHeading heading={page.pageHeading} section={section} />
      )}
      <div className="flex flex-col gap-8">
        {(page.sections ?? []).map((section, i) => (
          <SectionRenderer
            key={section.id}
            section={section}
            collectionsData={collectionsData}
            isFirst={i === 0}
          />
        ))}
      </div>
    </div>
  );
}
