"use client";

// A CLIENT component on purpose. The cards that render it are server
// components, so if this were one too its whole <img> — srcset included, ~450
// characters — would be serialized into the RSC flight payload on top of the
// HTML. Across the ~100 cards of the home page that duplication measurably
// delayed first paint. As a client component the flight carries a module
// reference and four short props instead, while the HTML still ships the full
// responsive markup for the browser's preload scanner.

import { CARD_SIZES, cardSrcSet } from "@/lib/images";

/**
 * The `<img>` used by every news card (component_vertical / component_horizontal).
 *
 * Cards are laid out `w-full` inside a builder grid cell, so the same image can
 * render at 137px in one row and 380px in the next. They all used to load the
 * single `?w=800` variant, which PageSpeed flagged as ~600 KiB of wasted bytes
 * on the home page and ~300 KiB on a section page — the dominant cost in mobile
 * LCP / Speed Index.
 *
 * This renders a `srcset` across the CDN's resize ladder plus:
 *  - `sizes="auto"` for lazy cards, so the browser picks the variant from the
 *    box it actually laid out (exactly right, no per-card guessing). Browsers
 *    without `sizes=auto` treat it as invalid and fall back to 100vw, i.e. the
 *    behaviour we had before — never worse.
 *  - an explicit `sizes` for eager/priority cards, since `sizes=auto` is only
 *    defined for `loading="lazy"` images.
 */
export default function CardImage({
  src,
  alt,
  className,
  priority = false,
  sizes,
}: {
  src?: string;
  alt?: string;
  className?: string;
  /** Above-the-fold card — loads eagerly at high fetch priority. */
  priority?: boolean;
  /** Override the computed `sizes` when a card's width is known up front. */
  sizes?: string;
}) {
  const srcSet = cardSrcSet(src);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={className}
      src={src}
      srcSet={srcSet}
      sizes={srcSet ? (sizes ?? (priority ? CARD_SIZES : "auto")) : undefined}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
    />
  );
}
