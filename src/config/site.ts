/**
 * SINGLE source of truth for site-wide brand / locale / navigation config.
 *
 * This is the ONE file to edit when cloning this project for another
 * language site (e.g. Tamil, Telugu, Malayalam).
 */

export interface NavItem {
  label: string;
  href: string;
}

export interface SiteConfig {
  /** Brand name in the site's own language (display). */
  name: string;
  /** Brand name in English/Latin (for meta, analytics, alt text). */
  nameEn: string;
  /** BCP-47 language code used in <html lang>. */
  locale: string;
  /** Canonical site URL. */
  url: string;
  /** Default site description for SEO. */
  description: string;
  /** Primary navigation items. */
  nav: NavItem[];
}

export const siteConfig: SiteConfig = {
  name: "ಕನ್ನಡಪ್ರಭ",
  nameEn: "Kannada Prabha",
  locale: "kn",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.kannadaprabha.com",
  description:
    "ಕನ್ನಡಪ್ರಭ — ಕನ್ನಡ ಸುದ್ದಿ, ರಾಜಕೀಯ, ಕ್ರೀಡೆ, ಸಿನಿಮಾ ಮತ್ತು ಇನ್ನಷ್ಟು.",
  nav: [],
};
