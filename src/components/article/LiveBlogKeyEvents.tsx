"use client";

import { useState } from "react";

import { formatArticleDate, type Story } from "@/lib/api/stories";
import { stripTags } from "@/lib/api/article-html";

/** Live-blog card timestamp (event → added → updated). */
function cardTime(card: any): number | undefined {
  return (
    card?.["card-event-at"] || card?.["card-added-at"] || card?.["card-updated-at"]
  );
}

/** A key-event card's label: its title element, else its first text element. */
function keyEventLabel(card: any): string {
  const title = (card?.["story-elements"] ?? []).find(
    (e: any) => e?.type === "title" && e.text,
  );
  if (title) return stripTags(title.text);
  const txt = (card?.["story-elements"] ?? []).find(
    (e: any) => e?.type === "text" && e.text,
  );
  return txt ? stripTags(txt.text) : "";
}

function ClockIcon() {
  return (
    <span className="relative z-[1] grid h-6 w-6 shrink-0 place-items-center rounded-full bg-F9F9F9 text-808080">
      <svg
        viewBox="0 0 24 24"
        className="h-[15px] w-[15px] fill-none stroke-current"
        strokeWidth={1.8}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l2.5 1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/**
 * "Key Events" panel for a live blog — rendered where the builder template
 * places the `ArticleLiveBlogKeyEvents` component (between the hero and the
 * live-blog body). Data comes from the STORY: cards flagged
 * `metadata.attributes["key-event"] === true`, chronological. Each entry links
 * to its update in the timeline (`#u-{card.id}`). Shows the first 5, with a
 * toggle for the rest. Renders nothing when there are no key events.
 */
export default function LiveBlogKeyEvents({ story }: { story: Story }) {
  const [expanded, setExpanded] = useState(false);
  const events = (story?.cards ?? [])
    .filter((c: any) => c?.metadata?.attributes?.["key-event"] === true)
    .sort((a: any, b: any) => (cardTime(a) ?? 0) - (cardTime(b) ?? 0));
  if (events.length === 0) return null;

  const INITIAL = 5;
  const shown = expanded ? events : events.slice(0, INITIAL);
  const hasMore = events.length > INITIAL;

  return (
    <section className="mb-6">
      <h2 className="mb-4 flex items-center gap-2 text-18-balootamma2-700 text-111111">
        <svg
          viewBox="0 0 24 24"
          className="h-[18px] w-[18px] fill-[#009EF9]"
          aria-hidden="true"
        >
          <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />
        </svg>
        Key Events
      </h2>

      {/* Timeline: a vertical line behind the clock icons. "Show more" expands
          the list inline to reveal all key events. */}
      <ol className="relative space-y-5 before:absolute before:bottom-3 before:left-3 before:top-3 before:w-px before:bg-DFDFDF">
        {shown.map((card: any, i: number) => {
          const ts = cardTime(card);
          const label = keyEventLabel(card);
          const active = i === 0; // newest of the shown set, highlighted
          return (
            <li key={card.id || i} className="flex gap-3">
              <ClockIcon />
              <div className="min-w-0 flex-1">
                {ts && (
                  <div className="mb-1.5 text-13-inter-500 text-808080">
                    {formatArticleDate(ts)}
                  </div>
                )}
                <a
                  href={card.id ? `#u-${card.id}` : undefined}
                  className={`block rounded-lg bg-F9F9F9 px-4 py-3 text-15-balootamma2-600 leading-snug transition-colors hover:text-009EF9 ${
                    active ? "text-009EF9 underline" : "text-1E1E1E"
                  }`}
                >
                  {label}
                </a>
              </div>
            </li>
          );
        })}
      </ol>

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-5 w-full rounded-lg border border-D2D2D2 py-3 text-center text-15-balootamma2-600 text-333333 transition-colors hover:border-009EF9 hover:text-009EF9"
        >
          {expanded ? "ಕಡಿಮೆ ತೋರಿಸಿ" : "ಪ್ರಮುಖ ಅಂಶಗಳು"}
        </button>
      )}
    </section>
  );
}
