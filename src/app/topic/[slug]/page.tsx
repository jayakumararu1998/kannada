import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Link from "@/components/ui/PrefetchLink";
import SiteChrome from "@/components/layout/SiteChrome";
import SchemaMarkup from "@/components/seo/SchemaMarkup";
import BuilderPagination from "@/components/builder/BuilderPagination";
import TaboolaPlacement from "@/components/ads/TaboolaPlacement";
import TopicStoryCard from "@/components/topic/TopicStoryCard";
import { getStoriesByTag, getTagBySlug } from "@/lib/api/stories";
import { generateSectionPageSchema } from "@/lib/seo/schema";
import { SITE_URL } from "@/lib/constants";
import { siteConfig } from "@/config/site";

// The in-memory builder store is read indirectly via SiteChrome; render on
// demand and let the edge proxy cache the HTML (like section/article pages).
export const dynamic = "force-dynamic";

// 3 columns × 3 rows, matching dinamani's topic grid.
const ITEMS_PER_PAGE = 9;

interface TopicPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Bullet glyph used before section/topic headings across the site. */
function BulletIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 8 16" className="h-[16px] w-[8px] shrink-0" fill="none">
      <circle cx="4" cy="4" r="4" fill="#FAC43B" />
      <path d="M8 8C8 9.06087 7.57857 10.0783 6.82843 10.8284C6.07828 11.5786 5.06087 12 4 12C2.93913 12 1.92172 11.5786 1.17157 10.8284C0.421428 10.0783 0 9.06087 0 8L8 8Z" fill="#3046EB" />
      <path d="M8 12C8 13.0609 7.57857 14.0783 6.82843 14.8284C6.07828 15.5786 5.06087 16 4 16C2.93913 16 1.92172 15.5786 1.17157 14.8284C0.421428 14.0783 0 13.0609 0 12L8 12Z" fill="#009EF9" />
    </svg>
  );
}

/** Human display name from a tag slug ("cm-vijay" → "cm vijay"). */
function slugToName(slug: string): string {
  return decodeURIComponent(slug).replace(/-/g, " ");
}

function pageNumber(raw: string | string[] | undefined): number {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const n = parseInt(v || "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export async function generateMetadata({
  params,
  searchParams,
}: TopicPageProps): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const isPaginated = pageNumber(sp.page) > 1;

  const displayName = slugToName(slug);
  const canonical = `${SITE_URL.replace(/\/+$/, "")}/topic/${encodeURIComponent(
    slug,
  )}`;
  // The root layout's title template appends "| {siteName}", so keep this bare.
  const title = `${displayName} — Latest News & Updates`;
  const description = `Read the latest ${displayName} news, breaking updates, photos and videos from ${siteConfig.name}.`;

  return {
    title,
    description,
    alternates: { canonical },
    // Paginated listings (?page=2…) stay out of the index; only the landing
    // page is indexable.
    robots: isPaginated
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      url: canonical,
      title,
      description,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function TopicPage({
  params,
  searchParams,
}: TopicPageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const currentPage = pageNumber(sp.page);

  // Resolve + validate the tag (advanced-search returns everything for an
  // unknown tag, so we must confirm it exists first).
  const tag = await getTagBySlug(slug);
  if (!tag) notFound();

  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const { total, items } = await getStoriesByTag(
    tag.name,
    ITEMS_PER_PAGE,
    offset,
  );
  if (items.length === 0) notFound();

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const displayName = tag.name || slugToName(slug);
  const urlSlug = `topic/${encodeURIComponent(slug)}`;
  const schema = generateSectionPageSchema(displayName, urlSlug, undefined);

  return (
    <SiteChrome pageType="sectionPage">
      <SchemaMarkup schema={schema} />
      <div className="w-full px-4 py-6 sm:px-6 lg:px-[60px]">
        <div>
          {/* Breadcrumb */}
          <nav className="px-5 py-2 text-14-inter-500 text-8B95A5">
            <Link href="/" className="text-8B95A5 no-underline hover:text-111111">
              ಮುಖಪುಟ
            </Link>
            <span className="mx-1">/</span>
            <span className="text-111111">{displayName}</span>
          </nav>

          {/* Topic heading — bullet + name */}
          <div className="mb-6 px-1 py-3">
            <h1 className="flex items-center gap-2 font-balootamma2 text-24-balootamma2-700 font-bold text-111111">
              <BulletIcon />
              {displayName}
            </h1>
          </div>

          {/* Story grid — 3 columns × 3 rows, gap-separated (no borders). */}
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-3">
            {items.map((story, index) => (
              <TopicStoryCard
                key={story.id || story.slug || index}
                story={story}
                priority={index < 3}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="px-4">
              <BuilderPagination
                currentPage={currentPage}
                totalPages={totalPages}
                basePath={`/${urlSlug}`}
              />
            </div>
          )}
        </div>

        {/* Taboola bottom (builder-configured for the topic page). */}
        <TaboolaPlacement pageType="topic" position="bottomAd" className="mt-6" />
      </div>
    </SiteChrome>
  );
}
