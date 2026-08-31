"use client";

import { useState } from "react";

/** Extract the 11-char video id from any common YouTube URL form. */
function youTubeId(url?: string): string | null {
  if (!url) return null;
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
  );
  return m ? m[1] : null;
}

/**
 * Click-to-load YouTube facade: renders a lightweight poster + play button and
 * only mounts the heavy iframe on interaction. Keeps the article fast (no
 * third-party iframe in the critical path) — a deliberate improvement over
 * eagerly embedding the player.
 */
export default function YouTubeEmbed({
  embedUrl,
  thumbnailUrl,
  title,
}: {
  embedUrl?: string;
  thumbnailUrl?: string;
  title?: string;
}) {
  const [active, setActive] = useState(false);
  const id = youTubeId(embedUrl);
  if (!id) return null;

  const poster =
    thumbnailUrl || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

  return (
    <div className="relative w-full aspect-video overflow-hidden rounded bg-black">
      {active ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
          title={title || "YouTube video"}
          allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setActive(true)}
          className="group absolute inset-0 h-full w-full cursor-pointer"
          aria-label={title ? `Play video: ${title}` : "Play video"}
        >
          <img
            src={poster}
            alt={title || "Video thumbnail"}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-black/70 transition-colors group-hover:bg-red-600">
              <svg viewBox="0 0 24 24" className="h-7 w-7 translate-x-[2px] fill-white">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
