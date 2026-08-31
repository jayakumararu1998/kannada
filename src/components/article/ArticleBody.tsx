import Link from "next/link";

import type { ReactNode } from "react";

import type { Story } from "@/lib/api/stories";
import { prepareArticleHtml, stripTags } from "@/lib/api/article-html";
import { mediaThumb, toMediaUrl } from "@/lib/images";
import { resolveStoryVideo } from "@/lib/article/story-video";
import { tableRows } from "@/lib/article/table";
import ReviewRating from "./ReviewRating";
import {
  buildParagraphAdPlan,
  computeParagraphMap,
  computeImageMap,
  getAdSlotForParagraph,
  type InArticleAdSlot,
  type ParagraphInfo,
} from "@/lib/article/inline-ads";
import RawEmbed from "./elements/RawEmbed";
import YouTubeEmbed from "./elements/YouTubeEmbed";
import PhotoCarousel from "./elements/PhotoCarousel";
import InArticleAd from "./elements/InArticleAd";

/** Renders the configured in-article ad after a given global paragraph index. */
type RenderInlineAd = (globalIdx: number) => ReactNode;

/**
 * Renders the article body: walks `story.cards[].story-elements[]` and renders
 * every Quintype element type & subtype. Server component — only the genuinely
 * interactive pieces (embeds, carousel) are client islands.
 *
 * Covered element types: text (regular / summary / also-read / quote /
 * blockquote / blurb / q-and-a / question / bigfact / cta / promotional),
 * title, image, composite (image-gallery slideshow|grid, references),
 * youtube-video, jsembed (tweet / instagram / other), video, data (table),
 * file (pdf / generic).
 */

// Editorial text formatting is handled by the ported `.article-links` CSS
// (globals.css) — paragraph spacing, list semantics, headings, link colors.
// Tailwind only sets the base font/size/colour/leading here.
const PROSE = "article-links text-18-inter-400 leading-[1.7] text-333333";

function LinkedStoryCard({ story }: { story: any }) {
  if (!story?.slug) return null;
  const img = story["hero-image-s3-key"];
  return (
    <div className="relative my-6 rounded-lg border border-DFDFDF bg-FFFFFF">
      {/* "Also Read" ribbon tab, straddling the card's top-left corner */}
      <span className="absolute left-0 top-0 z-[1] inline-block rounded-tl-lg rounded-br-lg bg-[#2C39C6] px-4 py-1.5 text-14-manrope-600 leading-none text-white">
        Also Read
      </span>
      <Link
        href={`/${story.slug}`}
        className="flex flex-col gap-3 px-4 pb-4 pt-12 no-underline sm:flex-row sm:items-center sm:gap-6 sm:px-6 sm:pb-6"
      >
        {img && (
          <div className="aspect-[16/9] w-full overflow-hidden rounded sm:aspect-auto sm:h-[104px] sm:w-[170px] sm:flex-shrink-0">
            <img
              src={mediaThumb(img, 400, 70)}
              alt={story.headline || ""}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        )}
        <h4 className="text-18-balootamma2-700 leading-snug text-1E1E1E sm:text-20-balootamma2-700">
          {story.headline}
        </h4>
      </Link>
    </div>
  );
}

