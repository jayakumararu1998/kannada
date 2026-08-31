import type { CSSProperties } from "react";

import Link from "@/components/ui/PrefetchLink";
import { getBreakingNews, type BreakingNewsItem } from "@/lib/api/stories";

/**
 * Breaking-news ticker (dinamani parity) rendered site-wide via SiteChrome: a
 * blue "Breaking News" badge on the left + a seamless horizontal marquee of the
 * latest flash headlines. Server component — no client JS: the track holds TWO
 * copies of the items and the CSS animation slides it by exactly half its width
 * for a seamless loop; hovering pauses it (CSS `:hover`). Hidden when there are
 * no active breaking items.
 */

const LABEL = "ಬ್ರೇಕಿಂಗ್ ನ್ಯೂಸ್";

function LightningIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="currentColor" aria-hidden="true">
      <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
    </svg>
  );
}

/** The circled-dot bullet before each headline. */
function DotIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-6D6D6D" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="8" cy="8" r="2.2" fill="currentColor" />
    </svg>
  );
}

function TickerItem({ item }: { item: BreakingNewsItem }) {
  const inner = (
    <span className="inline-flex items-center gap-2 whitespace-nowrap px-4">
      <DotIcon />
      <span className="leading-none">{item.headline}</span>
    </span>
  );
  return item.slug ? (
    <Link
      href={`/${item.slug.replace(/^\/+/, "")}`}
      className="inline-flex items-center text-333333 hover:text-009EF9 hover:underline"
    >
      {inner}
    </Link>
  ) : (
    <span className="inline-flex items-center text-333333">{inner}</span>
  );
}

export default async function BreakingNews() {
  const items = await getBreakingNews();
  // No active items → keep the SAME 39px strip the Suspense placeholder
  // reserved rather than collapsing it. Returning null made the bar's height
  // depend on data that only arrives after first paint, which shifted every
  // page below it (~0.04 CLS on mobile).
  if (items.length === 0) {
    return <div className="h-[39px] w-full border-b border-DFDFDF bg-FFFFFF" />;
  }

  // Constant-ish speed: longer lists scroll longer. `--marquee-duration` feeds
  // the CSS animation (see globals.css `.breaking-marquee`).
  const duration = Math.max(24, items.length * 6);
  const durationStyle = { "--marquee-duration": `${duration}s` } as CSSProperties;

  const Track = ({ hidden = false }: { hidden?: boolean }) => (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((item, i) => (
        <TickerItem key={`${hidden ? "b" : "a"}-${i}`} item={item} />
      ))}
    </div>
  );

  return (
    <div
      className="breaking-ticker w-full border-b border-DFDFDF bg-FFFFFF"
      role="region"
      aria-label="Breaking News"
    >
      <div className="flex h-[38px] w-full items-stretch px-4 sm:px-6 lg:px-[60px]">
        {/* Left badge */}
        <div className="my-1.5 flex shrink-0 items-center gap-1.5 rounded-md bg-009EF9 px-3 text-white">
          <LightningIcon />
          <span className="hidden whitespace-nowrap text-13-balootamma2-600 font-bold leading-none sm:inline">
            {LABEL}
          </span>
        </div>
        {/* Marquee */}
        <div className="relative ml-2 flex flex-1 items-center overflow-hidden">
          <div
            className="breaking-marquee flex w-max text-14-balootamma2-500"
            style={durationStyle}
          >
            <Track />
            <Track hidden />
          </div>
        </div>
      </div>
    </div>
  );
}
