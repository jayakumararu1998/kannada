"use client";

import { FormEvent, InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type SearchBarProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  className?: string;
  fieldClassName?: string;
  inputClassName?: string;
  iconClassName?: string;
  filterClassName?: string;
  resultsClassName?: string;
  resultsText?: string;
  showFilter?: boolean;
  onSearch?: (value: string) => void;
  onFilter?: () => void;
};

export default function SearchBar({
  className,
  fieldClassName,
  inputClassName,
  iconClassName,
  filterClassName,
  resultsClassName,
  resultsText,
  showFilter = true,
  placeholder = "Cm Vijay",
  onSearch,
  onFilter,
  name = "search",
  ...props
}: SearchBarProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const input = event.currentTarget.elements.namedItem(name);
    onSearch?.(input instanceof HTMLInputElement ? input.value : "");
  };

  return (
    <form
      className={cn("flex w-full flex-col gap-4", className)}
      role="search"
      onSubmit={handleSubmit}
    >
      <div className="flex w-full items-center gap-4">
        <div
          className={cn(
            "flex min-h-11 w-full items-center gap-2.5 rounded-full border border-8B95A5 bg-[var(--color-FFFFFF)] px-4",
            fieldClassName,
          )}
        >
          <input
            {...props}
            name={name}
            type="search"
            className={cn(
              "min-w-0 w-full border-0 bg-transparent text-16-inter-400 leading-100 text-1E1E1E outline-none placeholder:text-1E1E1E",
              inputClassName,
            )}
            placeholder={placeholder}
          />

          <button
            type="submit"
            className="inline-flex shrink-0 items-center justify-center border-0 bg-transparent p-0 text-1E1E1E"
          >
            <svg
              className={cn("h-[18px] w-[18px] shrink-0", iconClassName)}
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M9.2 15.7C12.8 15.7 15.7 12.8 15.7 9.2C15.7 5.6 12.8 2.7 9.2 2.7C5.6 2.7 2.7 5.6 2.7 9.2C2.7 12.8 5.6 15.7 9.2 15.7Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13.8 13.8L17.3 17.3"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {showFilter && (
          <button
            type="button"
            className={cn(
              "inline-flex h-7 w-7 shrink-0 items-center justify-center border-0 bg-transparent p-0 text-1E1E1E",
              filterClassName,
            )}
            aria-label="Filter"
            onClick={onFilter}
          >
            <svg
              className="h-full w-full"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2.5 3.5H17.5L11.7 10.3V16.5L8.3 14.8V10.3L2.5 3.5Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {resultsText && (
        <p
          className={cn(
            "text-center text-16-inter-400 leading-100 text-6F6F6F",
            resultsClassName,
          )}
        >
          {resultsText}
        </p>
      )}
    </form>
  );
}
