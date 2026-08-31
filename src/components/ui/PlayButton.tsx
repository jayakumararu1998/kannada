"use client";

import { cn } from "@/lib/utils";

type PlayButtonProps = {
  label?: string;
  onClick?: () => void;
  className?: string;
  iconClassName?: string;
};

export default function PlayButton({
  label = "Play",
  onClick,
  className,
  iconClassName,
}: PlayButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "inline-flex h-[76px] w-[76px] items-center justify-center rounded-full border-[6px] border-white bg-transparent text-white",
        "transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
        className,
      )}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 32 36"
        className={cn("ml-[5px] h-[36px] w-[32px]", iconClassName)}
        fill="currentColor"
      >
        <path d="M4 2.83c0-1.72 1.93-2.73 3.35-1.76l22.7 15.17c1.25.84 1.25 2.68 0 3.52L7.35 34.93C5.93 35.9 4 34.89 4 33.17V2.83Z" />
      </svg>
    </button>
  );
}
