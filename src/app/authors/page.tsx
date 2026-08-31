import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Link from "@/components/ui/PrefetchLink";
import SiteChrome from "@/components/layout/SiteChrome";
import SchemaMarkup from "@/components/seo/SchemaMarkup";
import BuilderPagination from "@/components/builder/BuilderPagination";
import TaboolaPlacement from "@/components/ads/TaboolaPlacement";
import AuthorCard from "@/components/author/AuthorCard";
import { getAuthorsList } from "@/lib/api/stories";
import { generateSectionPageSchema } from "@/lib/seo/schema";
import { SITE_URL } from "@/lib/constants";
import { siteConfig } from "@/config/site";

// Reads the in-memory builder store (via SiteChrome) and the authors index —
// render on demand, like the section/topic pages.
export const dynamic = "force-dynamic";

// 3 columns × 8 rows.
const ITEMS_PER_PAGE = 24;

interface AuthorsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function pageNumber(raw: string | string[] | undefined): number {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const n = parseInt(v || "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export async function generateMetadata({
  searchParams,
}: AuthorsPageProps): Promise<Metadata> {
  const sp = await searchParams;
  const isPaginated = pageNumber(sp.page) > 1;
  const canonical = `${SITE_URL.replace(/\/+$/, "")}/authors`;
  const title = "ಲೇಖಕರು";
  const description = `${siteConfig.name} ಲೇಖಕರು ಮತ್ತು ಅಂಕಣಕಾರರ ಪಟ್ಟಿ.`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: isPaginated
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      url: canonical,
      title,
      description,
    },
    twitter: { card: "summary", title, description },
  };
}

export default async function AuthorsPage({ searchParams }: AuthorsPageProps) {
  const sp = await searchParams;
  const currentPage = pageNumber(sp.page);

  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const { total, authors } = await getAuthorsList(ITEMS_PER_PAGE, offset);
  if (authors.length === 0) notFound();

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
  const schema = generateSectionPageSchema("ಲೇಖಕರು", "authors", undefined);

  return (
    <SiteChrome pageType="sectionPage">
      <SchemaMarkup schema={schema} />
      <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 lg:px-[60px]">
        {/* Breadcrumb */}
        <nav className="mb-6 text-14-inter-500 text-8B95A5">
          <Link href="/" className="text-8B95A5 hover:underline">
            ಮುಖಪುಟ
          </Link>
          <span className="mx-1">/</span>
          <span className="text-111111">ಲೇಖಕರು</span>
        </nav>

        {/* Centered heading + intro, mirroring the reference "OUR AUTHORS". */}
        <div className="mx-auto mb-10 max-w-[820px] text-center">
          <h1 className="text-24-balootamma2-700 font-bold uppercase tracking-wide text-111111 md:text-32-balootamma2-700">
            ನಮ್ಮ ಲೇಖಕರು
          </h1>
          <p className="mx-auto mt-4 max-w-[720px] text-15-inter-400 leading-[1.7] text-6D6D6D">
            ನಮ್ಮ ಲೇಖಕರು ನಾವು ಮಾಡುವ ಕೆಲಸದ ಹೃದಯ. ಪ್ರತಿ ವಿಭಾಗಕ್ಕೂ ಮೀಸಲಾದ
            ಲೇಖಕರಿದ್ದಾರೆ ಮತ್ತು ಅವರಿಂದ ಹಲವಾರು ಲೇಖನಗಳಿವೆ. ನಿಮ್ಮ ಮೆಚ್ಚಿನ ಲೇಖಕರ
            ಬಳಿ ಹೋಗಿ ಅವರ ಲೇಖನಗಳನ್ನು ಓದಿ ಆನಂದಿಸಿ.
          </p>
        </div>

        {/* Authors grid — borderless cards with gaps. */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {authors.map((author, index) => (
            <AuthorCard
              key={author.id || author.slug || index}
              author={author}
              priority={index < 6}
            />
          ))}
        </div>

        {totalPages > 1 && (
          <div className="mt-8">
            <BuilderPagination
              currentPage={currentPage}
              totalPages={totalPages}
              basePath="/authors"
            />
          </div>
        )}

        {/* Taboola bottom (builder-configured for the author page). */}
        <TaboolaPlacement pageType="author" position="bottomAd" className="mt-6" />
      </div>
    </SiteChrome>
  );
}
