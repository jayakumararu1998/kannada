import type { Metadata } from "next";

import SiteChrome from "@/components/layout/SiteChrome";
import BuilderPagination from "@/components/builder/BuilderPagination";
import SearchResultsClient from "@/components/search/SearchResultsClient";
import SearchResultCard from "@/components/search/SearchResultCard";
import SidebarTrendingStories from "@/components/search/SidebarTrendingStories";
import type { FilterData } from "@/components/search/SearchFilters";
import { searchStories, getCollectionStories } from "@/lib/api/stories";
import type { Story } from "@/lib/api/stories";
import { SITE_URL } from "@/lib/constants";
import { siteConfig } from "@/config/site";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

interface SearchPageProps {
  params: Promise<{ query: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function pageNumber(raw: string | string[] | undefined): number {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const n = parseInt(v || "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export async function generateMetadata({
  params,
}: SearchPageProps): Promise<Metadata> {
  const { query } = await params;
  const q = decodeURIComponent(query || "");
  const canonical = `${SITE_URL.replace(/\/+$/, "")}/search/${encodeURIComponent(q)}`;
  return {
    title: `Search: ${q}`,
    description: `Search results for “${q}” on ${siteConfig.name}.`,
    alternates: { canonical },
    // Search result listings are not indexable.
    robots: { index: false, follow: true },
  };
}

/** Build the Section / Author / Story-Type filter options from a result set. */
function buildFilterData(stories: Story[]): FilterData {
  const sections = new Map<number, string>();
  const authors = new Set<string>();
  const storyTypes = new Set<string>();
  for (const s of stories) {
    for (const sec of s.sections ?? []) {
      const name = sec?.["display-name"] || sec?.name;
      if (sec?.id != null && name) sections.set(sec.id, name);
    }
    if (s["author-name"]) authors.add(s["author-name"]);
    if (s["story-template"]) storyTypes.add(s["story-template"]);
  }
  return {
    sections: [...sections.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    authors: [...authors].sort(),
    storyTypes: [...storyTypes].sort(),
  };
}

export default async function SearchPage({
  params,
  searchParams,
}: SearchPageProps) {
  const { query } = await params;
  const sp = await searchParams;
  const q = decodeURIComponent(query || "");
  const currentPage = pageNumber(sp.page);

  const [{ total, items }, trendingStories] = await Promise.all([
    searchStories(q, PAGE_SIZE, (currentPage - 1) * PAGE_SIZE),
    getCollectionStories("trending", 6).catch(() => []),
  ]);
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const filterData = buildFilterData(items);

  const serverResults =
    items.length === 0 ? (
      <div className="p-10 text-center">
        <p className="text-18-balootamma2-700 text-111111">
          No results found
        </p>
        <p className="mt-2 text-14-inter-400 text-8B95A5">
          Try a different keyword or check the spelling.
        </p>
      </div>
    ) : (
      <>
        <div className="flex flex-col gap-3 p-4">
          {items.map((story, i) => (
            <SearchResultCard key={story.id || story.slug || i} story={story} />
          ))}
        </div>
        {totalPages > 1 && (
          <div className="px-4">
            <BuilderPagination
              currentPage={currentPage}
              totalPages={totalPages}
              basePath={`/search/${encodeURIComponent(q)}`}
            />
          </div>
        )}
      </>
    );

  return (
    <SiteChrome pageType="sectionPage">
      <div className="w-full px-4 py-6 sm:px-6 lg:px-[60px]">
        <SearchResultsClient
          query={q}
          totalResults={total}
          filterData={filterData}
          sidebarExtra={<SidebarTrendingStories stories={trendingStories} />}
        >
          {serverResults}
        </SearchResultsClient>
      </div>
    </SiteChrome>
  );
}
