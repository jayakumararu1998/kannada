"use client";

import { useState } from "react";
import { mediaThumb } from "@/lib/images";

export type CarouselPhoto = {
  s3Key?: string;
  title?: string;
  attribution?: string;
};

/**
 * Minimal client carousel for `image-gallery` (slideshow) composites. Prev/next
 * + dots, no external library. Images are plain <img> (Next optimizer is
 * disabled project-wide), so this stays cheap.
 */
export default function PhotoCarousel({ photos }: { photos: CarouselPhoto[] }) {
  const [i, setI] = useState(0);
  const clean = photos.filter((p) => p.s3Key);
  if (clean.length === 0) return null;

  const cur = clean[Math.min(i, clean.length - 1)];
  const go = (d: number) =>
    setI((v) => (v + d + clean.length) % clean.length);

  return (
    <div className="my-4">
      <div className="relative w-full overflow-hidden rounded bg-gray-100 dark:bg-white/5">
        <img
          src={mediaThumb(cur.s3Key, 1200, 75)}
          alt={cur.title || "Gallery image"}
          className="max-h-[470px] w-full object-contain"
          loading="lazy"
          decoding="async"
        />
        {clean.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next image"
              className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              ›
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-2 py-0.5 text-11-inter-500 text-white">
              {i + 1} / {clean.length}
            </div>
          </>
        )}
      </div>
      {(cur.title || cur.attribution) && (
        <p className="mt-2 px-1 text-12-inter-400 text-6D6D6D">
          {cur.title}
          {cur.title && cur.attribution ? " — " : ""}
          {cur.attribution}
        </p>
      )}
    </div>
  );
}
