"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface Props {
  slides: ReactNode[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  loop?: boolean;
  /** Visible slides at the desktop breakpoint (mobile always shows 1). */
  perView?: number;
}

/**
 * Lightweight carousel. Content is server-rendered and passed via `slides`; this
 * component only manages the active index, autoplay, arrows and dots.
 */
export default function Slider({
  slides,
  autoPlay,
  autoPlayInterval = 4000,
  showDots = true,
  showArrows = true,
  loop = true,
  perView = 1,
}: Props) {
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const maxIndex = Math.max(0, count - perView);

  // Absolute jump (arrows/dots) with wrap/clamp.
  const go = useCallback(
    (target: number) => {
      setIndex(() => {
        if (target < 0) return loop ? maxIndex : 0;
        if (target > maxIndex) return loop ? 0 : maxIndex;
        return target;
      });
    },
    [loop, maxIndex],
  );

  // Advance one step — functional updater, so the interval never goes stale.
  const step = useCallback(() => {
    setIndex((cur) => (cur >= maxIndex ? (loop ? 0 : maxIndex) : cur + 1));
  }, [loop, maxIndex]);

  useEffect(() => {
    if (!autoPlay || count <= perView) return;
    const id = setInterval(step, autoPlayInterval);
    return () => clearInterval(id);
  }, [autoPlay, autoPlayInterval, count, perView, step]);

  if (count === 0) return null;

  const basis = `${100 / perView}%`;

  return (
    <div className="relative w-full">
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${(index * 100) / perView}%)` }}
        >
          {slides.map((slide, i) => (
            <div key={i} className="shrink-0 px-2" style={{ flexBasis: basis, maxWidth: basis }}>
              {slide}
            </div>
          ))}
        </div>
      </div>

      {showArrows && count > perView && (
        <>
          <button
            aria-label="Previous"
            onClick={() => go(index - 1)}
            className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-white"
          >
            ‹
          </button>
          <button
            aria-label="Next"
            onClick={() => go(index + 1)}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-white"
          >
            ›
          </button>
        </>
      )}

      {showDots && count > perView && (
        <div className="mt-3 flex justify-center gap-2">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => go(i)}
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                i === index ? "bg-3046EB" : "bg-[var(--color-D2D2D2)]",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
