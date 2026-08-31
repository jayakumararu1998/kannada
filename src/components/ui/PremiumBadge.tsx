import { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type PremiumBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  label?: string;
  iconClassName?: string;
  textClassName?: string;
};

export default function PremiumBadge({
  label = "Premium",
  className,
  iconClassName,
  textClassName,
  ...props
}: PremiumBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center justify-center gap-[5px] rounded-full bg-[#ffd238] py-0 pl-3 pr-[13px] text-black whitespace-nowrap",
        className,
      )}
      {...props}
    >
      <svg
        className={cn("h-3.5 w-3.5 shrink-0", iconClassName)}
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M2 6.2L5.1 8.2L7.4 3.2C7.6 2.8 8.2 2.8 8.4 3.2L10.8 8.2L14 6.2C14.4 6 14.8 6.3 14.7 6.8L13.6 11.7H2.4L1.3 6.8C1.2 6.3 1.6 6 2 6.2Z"
          fill="currentColor"
        />
        <path d="M2.6 12.6H13.4V13.8H2.6V12.6Z" fill="currentColor" />
        <path
          d="M1.8 5.1C2.5 5.1 3 4.6 3 3.9C3 3.2 2.5 2.7 1.8 2.7C1.1 2.7 0.6 3.2 0.6 3.9C0.6 4.6 1.1 5.1 1.8 5.1Z"
          fill="currentColor"
        />
        <path
          d="M8 2.6C8.7 2.6 9.2 2.1 9.2 1.4C9.2 0.7 8.7 0.2 8 0.2C7.3 0.2 6.8 0.7 6.8 1.4C6.8 2.1 7.3 2.6 8 2.6Z"
          fill="currentColor"
        />
        <path
          d="M14.2 5.1C14.9 5.1 15.4 4.6 15.4 3.9C15.4 3.2 14.9 2.7 14.2 2.7C13.5 2.7 13 3.2 13 3.9C13 4.6 13.5 5.1 14.2 5.1Z"
          fill="currentColor"
        />
      </svg>

      <span
        className={cn("text-15-balootamma2-700 leading-100", textClassName)}
      >
        {label}
      </span>
    </span>
  );
}
