"use client";

import { useEffect, useState } from "react";

import type { Story } from "@/lib/api/stories";
import { formatArticleDate } from "@/lib/api/stories";
import { prepareArticleHtml, stripTags } from "@/lib/api/article-html";
import { toMediaUrl } from "@/lib/images";
import { SITE_URL } from "@/lib/constants";
import RawEmbed from "./elements/RawEmbed";
import YouTubeEmbed from "./elements/YouTubeEmbed";

/**
 * Live-blog body — matches dinamani's ArticleLiveBlogBody conditions:
 *  - a LIVE badge (pulsing) while the blog is open; "ಮುಕ್ತಾಯ" (closed) once
 *    `metadata["is-closed"]` is set
 *  - each card is a timeline UPDATE with its own timestamp
 *    (`card-event-at` | `card-added-at`), newest first
 *  - polls `/api/story?slug=` every 30s and merges in new/updated cards while
 *    the tab is open (client-side, no full reload) — the one template body that
 *    refreshes itself
 */

const REFRESH_MS = 30000;

function cardTime(card: any): number | undefined {
  return card?.["card-event-at"] || card?.["card-added-at"] || card?.["card-updated-at"];
}

/** The card's own title (first title element) for share text / key-events. */
function cardTitle(card: any): string {
  const el = (card?.["story-elements"] ?? []).find(
    (e: any) => e?.type === "title" && e.text,
  );
  return el ? stripTags(el.text) : "";
}

/** Per-update share button — deep-links to this update (Web Share / copy link). */
function LiveShare({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const onClick = async () => {
    const nav = typeof navigator !== "undefined" ? navigator : undefined;
    if (nav?.share) {
      try {
        await nav.share({ title, url });
        return;
      } catch {
        /* cancelled → copy */
      }
    }
    try {
      await nav?.clipboard?.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={copied ? "Link copied" : "Share this update"}
      title={copied ? "Link copied" : "Share"}
      className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-808080 transition-colors hover:bg-F9F9F9 hover:text-009EF9"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
        <path d="M18 16a3 3 0 0 0-2.2 1l-6-3.4a3 3 0 0 0 0-1.2l6-3.4a3 3 0 1 0-1-1.7l-6 3.4a3 3 0 1 0 0 4.6l6 3.4A3 3 0 1 0 18 16Z" />
      </svg>
    </button>
  );
}

/** Compact per-card element renderer (live-blog cards are text + media). */
function CardElement({ el, heroImageUrl }: { el: any; heroImageUrl?: string }) {
  const type = el?.type;
  if (type === "title" && el.text) {
    return <h3 className="mb-2 text-20-balootamma2-700 text-1E1E1E">{stripTags(el.text)}</h3>;
  }
  // Summary block → indigo ribbon tab + prose (matches the article summary card).
  if (type === "text" && el.subtype === "summary" && el.text) {
    return (
      <div className="my-3">
        <div className="mb-3">
          <span className="inline-block rounded-tl-lg rounded-br-lg bg-[#2C39C6] px-4 py-1.5 text-14-manrope-600 leading-none text-white">
            Summary
          </span>
        </div>
        <div
          className="article-links text-18-inter-400 leading-[1.7] text-333333"
          dangerouslySetInnerHTML={{ __html: prepareArticleHtml(el.text) }}
        />
      </div>
    );
  }
  if (type === "image" && el["image-s3-key"]) {
    return (
      <figure className="my-3">
        <img
          src={toMediaUrl(el["image-s3-key"])}
          alt={el.title || el["alt-text"] || ""}
          className="w-full rounded object-cover"
          loading="lazy"
        />
        {el.title && (
          <figcaption className="mt-1 text-12-inter-400 text-6D6D6D">
            {stripTags(el.title)}
          </figcaption>
        )}
      </figure>
    );
  }
  if (type === "youtube-video" && el["embed-url"]) {
    return (
      <div className="my-3">
        <YouTubeEmbed embedUrl={el["embed-url"]} thumbnailUrl={heroImageUrl} title={el.title} />
      </div>
    );
  }
  if (type === "jsembed" || type === "video" || type === "embed") {
    return <div className="my-3"><RawEmbed embedJs={el["embed-js"]} /></div>;
  }
  if (type === "text" && el.text) {
    return (
      <div
        className="article-links text-18-inter-400 leading-[1.7] text-333333"
        dangerouslySetInnerHTML={{ __html: prepareArticleHtml(el.text) }}
      />
    );
  }
  return null;
}

export default function ArticleLiveBlog({
  story: initialStory,
  heroImageUrl,
}: {
  story: Story;
  heroImageUrl?: string;
}) {
  const [story, setStory] = useState<Story>(initialStory);
  const slug = initialStory.slug as string;
  const canonical = `${SITE_URL.replace(/\/+$/, "")}/${slug}`;

  const isClosed =
    !!story?.metadata?.["is-closed"] || story?.["is-live-blog"] === false;

  // Poll for updates while the blog is open and the tab is visible.
  useEffect(() => {
    if (isClosed || !slug) return;
    let alive = true;
    const poll = async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        const res = await fetch(
          `/api/story?slug=${encodeURIComponent(slug)}`,
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!alive || !data?.story) return;
        setStory((cur) =>
          data.story["content-updated-at"] !== cur?.["content-updated-at"]
            ? data.story
            : cur,
        );
      } catch {
        /* retry next tick */
      }
    };
    const id = setInterval(poll, REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [slug, isClosed]);

  // While LIVE (open) → newest update first (the common live-blog order).
  // Once CLOSED → chronological start → end, so it reads like a finished story.
  const cards = [...(story?.cards ?? [])].sort((a, b) => {
    const asc = (cardTime(a) ?? 0) - (cardTime(b) ?? 0);
    return isClosed ? asc : -asc;
  });

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        {isClosed ? (
          <span className="rounded bg-808080 px-2 py-1 text-12-inter-700 uppercase text-white">
            ಮುಕ್ತಾಯ
          </span>
        ) : (
          <span className="flex items-center gap-2 rounded bg-red-600 px-2 py-1 text-12-inter-700 uppercase text-white">
            <span className="live-dot inline-block h-2 w-2 rounded-full bg-white" />
            LIVE
          </span>
        )}
        <span className="text-12-inter-400 text-808080">
          {cards.length} ನವೀಕರಣಗಳು
        </span>
      </div>

      {/* Timeline: a vertical line with a dot per update. */}
      <div className="relative space-y-8 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-DFDFDF">
        {cards.map((card: any, ci: number) => {
          const ts = cardTime(card);
          const shareUrl = `${canonical}${card.id ? `#u-${card.id}` : ""}`;
          return (
            <article
              key={card.id || ci}
              id={card.id ? `u-${card.id}` : undefined}
              className="relative scroll-mt-24 pl-8"
            >
              {/* Timeline dot. */}
              <span className="absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border-2 border-009EF9 bg-white" />
              {/* Header: timestamp + share. */}
              <div className="mb-2 flex items-center justify-between gap-3">
                {ts ? (
                  <time className="text-12-inter-600 text-808080">
                    {formatArticleDate(ts)}
                  </time>
                ) : (
                  <span />
                )}
                <LiveShare
                  url={shareUrl}
                  title={cardTitle(card) || (story.headline as string) || ""}
                />
              </div>
              <div className="space-y-3">
                {(card["story-elements"] ?? []).map((el: any, ei: number) => (
                  <CardElement
                    key={el.id || `${ci}-${ei}`}
                    el={el}
                    heroImageUrl={heroImageUrl}
                  />
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
