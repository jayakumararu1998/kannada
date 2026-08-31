import "server-only";

/**
 * Resolved site-wide application config for SEO / social / structured data.
 *
 * Layers builder-synced `website-settings` (store, slug-keyed) OVER the static
 * Kannada Prabha defaults in `siteConfig`. This is the ONE place that knows the
 * brand's canonical URL, logo, default OG image and social handles, so the
 * schema builders and the social-meta resolver stay in sync.
 *
 * Editors can override any of these from the builder by pushing a website-setting
 * with the matching slug (e.g. `site-logo`, `og-image`, `twitter-handle`,
 * `social-handles`) — no redeploy needed.
 */

import { siteConfig } from "@/config/site";

import { getStore } from "@/lib/builder/store";

export interface PostalAddressConfig {
  streetAddress: string;
  addressLocality: string;
  addressRegion: string;
  postalCode: string;
  addressCountry: string;
}

export interface ContactPointConfig {
  contactType: string;
  telephone?: string;
  email?: string;
  /** Named person for e.g. the grievance officer. */
  name?: string;
  description?: string;
}

export interface AppConfig {
  siteName: string;
  siteNameEn: string;
  siteUrl: string;
  locale: string;
  /** OG locale (e.g. "kn_IN"). */
  ogLocale: string;
  description: string;
  logoUrl: string;
  /** Default social share image (1200×630). */
  defaultOgImage: string;
  twitterHandle: string;
  /** Organization sameAs profile URLs. */
  sameAs: string[];
  // ── Publisher identity (Organization / About / Contact schema) ─────────────
  /** Registered legal entity name. */
  legalName: string;
  /** Founding date — ISO or year. */
  foundingDate: string;
  /** Brand tagline. */
  slogan: string;
  /** Parent company name (Organization). */
  parentOrganization: string;
  /** Primary switchboard number, shown on the Organization contactPoint. */
  telephone: string;
  /** Languages the newsroom serves (availableLanguage). */
  availableLanguage: string[];
  address: PostalAddressConfig;
  /** Distinct contact pathways for the Contact page (ContactPoint[]). */
  contactPoints: ContactPointConfig[];
  /** Logo intrinsic dimensions (Google recommends ImageObject width/height). */
  logoWidth: number;
  logoHeight: number;
  /** Editorial E-E-A-T policy page URLs (NewsMediaOrganization). */
  editorialPolicies: Partial<
    Record<
      | "ethicsPolicy"
      | "correctionsPolicy"
      | "diversityPolicy"
      | "unnamedSourcesPolicy"
      | "ownershipFundingInfo"
      | "masthead"
      | "actionableFeedbackPolicy"
      | "publishingPrinciples",
      string
    >
  >;
}

const SITE_URL = siteConfig.url.replace(/\/+$/, "");

/** Static fallbacks — the current Kannada Prabha application config. */
const DEFAULTS: AppConfig = {
  siteName: siteConfig.name,
  siteNameEn: siteConfig.nameEn,
  siteUrl: SITE_URL,
  locale: siteConfig.locale,
  ogLocale: "kn_IN",
  description: siteConfig.description,
  logoUrl: `${SITE_URL}/logo.png`,
  defaultOgImage: `${SITE_URL}/logo.png`,
  twitterHandle: "@KannadaPrabha",
  sameAs: [
    "https://www.facebook.com/KannadaPrabhaOnline/",
    "https://twitter.com/KannadaPrabha",
    "https://www.instagram.com/kannadaprabha/",
    "https://www.youtube.com/user/kannadaprabhaonline",
    "https://www.whatsapp.com/channel/0029VagP9G03GJOy4fmSp30M",
  ],
  legalName: "Kannada Prabha Publications Ltd.",
  foundingDate: "1967-11-04",
  slogan: "The Most Trusted Kannada Daily",
  parentOrganization: "The New Indian Express Group",
  telephone: "080-22866893-96",
  availableLanguage: ["Kannada", "English"],
  address: {
    streetAddress:
      "Express Building, No. 1, Queen's Road, opp. Institute of Engineers, Ambedkar Veedhi, Vasanth Nagar",
    addressLocality: "Bengaluru",
    addressRegion: "Karnataka",
    postalCode: "560001",
    addressCountry: "IN",
  },
  contactPoints: [
    {
      contactType: "customer service",
      telephone: "080-22866893-96",
    },
    {
      contactType: "Newsroom & Editorial",
      email: "editor@kannadaprabha.com",
    },
    {
      contactType: "Advertising & Sales",
      email: "ads@kannadaprabha.com",
    },
    {
      contactType: "Grievance Redressal Officer",
      email: "grievance@kannadaprabha.com",
      description:
        "Contact for complaints under the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules.",
    },
    {
      contactType: "Customer Support & Subscriptions",
      email: "circulation@kannadaprabha.com",
    },
  ],
  logoWidth: 600,
  logoHeight: 60,
  editorialPolicies: {
    ethicsPolicy: `${SITE_URL}/ethics-policy`,
    correctionsPolicy: `${SITE_URL}/corrections-policy`,
    diversityPolicy: `${SITE_URL}/diversity-policy`,
    unnamedSourcesPolicy: `${SITE_URL}/anonymous-sources-policy`,
    ownershipFundingInfo: `${SITE_URL}/ownership-and-funding`,
    masthead: `${SITE_URL}/masthead`,
    actionableFeedbackPolicy: `${SITE_URL}/feedback`,
    publishingPrinciples: `${SITE_URL}/editorial-guidelines`,
  },
};

