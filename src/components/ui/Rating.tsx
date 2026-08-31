"use client";

type RatingProps = {
  rating?: number;
  total?: number;
  label?: string;
  className?: string;
  labelClassName?: string;
  starClassName?: string;
};

function StarIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 15"
      className={`h-[15px] w-[16px] shrink-0 ${
        filled ? "text-[#F5B400]" : "text-808080"
      } ${className || ""}`}
      fill="currentColor"
    >
      <path d="M8 0L9.8 5.2H15.3L10.9 8.4L12.6 13.7L8 10.5L3.4 13.7L5.1 8.4L0.7 5.2H6.2L8 0Z" />
    </svg>
  );
}

export default function Rating({
  rating = 3,
  total = 5,
  label,
  className,
  labelClassName,
  starClassName,
}: RatingProps) {
  const normalizedRating = Math.max(0, Math.min(rating, total));
  const displayLabel = label || `Rating(${normalizedRating} / ${total})`;

  return (
    <div
      className={`inline-flex items-center gap-[6px] bg-transparent ${
        className || ""
      }`}
      aria-label={displayLabel}
    >
      <span
        className={`font-manrope text-[15px] font-semibold leading-none text-4A4A4A ${
          labelClassName || ""
        }`}
      >
        {displayLabel}
      </span>

      <span className="inline-flex items-center gap-[3px]" aria-hidden="true">
        {Array.from({ length: total }).map((_, index) => (
          <StarIcon
            key={index}
            filled={index < normalizedRating}
            className={starClassName}
          />
        ))}
      </span>
    </div>
  );
}
