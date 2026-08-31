"use client";

import type { ReactNode } from "react";

type BreadcrumbProps = {
  label?: ReactNode;
  className?: string;
  labelClassName?: string;
};

export default function Breadcrumb({
  label = "Home",
  className,
  labelClassName,
}: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex min-h-[30px] w-full items-start border-b border-DFDFDF bg-transparent ${
        className || ""
      }`}
    >
      <span
        className={`inline-flex items-center gap-1 font-manrope text-[12px] font-medium leading-[1.2] text-000000 ${
          labelClassName || ""
        }`}
      >
        {label}
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="h-3 w-3 shrink-0"
          fill="none"
        >
          <path
            d="M6 4L10 8L6 12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </nav>
  );
}
