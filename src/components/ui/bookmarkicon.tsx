import { cn } from "@/lib/utils";

type BookmarkIconProps = {
  active?: boolean;
  className?: string;
};

export default function BookmarkIcon({
  active = false,
  className,
}: BookmarkIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn("h-[25px] w-[19px]", className)}
      viewBox="0 0 19 25"
      fill="none"
    >
      <path
        d="M3.25 2.25H15.75C16.3 2.25 16.75 2.7 16.75 3.25V21.25L9.5 16.7L2.25 21.25V3.25C2.25 2.7 2.7 2.25 3.25 2.25Z"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
