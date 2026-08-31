import { cn } from "@/lib/utils";

export type FiveStarProps = {
  className?: string;
  starClassName?: string;
  label?: string;
  count?: number;
  /**
   * Fractional rating (0..count). When set, stars render as full / half / empty
   * to reflect the value. When omitted, all `count` stars render filled — the
   * legacy behaviour used by static call sites.
   */
  rating?: number;
};

const STAR_PATH =
  "M8 0L9.8 5.2H15.3L10.9 8.4L12.6 13.7L8 10.5L3.4 13.7L5.1 8.4L0.7 5.2H6.2L8 0Z";

/** A single star glyph. `dim` renders the empty (unfilled) state. */
function Star({ className, dim }: { className?: string; dim?: boolean }) {
  return (
    <svg
      className={cn("shrink-0", className)}
      viewBox="0 0 16 15"
      width="1em"
      height="1em"
      aria-hidden="true"
      style={dim ? { opacity: 0.3 } : undefined}
    >
      <path d={STAR_PATH} fill="currentColor" />
    </svg>
  );
}

/** A dim base star with a full star clipped to its left half overlaid. */
function HalfStar({ className }: { className?: string }) {
  return (
    <span className="relative inline-flex shrink-0">
      <Star className={className} dim />
      <span
        className="absolute inset-0 overflow-hidden"
        style={{ width: "50%" }}
      >
        <Star className={className} />
      </span>
    </span>
  );
}

export default function FiveStar({
  className,
  starClassName,
  label = "5 star rating",
  count = 5,
  rating,
}: FiveStarProps) {
  const bound = typeof rating === "number";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-sm text-FACC15",
        className,
      )}
      role="img"
      aria-label={bound ? `${rating} out of ${count} stars` : label}
    >
      {Array.from({ length: count }).map((_, index) => {
        // Legacy (no rating): every star filled.
        if (!bound) return <Star key={index} className={starClassName} />;
        const position = index + 1;
        if (rating! >= position) {
          return <Star key={index} className={starClassName} />;
        }
        if (rating! >= position - 0.5) {
          return <HalfStar key={index} className={starClassName} />;
        }
        return <Star key={index} className={starClassName} dim />;
      })}
    </span>
  );
}