function Element({
  el,
  story,
  heroImageUrl,
  paraInfo,
  renderInlineAd,
  imageAdIdx,
  imageAnchored = false,
}: {
  el: any;
  story: Story;
  heroImageUrl?: string;
  /** Paragraph split + global start index for THIS element (regular text only). */
  paraInfo?: ParagraphInfo;
  renderInlineAd?: RenderInlineAd;
  /** contentType 'image' anchoring: this image's 0-based global index. */
  imageAdIdx?: number;
  /** When true (photo galleries), ads anchor to images, not paragraphs. */
  imageAnchored?: boolean;
}) {
  const type = el?.type;
  const subtype = el?.subtype;

  // ---- rich text & its subtypes ----------------------------------------
  if (type === "text") {
    if (subtype === "summary" && el.text) {
      return (
        <div className="relative my-6 rounded-lg border border-DFDFDF bg-FFFFFF">
          {/* "Summary" ribbon tab, straddling the card's top-left corner */}
          <span className="absolute left-0 top-0 z-[1] inline-block rounded-tl-lg rounded-br-lg bg-[#2C39C6] px-4 py-1.5 text-14-manrope-600 leading-none text-white">
            Summary
          </span>
          <div
            className={`${PROSE} px-4 pb-4 pt-12 sm:px-6 sm:pb-6`}
            dangerouslySetInnerHTML={{ __html: prepareArticleHtml(el.text) }}
          />
        </div>
      );
    }
    if (subtype === "also-read") {
      const id =
        el.metadata?.["linked-story-id"] || el["linked-story-id"];
      const linked =
        (id && story["linked-stories"]?.[id]) ||
        el.metadata?.["linked-story"];
      if (linked) return <LinkedStoryCard story={linked} />;
      return null;
    }
    if (subtype === "quote" || subtype === "blockquote") {
      // The text already contains a <blockquote>; the marks class adds the
      // decorative “ ” glyphs via ::before/::after (ported from dinamani).
      const marks = subtype === "blockquote" ? "blockquote-marks" : "quote-marks";
      return (
        <div
          className={`my-5 ${marks} article-links border-l-4 border-009EF9 pl-4 text-20-inter-400 italic text-4A4A4A [&_blockquote]:m-0`}
          dangerouslySetInnerHTML={{ __html: prepareArticleHtml(el.text) }}
        />
      );
    }
    if (subtype === "blurb") {
      return (
        <div
          className="my-4 article-links rounded-lg bg-F9F9F9 p-4 text-18-balootamma2-600 italic text-333333 [&_blockquote]:m-0"
          dangerouslySetInnerHTML={{ __html: prepareArticleHtml(el.text) }}
        />
      );
    }
    if (subtype === "bigfact") {
      const content = el.metadata?.content || el.text;
      if (!content) return null;
      return (
        <div className="my-6 border-y border-DFDFDF py-6 text-center">
          <div className="text-32-balootamma2-700 text-009EF9">
            {stripTags(content)}
          </div>
          {el.metadata?.attribution && (
            <div className="mt-2 text-14-inter-400 text-808080">
              {el.metadata.attribution}
            </div>
          )}
        </div>
      );
    }
    if (subtype === "q-and-a") {
      const q = el.metadata?.question;
      const a = el.metadata?.answer;
      if (!q && !a) return null;
      return (
        <div className="my-4 space-y-3">
          {q && <QA badge="Q" tone="q" html={q} />}
          {a && <QA badge="A" tone="a" html={a} />}
        </div>
      );
    }
    if (subtype === "question") {
      return <div className="my-4"><QA badge="Q" tone="q" html={el.text} /></div>;
    }
    if (subtype === "answer") {
      return <div className="my-4"><QA badge="A" tone="a" html={el.text} /></div>;
    }
    if (subtype === "cta" && el.metadata?.["cta-url"]) {
      return (
        <div className="my-4 text-center">
          <a
            href={el.metadata["cta-url"]}
            target={el.metadata["open-in-new-tab"] ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="inline-block rounded-full bg-009EF9 px-6 py-3 text-16-balootamma2-600 text-white hover:opacity-90"
          >
            {el.metadata["cta-title"] || stripTags(el.text) || "Read more"}
          </a>
        </div>
      );
    }
    if (el.metadata?.["promotional-message"]) {
      return (
        <div
          className="my-3 article-links text-14-inter-400 text-808080"
          dangerouslySetInnerHTML={{ __html: prepareArticleHtml(el.text) }}
        />
      );
    }
    if (el.text) {
      // Regular body text: split into paragraphs and place any configured
      // in-article ad AFTER its target paragraph (builder-driven positions).
      if (paraInfo && paraInfo.paragraphs.length > 0) {
        return (
          <>
            {paraInfo.paragraphs.map((para, i) => {
              const globalIdx = paraInfo.startIndex + i;
              return (
                <div key={i}>
                  <div
                    className={PROSE}
                    dangerouslySetInnerHTML={{ __html: prepareArticleHtml(para) }}
                  />
                  {/* Photo galleries anchor ads to IMAGES, not paragraphs. */}
                  {!imageAnchored && renderInlineAd?.(globalIdx)}
                </div>
              );
            })}
          </>
        );
      }
      // No <p> blocks to anchor to → render as one block.
      return (
        <div
          className={PROSE}
          dangerouslySetInnerHTML={{ __html: prepareArticleHtml(el.text) }}
        />
      );
    }
    return null;
  }

  // ---- inline title / subhead ------------------------------------------
  if (type === "title" && el.text) {
    return (
      <h2 className="mt-6 mb-2 text-24-balootamma2-700 text-1E1E1E">
        {stripTags(el.text)}
      </h2>
    );
  }

  // ---- single image ----------------------------------------------------
  if (type === "image" && el["image-s3-key"]) {
    const src = mediaThumb(el["image-s3-key"], 1200, 75);
    return (
      <>
        <figure className="my-4">
          <div className="relative w-full overflow-hidden rounded bg-gray-100 dark:bg-white/5">
            <img
              src={src}
              alt={el.title || el["alt-text"] || "Story image"}
              className="max-h-[470px] w-full object-contain"
              loading="lazy"
            />
          </div>
          {(el.title || el["image-attribution"]) && (
            <figcaption className="mt-2 px-1 text-12-inter-400 text-6D6D6D">
              {el.title && <span className="text-333333">{stripTags(el.title)}</span>}
              {el.title && el["image-attribution"] ? " — " : ""}
              {el["image-attribution"]}
            </figcaption>
          )}
        </figure>
        {/* Photo-gallery ad: fires AFTER this image when its index is targeted. */}
        {imageAnchored &&
          imageAdIdx !== undefined &&
          renderInlineAd?.(imageAdIdx)}
      </>
    );
  }

  // ---- composites: galleries & references ------------------------------
  if (type === "composite" && subtype === "image-gallery") {
    const imgs = (el["story-elements"] ?? []).filter(
      (i: any) => i["image-s3-key"],
    );
    if (imgs.length === 0) return null;
    if (el.metadata?.type === "slideshow") {
      return (
        <PhotoCarousel
          photos={imgs.map((i: any) => ({
            s3Key: i["image-s3-key"],
            title: stripTags(i.title),
            attribution: i["image-attribution"],
          }))}
        />
      );
    }
    return (
      <div className="my-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {imgs.map((i: any, idx: number) => (
          <div key={i.id || idx}>
            <img
              src={mediaThumb(i["image-s3-key"], 400, 70)}
              alt={i["alt-text"] || i.title || "Gallery image"}
              className="h-[150px] w-full rounded object-cover"
              loading="lazy"
              decoding="async"
            />
            {i["image-attribution"] && (
              <p className="mt-1 text-12-inter-400 text-808080">
                {stripTags(i["image-attribution"])}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  }
  if (type === "composite" && subtype === "references") {
    const refs = el["story-elements"] ?? [];
    if (refs.length === 0) return null;
    return (
      <div className="my-4 rounded-lg border border-DFDFDF bg-F9F9F9 p-4">
        <h4 className="mb-2 text-16-balootamma2-700 text-1E1E1E">ಆಕರಗಳು</h4>
        <ul className="list-disc space-y-2 pl-5">
          {refs.map((r: any, idx: number) => (
            <li key={r.id || idx} className="text-14-inter-400 text-333333">
              {r.metadata?.url ? (
                <a
                  href={r.metadata.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-009EF9 hover:underline"
                >
                  {r.metadata?.name || "Reference"}
                </a>
              ) : (
                <span>{r.metadata?.name}</span>
              )}
              {r.metadata?.description && (
                <span className="block text-12-inter-400 text-808080">
                  {r.metadata.description}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // ---- video / embeds --------------------------------------------------
  if (type === "youtube-video" && el["embed-url"]) {
    // Use the video element's OWN thumbnail if it has one; otherwise let
    // YouTubeEmbed fall back to the video's YouTube poster. Do NOT use the
    // article hero image — a body video should show its own thumbnail (multiple
    // body videos would otherwise all share the same hero image).
    const videoThumb = el["image-s3-key"]
      ? toMediaUrl(el["image-s3-key"])
      : undefined;
    return (
      <div className="my-4">
        <YouTubeEmbed
          embedUrl={el["embed-url"]}
          thumbnailUrl={videoThumb}
          title={el.title}
        />
      </div>
    );
  }
  if (type === "jsembed" || type === "video" || type === "embed") {
    return <div className="my-4"><RawEmbed embedJs={el["embed-js"]} /></div>;
  }

  // ---- data table ------------------------------------------------------
  if (type === "data" && subtype === "table") {
    // `el.data` is either an array of rows (older format) or a CSV blob
    // `{ content, content-type: "csv" }`. Normalise both to rows.
    const rows = tableRows(el.data);
    if (rows.length === 0) return null;
    const hasHeader = el.metadata?.["has-header"] === true;
    const bodyRows = hasHeader ? rows.slice(1) : rows;
    return (
      <div className="my-4 overflow-x-auto">
        <table className="w-full border-collapse text-14-inter-400 text-333333">
          {hasHeader && (
            <thead>
              <tr>
                {rows[0].map((cell, c) => (
                  <th
                    key={c}
                    className="border border-DFDFDF bg-F9F9F9 px-3 py-2 text-left text-14-balootamma2-600 text-1E1E1E"
                  >
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {bodyRows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td key={c} className="border border-DFDFDF px-3 py-2">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // ---- files -----------------------------------------------------------
  if (type === "file" && (el.url || el["s3-key"])) {
    const href = el.url || toMediaUrl(el["s3-key"]);
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="my-3 flex items-center gap-2 rounded border border-DFDFDF p-3 text-14-inter-500 text-183354 hover:border-009EF9"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm0 2 4 4h-4V4Z"/></svg>
        {el["file-name"] || "Download attachment"}
      </a>
    );
  }

  return null;
}

function QA({
  badge,
  tone,
  html,
}: {
  badge: string;
  tone: "q" | "a";
  html?: string;
}) {
  const box = tone === "q" ? "bg-F2F7FF" : "bg-FFF6DE";
  const chip = tone === "q" ? "bg-009EF9" : "bg-FACC15";
  return (
    <div className={`rounded-lg ${box} p-4`}>
      <div className="flex items-start gap-3">
        <span
          className={`grid h-7 w-7 flex-shrink-0 place-items-center rounded ${chip} text-14-inter-700 text-white`}
        >
          {badge}
        </span>
        <div
          className="flex-1 article-links text-18-inter-500 text-333333 [&_p]:mb-0"
          dangerouslySetInnerHTML={{ __html: prepareArticleHtml(html) }}
        />
      </div>
    </div>
  );
}

export default function ArticleBody({
  story,
  heroImageUrl,
  inArticleAds,
}: {
  story: Story;
  heroImageUrl?: string;
  /** Builder-configured in-article ad slots (from the body marker's props). */
  inArticleAds?: InArticleAdSlot[];
}) {
  const cards = story?.cards ?? [];

  // Photo galleries are images with short captions, so their in-article ads
  // anchor to IMAGES (after the Nth image) instead of paragraphs. Every other
  // template stays paragraph-anchored (dinamani parity; positions from builder).
  const template = story?.["story-template"];
  const imageAnchored = template === "photo" || template === "photo-gallery";

  // Video templates play the lead video in the HERO, so skip that same element
  // in the body (no duplicate video).
  const heroVideoMode = template === "video" || template === "gumlet-video";
  const heroVideoKey = heroVideoMode
    ? resolveStoryVideo(story).elementKey
    : undefined;

  const paraMap = computeParagraphMap(story);
  const imageMap = imageAnchored ? computeImageMap(story) : {};
  const hasAnchors = imageAnchored
    ? Object.keys(imageMap).length > 0
    : Object.keys(paraMap).length > 0;
  const plan = buildParagraphAdPlan(inArticleAds, hasAnchors);
  const renderInlineAd: RenderInlineAd = (globalIdx) => {
    const slot = getAdSlotForParagraph(plan, globalIdx);
    return slot ? <InArticleAd slot={slot} adIndex={globalIdx} /> : null;
  };

  return (
    <div className="space-y-4">
      {/* Review stories lead with their rating (out of 5). */}
      {template === "review" && <ReviewRating story={story} />}
      {/* afterParagraph:0 → key -1 → an ad at the very top of the body (also the
          "before the first image" slot for photo galleries). */}
      {renderInlineAd(-1)}
      {cards.map((card: any, ci: number) => (
        <div key={card.id || ci} className="space-y-4">
          {(card["story-elements"] ?? []).map((el: any, ei: number) =>
            // The hero shows this video → don't render it again in the body.
            `${ci}_${ei}` === heroVideoKey ? null : (
              <Element
                key={el.id || `${ci}-${ei}`}
                el={el}
                story={story}
                heroImageUrl={heroImageUrl}
                paraInfo={paraMap[`${ci}_${ei}`]}
                imageAdIdx={imageAnchored ? imageMap[`${ci}_${ei}`] : undefined}
                imageAnchored={imageAnchored}
                renderInlineAd={renderInlineAd}
              />
            ),
          )}
        </div>
      ))}
    </div>
  );
}
