import "server-only";

/**
 * schema.org JSON-LD builders (ported from dinamani, adapted to Kannada Prabha).
 *
 * Common site-wide schemas (Organization / WebSite / SiteNavigation) plus
 * per-page-type builders (WebPage, BreadcrumbList, NewsArticle, VideoObject,
 * LiveBlogPosting). Every builder returns a plain object (or object[]) that the
 * <SchemaMarkup> component serializes into a <script type="application/ld+json">.
 *
 * Brand constants come from getAppConfig() so a builder website-setting can
 * override the site name / logo / social handles without a redeploy.
 */

import { toMediaUrl } from "@/lib/images";
import {
  extractMetaDescription,
  sectionPath,
  type Story,
} from "@/lib/api/stories";

import { getAppConfig } from "./app-config";

export interface BreadcrumbItem {
  name: string;
  url: string;
}

type JsonLd = Record<string, unknown>;

const CONTEXT = "https://schema.org";

function abs(url: string, base: string): string {
  if (!url) return base;
  if (/^https?:\/\//i.test(url)) return url;
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

function toIso(ts?: string | number): string | undefined {
  if (ts == null || ts === "") return undefined;
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

/** ImageObject logo node (with intrinsic dimensions) shared across schema. */
function logoNode(withId = false): JsonLd {
  const c = getAppConfig();
  return {
    "@type": "ImageObject",
    ...(withId ? { "@id": `${c.siteUrl}/#logo` } : {}),
    url: c.logoUrl,
    contentUrl: c.logoUrl,
    width: c.logoWidth,
    height: c.logoHeight,
  };
}

/** PostalAddress node shared by Organization / About / Contact schema. */
function addressNode(): JsonLd {
  const c = getAppConfig();
  return {
    "@type": "PostalAddress",
    streetAddress: c.address.streetAddress,
    addressLocality: c.address.addressLocality,
    addressRegion: c.address.addressRegion,
    postalCode: c.address.postalCode,
    addressCountry: c.address.addressCountry,
  };
}

/** ContactPoint[] built from the configured contact pathways. */
function contactPointNodes(): JsonLd[] {
  const c = getAppConfig();
  return c.contactPoints.map((cp) => ({
    "@type": "ContactPoint",
    contactType: cp.contactType,
    ...(cp.telephone ? { telephone: cp.telephone } : {}),
    ...(cp.email ? { email: cp.email } : {}),
    ...(cp.name ? { name: cp.name } : {}),
    ...(cp.description ? { description: cp.description } : {}),
    availableLanguage: c.availableLanguage,
  }));
}

/** Organization (NewsMediaOrganization) — the site-wide publisher record. */
export function generateOrganizationSchema(): JsonLd {
  const c = getAppConfig();
  return {
    "@context": CONTEXT,
    "@type": "NewsMediaOrganization",
    "@id": `${c.siteUrl}/#organization`,
    name: c.siteNameEn,
    alternateName: c.siteName,
    legalName: c.legalName,
    url: `${c.siteUrl}/`,
    foundingDate: c.foundingDate,
    slogan: c.slogan,
    logo: logoNode(true),
    image: c.logoUrl,
    address: addressNode(),
    contactPoint: {
      "@type": "ContactPoint",
      telephone: c.telephone,
      contactType: "customer service",
      availableLanguage: c.availableLanguage,
    },
    parentOrganization: {
      "@type": "Organization",
      name: c.parentOrganization,
    },
    ...c.editorialPolicies,
    sameAs: c.sameAs,
  };
}

/** WebSite + sitelinks SearchAction. */
export function generateWebSiteSchema(): JsonLd {
  const c = getAppConfig();
  return {
    "@context": CONTEXT,
    "@type": "WebSite",
    "@id": `${c.siteUrl}/#website`,
    name: c.siteName,
    alternateName: c.siteNameEn,
    url: `${c.siteUrl}/`,
    inLanguage: c.locale,
    publisher: { "@id": `${c.siteUrl}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${c.siteUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** SiteNavigationElement from the header nav items. */
export function generateSiteNavigationSchema(
  items: Array<{ label: string; href: string }>,
): JsonLd | null {
  const c = getAppConfig();
  const clean = (items ?? []).filter((i) => i?.label && i?.href);
  if (!clean.length) return null;
  return {
    "@context": CONTEXT,
    "@type": "SiteNavigationElement",
    name: clean.map((i) => i.label),
    url: clean.map((i) => abs(i.href, c.siteUrl)),
  };
}

/** BreadcrumbList. */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]): JsonLd {
  const c = getAppConfig();
  return {
    "@context": CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: abs(it.url, c.siteUrl),
    })),
  };
}

export interface WebPageSchemaInput {
  name: string;
  url: string;
  description?: string;
}

/** WebPage. */
export function generateWebPageSchema(input: WebPageSchemaInput): JsonLd {
  const c = getAppConfig();
  const url = abs(input.url, c.siteUrl);
  return {
    "@context": CONTEXT,
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    name: input.name,
    url,
    description: input.description || c.description,
    inLanguage: c.locale,
    isPartOf: { "@id": `${c.siteUrl}/#website` },
    publisher: { "@id": `${c.siteUrl}/#organization` },
  };
}

export interface ArticleSchemaInput {
  headline: string;
  description?: string;
  url: string;
  image?: string;
  datePublished?: string | number;
  dateModified?: string | number;
  authors?: Array<{ name: string; url?: string }>;
  section?: string;
  keywords?: string[];
}

/**
 * Google recommends supplying the article image in several aspect ratios
 * (16:9, 4:3, 1:1) for Top Stories / Discover eligibility. The media host
 * (media.kannadaprabha.com) is a Quintype/gumlet CDN that crops via `w`/`h`
 * query params; a CDN that ignores them simply returns the source image, so the
 * URLs stay valid either way. Only expand real, query-less media URLs — the
 * fallback logo/OG image is emitted as-is.
 */
function articleImages(image: string): string[] {
  if (!/^https?:\/\//i.test(image) || image.includes("?")) return [image];
  const w = 1200;
  const ratios: Array<[number, number]> = [
    [16, 9],
    [4, 3],
    [1, 1],
  ];
  return ratios.map(
    ([rw, rh]) => `${image}?w=${w}&h=${Math.round((w * rh) / rw)}&fit=crop`,
  );
}

/** NewsArticle (Google News compliant). */
export function generateNewsArticleSchema(input: ArticleSchemaInput): JsonLd {
  const c = getAppConfig();
  const url = abs(input.url, c.siteUrl);
  const image = input.image || c.defaultOgImage;
  const published = toIso(input.datePublished);
  return {
    "@context": CONTEXT,
    "@type": "NewsArticle",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: input.headline?.slice(0, 110),
    description: input.description,
    image: articleImages(image),
    ...(published ? { datePublished: published } : {}),
    dateModified: toIso(input.dateModified) || published,
    author:
      input.authors && input.authors.length
        ? input.authors.map((a) => ({
            "@type": "Person",
            name: a.name,
            ...(a.url ? { url: abs(a.url, c.siteUrl) } : {}),
          }))
        : { "@type": "Organization", name: c.siteNameEn },
    publisher: {
      "@type": "Organization",
      name: c.siteNameEn,
      logo: { "@type": "ImageObject", url: c.logoUrl },
    },
    ...(input.section ? { articleSection: input.section } : {}),
    ...(input.keywords && input.keywords.length
      ? { keywords: input.keywords.join(", ") }
      : {}),
    inLanguage: c.locale,
  };
}

/** VideoObject (paired with NewsArticle for video stories). */
export function generateVideoObjectSchema(input: {
  name: string;
  description?: string;
  thumbnail?: string;
  uploadDate?: string | number;
  contentUrl?: string;
  embedUrl?: string;
}): JsonLd {
  const c = getAppConfig();
  return {
    "@context": CONTEXT,
    "@type": "VideoObject",
    name: input.name,
    description: input.description || c.description,
    thumbnailUrl: [input.thumbnail || c.defaultOgImage],
    uploadDate: toIso(input.uploadDate),
    ...(input.contentUrl ? { contentUrl: input.contentUrl } : {}),
    ...(input.embedUrl ? { embedUrl: input.embedUrl } : {}),
  };
}

// ── Story-driven composites (per-page-type) ─────────────────────────────────

function storyToArticleInput(story: Story, slug: string): ArticleSchemaInput {
  const image = story["hero-image-s3-key"]
    ? toMediaUrl(story["hero-image-s3-key"])
    : undefined;
  return {
    headline: story.headline || story.title || "",
    description:
      story.seo?.["meta-description"] ||
      story.summary ||
      story.subheadline ||
      extractMetaDescription(story),
    url: `/${slug}`,
    image,
    datePublished: story["first-published-at"] || story["published-at"],
    dateModified:
      story["last-published-at"] ||
      story["updated-at"] ||
      story["published-at"],
    authors: (story.authors ?? [])
      .map((a: { name?: string; slug?: string }) => ({
        name: a?.name ?? "",
        url: a?.slug ? `/author/${a.slug}` : undefined,
      }))
      .filter((a: { name: string }) => a.name),
    section: story.sections?.[0]?.name,
    keywords:
      story.seo?.["meta-keywords"] ||
      (story.tags ?? []).map((t: { name?: string }) => t?.name).filter(Boolean),
  };
}

function storyBreadcrumbs(story: Story, slug: string): BreadcrumbItem[] {
  const c = getAppConfig();
  const crumbs: BreadcrumbItem[] = [{ name: c.siteName, url: `${c.siteUrl}/` }];
  const section = story.sections?.[0];
  if (section?.name) {
    crumbs.push({
      name: section.name,
      url: abs(sectionPath(story) || `/${section.slug ?? ""}`, c.siteUrl),
    });
  }
  crumbs.push({ name: story.headline || "", url: `${c.siteUrl}/${slug}` });
  return crumbs;
}

/** Plain text from an HTML/marked-up snippet. */
function stripHtml(s: unknown): string {
  return String(s ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * BlogPosting updates for a live-blog story — one per card, newest first, each
 * carrying its own datePublished (doc §8). Quintype live-blog cards hold the
 * timeline; a card's title element (or its first text) becomes the update
 * headline and the text elements the articleBody.
 */
function storyLiveBlogUpdates(story: Story, limit = 30): JsonLd[] {
  const cards = story.cards ?? [];
  const updates: JsonLd[] = [];
  for (const card of cards) {
    const els = (card["story-elements"] ?? []) as Array<Record<string, any>>;
    const titleEl = els.find(
      (e) => e.type === "title" || e.subtype === "title",
    );
    const headline =
      stripHtml(titleEl?.text) ||
      stripHtml(card.metadata?.attributes?.title) ||
      undefined;
    const body = els
      .filter((e) => (e.type === "text" || e.type === "cs-tag") && e.text)
      .map((e) => stripHtml(e.text))
      .join(" ")
      .trim();
    const published = toIso(card["card-added-at"] ?? card["published-at"]);
    const modified = toIso(card["card-updated-at"]);
    if (!published && !body && !headline) continue;
    updates.push({
      "@type": "BlogPosting",
      ...(headline ? { headline } : {}),
      ...(published ? { datePublished: published } : {}),
      ...(modified && modified !== published ? { dateModified: modified } : {}),
      ...(body ? { articleBody: body.slice(0, 2000) } : {}),
    });
    if (updates.length >= limit) break;
  }
  return updates;
}

function extractStoryVideoUrl(story: Story): string | undefined {
  const cards = story.cards ?? [];
  for (const card of cards) {
    for (const el of card["story-elements"] ?? []) {
      if (el.type === "youtube-video" || el.subtype === "youtube-video") {
        return el.url || el["embed-url"] || el.title;
      }
    }
  }
  return story.metadata?.["story-attributes"]?.videos?.[0];
}

/** Full JSON-LD graph for a story page — dispatches by story-template. */
export function generateArticleSchemaFromStory(
  story: Story,
  slug: string,
): JsonLd[] {
  const input = storyToArticleInput(story, slug);
  const breadcrumbs = storyBreadcrumbs(story, slug);
  const webPage = generateWebPageSchema({
    name: input.headline,
    url: input.url,
    description: input.description,
  });
  const breadcrumb = generateBreadcrumbSchema(breadcrumbs);

  const template = String(story["story-template"] ?? "text");
  const isLive =
    story.metadata?.["is-live-blog"] === true || template === "live-blog";

  if (template === "video" || template === "gumlet-video") {
    const contentUrl = extractStoryVideoUrl(story);
    return [
      webPage,
      breadcrumb,
      generateNewsArticleSchema(input),
      generateVideoObjectSchema({
        name: input.headline,
        description: input.description,
        thumbnail: input.image,
        uploadDate: input.datePublished,
        contentUrl,
        embedUrl: contentUrl,
      }),
    ];
  }

  if (isLive) {
    const article = generateNewsArticleSchema(input);
    const updates = storyLiveBlogUpdates(story);
    return [
      webPage,
      breadcrumb,
      {
        ...article,
        "@type": "LiveBlogPosting",
        coverageStartTime: toIso(input.datePublished),
        ...(story.metadata?.["is-closed"]
          ? { coverageEndTime: toIso(input.dateModified) }
          : {}),
        ...(updates.length ? { liveBlogUpdate: updates } : {}),
      },
    ];
  }

  return [webPage, breadcrumb, generateNewsArticleSchema(input)];
}

/** Home page graph: WebPage + WebSite + Organization. */
export function generateHomePageSchema(): JsonLd[] {
  const c = getAppConfig();
  return [
    generateWebPageSchema({
      name: c.siteName,
      url: "/",
      description: c.description,
    }),
    generateWebSiteSchema(),
    generateOrganizationSchema(),
  ];
}

/**
 * CollectionPage — for section / category / tag / topic hubs. When the visible
 * story list is passed it is emitted as a nested ItemList (doc §10: keep the
 * list limited to what actually renders on the page).
 */
export function generateCollectionPageSchema(input: {
  name: string;
  url: string;
  description?: string;
  items?: Array<{ name: string; url: string }>;
}): JsonLd {
  const c = getAppConfig();
  const url = abs(input.url, c.siteUrl);
  const items = (input.items ?? []).filter((it) => it?.name && it?.url);
  return {
    "@context": CONTEXT,
    "@type": "CollectionPage",
    "@id": `${url}#collection`,
    name: input.name,
    url,
    description: input.description || c.description,
    inLanguage: c.locale,
    isPartOf: { "@id": `${c.siteUrl}/#website` },
    publisher: { "@id": `${c.siteUrl}/#organization` },
    ...(items.length
      ? {
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: items.length,
            itemListElement: items.map((it, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: it.name,
              url: abs(it.url, c.siteUrl),
            })),
          },
        }
      : {}),
  };
}

/** Section/category/tag/topic page graph: CollectionPage + BreadcrumbList. */
export function generateSectionPageSchema(
  name: string,
  urlSlug: string,
  description?: string,
  items?: Array<{ name: string; url: string }>,
): JsonLd[] {
  const c = getAppConfig();
  const crumbs: BreadcrumbItem[] = [
    { name: c.siteName, url: `${c.siteUrl}/` },
    { name, url: abs(urlSlug, c.siteUrl) },
  ];
  return [
    generateCollectionPageSchema({ name, url: urlSlug, description, items }),
    generateBreadcrumbSchema(crumbs),
  ];
}

// ── Publisher pages: About / Contact / Author profile ───────────────────────

/** AboutPage wrapping the NewsMediaOrganization + editorial policies (doc §2). */
export function generateAboutPageSchema(urlSlug = "/about-us"): JsonLd[] {
  const c = getAppConfig();
  const url = abs(urlSlug, c.siteUrl);
  return [
    {
      "@context": CONTEXT,
      "@type": "AboutPage",
      "@id": `${url}#about`,
      url,
      name: `About ${c.siteNameEn}`,
      inLanguage: c.locale,
      isPartOf: { "@id": `${c.siteUrl}/#website` },
      mainEntity: {
        "@type": "NewsMediaOrganization",
        name: c.siteNameEn,
        legalName: c.legalName,
        url: `${c.siteUrl}/`,
        logo: logoNode(),
        foundingDate: c.foundingDate,
        slogan: c.slogan,
        description: c.description,
        sameAs: c.sameAs,
        address: addressNode(),
        parentOrganization: {
          "@type": "Organization",
          name: c.parentOrganization,
        },
        ...c.editorialPolicies,
      },
    },
    generateBreadcrumbSchema([
      { name: c.siteName, url: `${c.siteUrl}/` },
      { name: `About ${c.siteNameEn}`, url },
    ]),
  ];
}

/** ContactPage with distinct ContactPoint pathways (doc §3). */
export function generateContactPageSchema(urlSlug = "/contact-us"): JsonLd[] {
  const c = getAppConfig();
  const url = abs(urlSlug, c.siteUrl);
  return [
    {
      "@context": CONTEXT,
      "@type": "ContactPage",
      "@id": `${url}#contact`,
      url,
      name: `Contact ${c.siteNameEn}`,
      inLanguage: c.locale,
      isPartOf: { "@id": `${c.siteUrl}/#website` },
      mainEntity: {
        "@type": "NewsMediaOrganization",
        name: c.siteNameEn,
        url: `${c.siteUrl}/`,
        logo: logoNode(),
        address: addressNode(),
        contactPoint: contactPointNodes(),
      },
    },
    generateBreadcrumbSchema([
      { name: c.siteName, url: `${c.siteUrl}/` },
      { name: `Contact ${c.siteNameEn}`, url },
    ]),
  ];
}

export interface AuthorProfileInput {
  name: string;
  slug: string;
  jobTitle?: string;
  description?: string;
  image?: string;
  sameAs?: string[];
}

/** ProfilePage + Person for an author profile (doc §9). */
export function generateProfilePageSchema(input: AuthorProfileInput): JsonLd[] {
  const c = getAppConfig();
  const url = `${c.siteUrl}/author/${input.slug}`;
  const sameAs = (input.sameAs ?? []).filter(Boolean);
  return [
    {
      "@context": CONTEXT,
      "@type": "ProfilePage",
      "@id": `${url}#profile`,
      url,
      inLanguage: c.locale,
      isPartOf: { "@id": `${c.siteUrl}/#website` },
      mainEntity: {
        "@type": "Person",
        "@id": `${url}#person`,
        name: input.name,
        url,
        ...(input.jobTitle ? { jobTitle: input.jobTitle } : {}),
        ...(input.description ? { description: input.description } : {}),
        ...(input.image ? { image: input.image } : {}),
        worksFor: { "@id": `${c.siteUrl}/#organization` },
        ...(sameAs.length ? { sameAs } : {}),
      },
    },
    generateBreadcrumbSchema([
      { name: c.siteName, url: `${c.siteUrl}/` },
      { name: input.name, url },
    ]),
  ];
}

/** Serialize a schema (or list) for a script tag, escaping the `<` sentinel. */
export function schemaToJsonLd(schema: JsonLd | JsonLd[]): string {
  return JSON.stringify(schema).replace(/</g, "\\u003c");
}
