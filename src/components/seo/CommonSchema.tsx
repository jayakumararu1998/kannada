import { getHeaderMenu } from "@/lib/builder/menu";
import {
  generateOrganizationSchema,
  generateSiteNavigationSchema,
  generateWebSiteSchema,
} from "@/lib/seo/schema";

import SchemaMarkup from "./SchemaMarkup";

/**
 * Site-wide JSON-LD emitted on every page: Organization (publisher), WebSite
 * (with sitelinks SearchAction) and SiteNavigationElement (header menu).
 * Rendered from the root layout.
 */
export default function CommonSchema() {
  const nav = getHeaderMenu().map((n) => ({ label: n.title, href: n.url }));
  const schemas = [
    generateOrganizationSchema(),
    generateWebSiteSchema(),
    generateSiteNavigationSchema(nav),
  ].filter(Boolean) as Record<string, unknown>[];

  return <SchemaMarkup schema={schemas} />;
}
