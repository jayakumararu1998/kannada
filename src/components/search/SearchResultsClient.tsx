"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import type { Story } from "@/lib/api/stories";
import SearchResultCard from "./SearchResultCard";
import SearchFilters, {
  type ActiveFilters,
  type FilterData,
} from "./SearchFilters";
import TrendingTags from "@/components/ui/TrendingTags";

interface Props {
  query: string;
  totalResults: number;
  /** Server-rendered result cards + pagination for the unfiltered query. */
  children: React.ReactNode;
  filterData: FilterData;
  /** Server-rendered extra sidebar content (e.g. trending stories list). */
  sidebarExtra?: React.ReactNode;
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M2.5 3.5H17.5L11.7 10.3V16.5L8.3 14.8V10.3L2.5 3.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px] shrink-0" fill="none" aria-hidden="true">
      <path
        d="M9.2 15.7C12.8 15.7 15.7 12.8 15.7 9.2C15.7 5.6 12.8 2.7 9.2 2.7C5.6 2.7 2.7 5.6 2.7 9.2C2.7 12.8 5.6 15.7 9.2 15.7Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path d="M13.8 13.8L17.3 17.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

const hasActive = (f: ActiveFilters) =>
  f.sectionNames.length > 0 ||
  f.authors.length > 0 ||
  f.storyTypes.length > 0 ||
  !!f.dateFrom ||
  !!f.dateTo;

/**
 * Client shell for `/search/{query}` — search input, live filtering, and the
 * results / filter split (ported from dinamani's `SearchPageClient`). When no
 * filter is active it renders the server `children` (SSR results + pagination);
 * once a filter is applied it fetches from `/api/search-filter` and swaps in the
 * filtered list (page 1 only, mirroring dinamani).
 */
export default function SearchResultsClient({
  query,
  totalResults,
  children,
  filterData,
  sidebarExtra,
}: Props) {
  const router = useRouter();
  const [term, setTerm] = useState(query);
  const [showFilter, setShowFilter] = useState(false);
  const [filtered, setFiltered] = useState<Story[] | null>(null);
  const [filteredTotal, setFilteredTotal] = useState<number | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = () => {
    const q = term.trim();
    if (q) router.push(`/search/${encodeURIComponent(q)}`);
  };

  const onFilterChange = useCallback(
    async (f: ActiveFilters) => {
      setError(null);
      if (!hasActive(f)) {
        setFiltered(null);
        setFilteredTotal(undefined);
        return;
      }
      const params = new URLSearchParams({
        q: query,
        sort: "latest-published",
        limit: "20",
        offset: "0",
      });
      f.sectionNames.forEach((n) => params.append("section-name", n));
      f.authors.forEach((a) => params.append("author", a));
      f.storyTypes.forEach((t) => params.append("story-template", t));
      if (f.dateFrom)
        params.append("published-after", String(new Date(f.dateFrom).getTime()));
      if (f.dateTo) {
        const to = new Date(f.dateTo);
        to.setHours(23, 59, 59, 999);
        params.append("published-before", String(to.getTime()));
      }

      try {
        setLoading(true);
        const res = await fetch(`/api/search-filter?${params.toString()}`);
        const data = await res.json();
        if (data?.error) {
          setError("Could not load filtered results.");
          setFiltered(null);
          setFilteredTotal(undefined);
          return;
        }
        setFiltered((data?.items ?? []) as Story[]);
        setFilteredTotal(data?.total ?? 0);
      } catch {
        setError("Could not load filtered results.");
        setFiltered(null);
        setFilteredTotal(undefined);
      } finally {
        setLoading(false);
      }
    },
    [query],
  );

  const displayTotal = filteredTotal ?? totalResults;

  const results = () => {
    if (error)
      return <div className="p-6 text-center text-14-inter-400 text-red-500">{error}</div>;
    if (loading)
      return (
        <div className="p-6 text-center text-14-inter-400 text-8B95A5">Loading…</div>
      );
    if (filtered) {
      if (filtered.length === 0)
        return (
          <div className="p-8 text-center text-14-inter-400 text-8B95A5">
            No results found for the selected filters.
          </div>
        );
      return (
        <div className="flex flex-col gap-3 p-4">
          {filtered.map((s, i) => (
            <SearchResultCard key={s.id || s.slug || i} story={s} />
          ))}
        </div>
      );
    }
    return children;
  };

  return (
    <div className="flex flex-col items-start gap-6 lg:flex-row">
      {/* LEFT: search + results */}
      <div className="w-full lg:w-[68%]">
        <div className="flex items-center gap-3">
          <div className="flex min-h-11 flex-1 items-center gap-2.5 rounded-full border border-8B95A5 bg-FFFFFF px-4 text-1E1E1E">
            <SearchIcon />
            <input
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="Search…"
              className="w-full min-w-0 border-0 bg-transparent text-16-inter-400 leading-100 text-1E1E1E outline-none placeholder:text-8B95A5"
            />
          </div>
          <button
            type="button"
            aria-label="Search"
            onClick={submit}
            disabled={!term.trim()}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-3046EB px-5 text-16-inter-600 text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <SearchIcon />
            <span className="hidden sm:inline">Search</span>
          </button>
          <button
            type="button"
            aria-label="Toggle filters"
            aria-pressed={showFilter}
            onClick={() => setShowFilter((v) => !v)}
            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors ${
              showFilter
                ? "border-3046EB bg-3046EB text-white"
                : "border-8B95A5 bg-FFFFFF text-1E1E1E hover:border-3046EB hover:text-3046EB"
            }`}
          >
            <FilterIcon />
          </button>
        </div>

        <p className="px-1 pb-1 pt-3 text-14-inter-400 text-6F6F6F">
          {displayTotal.toLocaleString()} results found for “{query}”
        </p>

        {results()}
      </div>

      {/* RIGHT: filters (toggled) or trending tags + stories */}
      <aside className="w-full lg:sticky lg:top-8 lg:w-[32%]">
        {showFilter ? (
          <div className="border border-DFDFDF">
            <SearchFilters filterData={filterData} onChange={onFilterChange} />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <TrendingTags limit={10} destination="search" />
            {sidebarExtra}
          </div>
        )}
      </aside>
    </div>
  );
}