/** Read a website-setting's scalar value (`{value}` wrapper or bare). */
function settingValue(slug: string): unknown {
  const s = getStore().getWebsiteSetting(slug);
  if (s == null) return undefined;
  return "value" in s ? s.value : s;
}

function str(slug: string): string | undefined {
  const v = settingValue(slug);
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

/** Resolve the effective app config (builder settings over defaults). */
export function getAppConfig(): AppConfig {
  const handles = settingValue("social-handles");
  let sameAs = DEFAULTS.sameAs;
  if (Array.isArray(handles)) {
    sameAs = handles.filter((h): h is string => typeof h === "string");
  } else if (handles && typeof handles === "object") {
    sameAs = Object.values(handles as Record<string, unknown>).filter(
      (h): h is string => typeof h === "string",
    );
  }

  // Deep-object overrides (address / contactPoints) are taken wholesale from a
  // website-setting when present, else the static defaults.
  const addrOverride = settingValue("org-address");
  const address =
    addrOverride &&
    typeof addrOverride === "object" &&
    !Array.isArray(addrOverride)
      ? {
          ...DEFAULTS.address,
          ...(addrOverride as Partial<PostalAddressConfig>),
        }
      : DEFAULTS.address;

  const cpOverride = settingValue("contact-points");
  const contactPoints =
    Array.isArray(cpOverride) && cpOverride.length
      ? (cpOverride as ContactPointConfig[])
      : DEFAULTS.contactPoints;

  const policyOverride = settingValue("editorial-policies");
  const editorialPolicies =
    policyOverride &&
    typeof policyOverride === "object" &&
    !Array.isArray(policyOverride)
      ? {
          ...DEFAULTS.editorialPolicies,
          ...(policyOverride as AppConfig["editorialPolicies"]),
        }
      : DEFAULTS.editorialPolicies;

  return {
    siteName: str("site-name") ?? DEFAULTS.siteName,
    siteNameEn: str("site-name-en") ?? DEFAULTS.siteNameEn,
    siteUrl: (str("site-url") ?? DEFAULTS.siteUrl).replace(/\/+$/, ""),
    locale: str("locale") ?? DEFAULTS.locale,
    ogLocale: str("og-locale") ?? DEFAULTS.ogLocale,
    description: str("site-description") ?? DEFAULTS.description,
    logoUrl: str("site-logo") ?? DEFAULTS.logoUrl,
    defaultOgImage:
      str("og-image") ?? str("site-logo") ?? DEFAULTS.defaultOgImage,
    twitterHandle: str("twitter-handle") ?? DEFAULTS.twitterHandle,
    sameAs,
    legalName: str("legal-name") ?? DEFAULTS.legalName,
    foundingDate: str("founding-date") ?? DEFAULTS.foundingDate,
    slogan: str("slogan") ?? DEFAULTS.slogan,
    parentOrganization:
      str("parent-organization") ?? DEFAULTS.parentOrganization,
    telephone: str("telephone") ?? DEFAULTS.telephone,
    availableLanguage: DEFAULTS.availableLanguage,
    logoWidth: DEFAULTS.logoWidth,
    logoHeight: DEFAULTS.logoHeight,
    address,
    contactPoints,
    editorialPolicies,
  };
}
