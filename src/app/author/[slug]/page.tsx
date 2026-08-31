import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Link from "@/components/ui/PrefetchLink";
import SiteChrome from "@/components/layout/SiteChrome";
import SchemaMarkup from "@/components/seo/SchemaMarkup";
import BuilderPagination from "@/components/builder/BuilderPagination";
import TaboolaPlacement from "@/components/ads/TaboolaPlacement";
import AuthorStoryCard from "@/components/author/AuthorStoryCard";
import AuthorSocialLinks from "@/components/author/AuthorSocialLinks";
import { getAuthorProfileBySlug, getAuthorStories } from "@/lib/api/stories";
import { generateProfilePageSchema } from "@/lib/seo/schema";
import { toMediaUrl, AUTHOR_AVATAR_PLACEHOLDER } from "@/lib/images";
import { applySocialMetaOverride } from "@/lib/seo/social-meta";
import { SITE_URL } from "@/lib/constants";
import { siteConfig } from "@/config/site";

// Reads the in-memory builder store (via SiteChrome) and per-request author
// data — render on demand, like section/topic/article pages.
export const dynamic = "force-dynamic";

// 3 columns × 5 rows.
const ITEMS_PER_PAGE = 15;

interface AuthorPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function pageNumber(raw: string | string[] | undefined): number {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const n = parseInt(v || "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export async function generateMetadata({
  params,
  searchParams,
}: AuthorPageProps): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const isPaginated = pageNumber(sp.page) > 1;

  const author = await getAuthorProfileBySlug(slug);
  const name = author?.name || decodeURIComponent(slug).replace(/-/g, " ");
  const description =
    author?.bio || `${name} — ${siteConfig.name} ಲೇಖನಗಳು ಮತ್ತು ಅಂಕಣಗಳು.`;
  const canonical = `${SITE_URL.replace(/\/+$/, "")}/author/${encodeURIComponent(
    slug,
  )}`;
  const image = toMediaUrl(author?.avatarUrl);

  const base: Metadata = {
    title: name,
    description,
    alternates: { canonical },
    robots: isPaginated
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      type: "profile",
      siteName: siteConfig.name,
      url: canonical,
      title: name,
      description,
      ...(image ? { images: [{ url: image, alt: name }] } : {}),
    },
    twitter: {
      card: "summary",
      title: name,
      description,
      ...(image ? { images: [{ url: image, alt: name }] } : {}),
    },
  };

  // A builder social-meta override for this URL wins over the defaults.
  const override = applySocialMetaOverride(
    `/author/${slug}`,
    name,
    description,
    canonical,
  );
  return override ? { ...base, ...override } : base;
}

export default async function AuthorPage({
  params,
  searchParams,
}: AuthorPageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const currentPage = pageNumber(sp.page);

  const author = await getAuthorProfileBySlug(slug);
  if (!author) notFound();

  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const { total, items } = await getAuthorStories(
    author.id,
    ITEMS_PER_PAGE,
    offset,
  );
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  const avatar = toMediaUrl(author.avatarUrl) || AUTHOR_AVATAR_PLACEHOLDER;
  const urlSlug = `author/${encodeURIComponent(slug)}`;
  const schema = generateProfilePageSchema({
    name: author.name,
    slug,
    description: author.bio,
    image: toMediaUrl(author.avatarUrl),
    sameAs: author.sameAs,
  });

  return (
    <SiteChrome pageType="sectionPage">
      <SchemaMarkup schema={schema} />
      <div className="w-full px-4 py-8 sm:px-6 lg:px-[60px]">
        {/* Breadcrumb */}
        <nav className="mb-6 text-14-inter-500 text-8B95A5">
          <Link href="/" className="text-8B95A5 hover:underline">
            ಮುಖಪುಟ
          </Link>
          <span className="mx-1">/</span>
          <Link href="/authors" className="text-8B95A5 hover:underline">
            ಲೇಖಕರು
          </Link>
          <span className="mx-1">/</span>
          <span className="text-111111">{author.name}</span>
        </nav>

        {/* Author profile header — light gray box: avatar + name + bio. */}
        <div className="mb-8 flex flex-col items-center gap-5 rounded-lg bg-F9F9F9 p-6 text-center sm:flex-row sm:items-center sm:gap-6 sm:p-8 sm:text-left">
          <img
            src={avatar}
            alt={author.name}
            className="h-24 w-24 shrink-0 rounded-full object-cover"
            loading="eager"
          />
          <div className="min-w-0 flex-1">
            <h1 className="break-words text-20-balootamma2-700 font-bold uppercase text-183354 md:text-24-balootamma2-700">
              {author.name}
            </h1>
            {author.bio && (
              <p className="mt-2 whitespace-pre-line break-words text-15-inter-400 leading-[1.6] text-4A4A4A">
                {author.bio}
              </p>
            )}
            {author.social && author.social.length > 0 && (
              <div className="mt-4 flex justify-center sm:justify-start">
                <AuthorSocialLinks links={author.social} />
              </div>
            )}
          </div>
        </div>

        {/* Article grid — 3 columns of horizontal image+headline cards. */}
        {items.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((story, index) => (
              <AuthorStoryCard
                key={story.id || story.slug || index}
                story={story}
                priority={index < 3}
              />
            ))}
          </div>
        ) : (
          <p className="py-10 text-center text-15-inter-400 text-8B95A5">
            ಈ ಲೇಖಕರ ಯಾವುದೇ ಲೇಖನಗಳು ಕಂಡುಬಂದಿಲ್ಲ.
          </p>
        )}

        {totalPages > 1 && (
          <div className="mt-8">
            <BuilderPagination
              currentPage={currentPage}
              totalPages={totalPages}
              basePath={`/${urlSlug}`}
            />
          </div>
        )}

        {/* Taboola bottom (builder-configured for the author page). */}
        <TaboolaPlacement pageType="author" position="bottomAd" className="mt-6" />
      </div>
    </SiteChrome>
  );
}
