import NextLink from "next/link";

import { buildPageList } from "@/lib/builder/pagination";
import { cn } from "@/lib/utils";

interface Props {
  currentPage: number;
  totalPages: number;
  /** Base path for page links (e.g. "/sports" or "/"). */
  basePath: string;
}

function ArrowLeft() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5" fill="none">
      <path d="M12.5 5L7.5 10L12.5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 10H16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function ArrowRight() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5" fill="none">
      <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 10H4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** Server-rendered numbered pager. Each control is a link to `?page=N`. */
export default function BuilderPagination({ currentPage, totalPages, basePath }: Props) {
  if (totalPages <= 1) return null;
  const base = basePath === "/" ? "/" : basePath.replace(/\/+$/, "");
  const href = (p: number) => `${base}?page=${p}`;
  const pages = buildPageList(currentPage, totalPages);
  // Phones get a shorter list (first/last + current window) so the whole pager
  // fits on one line — the full list overflows a 390px viewport and makes the
  // page horizontally scrollable ("shake").
  const compactPages = buildPageList(currentPage, totalPages, true);
  const prevDisabled = currentPage <= 1;
  const nextDisabled = currentPage >= totalPages;

  const pageEntry = (p: number | "...", i: number) =>
    p === "..." ? (
      <span
        key={`e${i}`}
        className="inline-flex h-8 min-w-8 items-center justify-center text-111111"
      >
        ...
      </span>
    ) : (
      <NextLink
        key={p}
        href={href(p)}
        aria-current={p === currentPage ? "page" : undefined}
        className={cn(
          "inline-flex h-8 min-w-8 items-center justify-center rounded-[8px] px-2 no-underline transition",
          p === currentPage
            ? "bg-[#2C2C2C] text-white dark:bg-[#e8e8e8] dark:text-[#111111]"
            : "bg-transparent text-111111 hover:bg-F9F9F9",
        )}
      >
        {p}
      </NextLink>
    );

  return (
    <nav
      aria-label="Pagination"
      className="mt-8 mb-12 flex w-full flex-wrap items-center justify-center gap-2 border-t border-D2D2D2 pt-8 text-16-manrope-400 leading-100 text-111111 sm:gap-4 md:gap-[18px]"
    >
      {prevDisabled ? (
        <span className="inline-flex h-8 items-center gap-1 text-8B95A5">
          <ArrowLeft />
          <span className="hidden sm:inline">Previous</span>
        </span>
      ) : (
        <NextLink href={href(currentPage - 1)} className="inline-flex h-8 items-center gap-1 text-111111 no-underline hover:text-000000">
          <ArrowLeft />
          <span className="hidden sm:inline">Previous</span>
        </NextLink>
      )}

      {/* Compact list (phones) / full list (sm and up). */}
      <div className="flex items-center justify-center gap-2 sm:hidden">
        {compactPages.map(pageEntry)}
      </div>
      <div className="hidden items-center gap-2 sm:flex md:gap-[18px]">
        {pages.map(pageEntry)}
      </div>

      {nextDisabled ? (
        <span className="inline-flex h-8 items-center gap-1 text-8B95A5">
          <span className="hidden sm:inline">Next</span>
          <ArrowRight />
        </span>
      ) : (
        <NextLink href={href(currentPage + 1)} className="inline-flex h-8 items-center gap-1 text-111111 no-underline hover:text-000000">
          <span className="hidden sm:inline">Next</span>
          <ArrowRight />
        </NextLink>
      )}
    </nav>
  );
}
