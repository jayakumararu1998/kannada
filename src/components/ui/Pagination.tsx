"use client";

type PaginationProps = {
  currentPage?: number;
  pages?: Array<number | "...">;
  previousLabel?: string;
  nextLabel?: string;
  onPageChange?: (page: number) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  className?: string;
};

const DEFAULT_PAGES: Array<number | "..."> = [1, 2, 3, "...", 67, 68];

function ArrowLeftIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5" fill="none">
      <path
        d="M12.5 5L7.5 10L12.5 15"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 10H16"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5" fill="none">
      <path
        d="M7.5 5L12.5 10L7.5 15"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 10H4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Pagination({
  currentPage = 1,
  pages = DEFAULT_PAGES,
  previousLabel = "Previous",
  nextLabel = "Next",
  onPageChange,
  onPrevious,
  onNext,
  className,
}: PaginationProps) {
  const previousDisabled = currentPage <= 1;

  return (
    <nav
      aria-label="Pagination"
      className={`flex w-full flex-col items-stretch gap-3 text-16-manrope-400 leading-100 text-111111 sm:flex-row sm:items-center sm:justify-center sm:gap-4 md:gap-[18px] ${
        className || ""
      }`}
    >
      <div className="grid grid-cols-2 gap-3 sm:contents">
        <button
          type="button"
          aria-label={previousLabel}
          disabled={previousDisabled}
          onClick={onPrevious}
          className="inline-flex h-10 min-w-0 items-center justify-center gap-1 rounded-[8px] border border-DFDFDF px-3 text-8B95A5 disabled:cursor-default disabled:text-8B95A5 enabled:hover:border-000000 enabled:hover:text-000000 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-000000)] sm:h-8 sm:border-0 sm:px-0"
        >
          <ArrowLeftIcon />
          <span className="truncate sm:inline">{previousLabel}</span>
        </button>

        <button
          type="button"
          aria-label={nextLabel}
          onClick={onNext}
          className="inline-flex h-10 min-w-0 items-center justify-center gap-1 rounded-[8px] border border-DFDFDF px-3 text-111111 hover:border-000000 hover:text-000000 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-000000)] sm:order-3 sm:h-8 sm:border-0 sm:px-0"
        >
          <span className="truncate sm:inline">{nextLabel}</span>
          <ArrowRightIcon />
        </button>
      </div>

      <div className="-mx-1 flex min-w-0 items-center gap-1 overflow-x-auto px-1 pb-1 sm:order-2 sm:mx-0 sm:gap-2 sm:overflow-visible sm:px-0 sm:pb-0 md:gap-[18px]">
        {pages.map((page, index) =>
          page === "..." ? (
            <span
              key={`ellipsis-${index}`}
              className="inline-flex h-9 min-w-9 shrink-0 items-center justify-center text-16-manrope-600 text-111111 sm:h-8 sm:min-w-8"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              type="button"
              aria-label={`Page ${page}`}
              aria-current={page === currentPage ? "page" : undefined}
              onClick={() => onPageChange?.(page)}
              className={`inline-flex h-9 min-w-9 shrink-0 items-center justify-center rounded-[8px] px-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C2C2C] sm:h-8 sm:min-w-8 ${
                page === currentPage
                  ? "bg-[#2C2C2C] text-white dark:bg-[#f8fafc] dark:text-[#0f172a]"
                  : "bg-transparent text-111111 hover:bg-F9F9F9"
              }`}
            >
              {page}
            </button>
          ),
        )}
      </div>
    </nav>
  );
}
