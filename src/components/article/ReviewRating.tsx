import type { Story } from "@/lib/api/stories";

/** Rating out of 5 for a review story, from `story.metadata["review-rating"]`.
 *  Rendered at the top of the review body. Returns null when there's no rating. */
export default function ReviewRating({ story }: { story: Story }) {
  const meta = (story?.metadata ?? {}) as Record<string, any>;
  const rating = meta["review-rating"];
  const raw = rating?.value ?? rating?.label;
  const value = typeof raw === "string" || typeof raw === "number" ? Number(raw) : NaN;
  if (!Number.isFinite(value) || value <= 0) return null;

  const MAX = 5;
  const title = String(meta["review-title"] || "Rating");
  const rounded = Math.round(value * 2) / 2; // nearest half

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-DFDFDF bg-F9F9F9 px-4 py-3">
      <span className="text-16-balootamma2-700 text-1E1E1E">{title}</span>
      <div
        className="flex items-center gap-0.5 text-[#F5A623]"
        role="img"
        aria-label={`${value} out of ${MAX}`}
      >
        {Array.from({ length: MAX }).map((_, i) => {
          const fill = Math.min(1, Math.max(0, rounded - i)); // 0, 0.5 or 1
          return <Star key={i} fill={fill} idx={i} />;
        })}
      </div>
      <span className="text-14-inter-600 text-6D6D6D">
        {value}/{MAX}
      </span>
    </div>
  );
}

/** A single star, `fill` = 0 (empty) | 0.5 (half) | 1 (full). */
function Star({ fill, idx }: { fill: number; idx: number }) {
  const id = `review-star-half-${idx}`;
  const path =
    "M12 2l2.9 6.3 6.9.7-5.1 4.7 1.4 6.8L12 17.8 5.9 21.2l1.4-6.8L2.2 9.7l6.9-.7L12 2z";
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      {fill === 0.5 && (
        <defs>
          <linearGradient id={id}>
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        </defs>
      )}
      <path
        d={path}
        fill={fill === 1 ? "currentColor" : fill === 0.5 ? `url(#${id})` : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
