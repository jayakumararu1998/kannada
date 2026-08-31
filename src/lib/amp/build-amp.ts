/**
 * Builder-template-driven AMP document generator for article pages — the AMP
 * counterpart of ArticleTemplateRenderer. Given a Quintype story and (optional)
 * synced article template, it emits a valid AMP HTML string: boilerplate +
 * `<style amp-custom>` + `<amp-img>`/`amp-youtube`/`amp-twitter`/`amp-instagram`/
 * `amp-carousel`/`amp-social-share`/`amp-ad`, with hero fields, breadcrumb,
 * author, date, in-article ad positions and body story-elements all resolved
 * from the story + template — mirroring dinamani's /amp/story route (leaner:
 * no Vuukle/Taboola/mega-menu).
 */

import type { Story } from "@/lib/api/stories";
import { formatArticleDate } from "@/lib/api/stories";
import type { ArticleTemplateConfig } from "@/lib/builder/types";
import type { Column, PageComponent, Row, Section } from "@/lib/builder/types";
import {
  DEFAULT_HERO_FIELDS,
  canonicalHeroFieldId,
  findSlot,
  resolveAuthorCard,
  resolveSlotTimestamp,
  resolveSlotValue,
  type HeroField,
  type ResolvedAuthorCard,
} from "@/lib/article/hero-fields";
import {
  buildParagraphAdPlan,
  computeParagraphMap,
  getAdSlotForParagraph,
  type InArticleAdSlot,
} from "@/lib/article/inline-ads";
import { toMediaUrl } from "@/lib/images";
import { resolveStoryVideo } from "@/lib/article/story-video";
import { tableRows } from "@/lib/article/table";
import { getAdPlacements, type AdPlacement } from "@/lib/builder/ad-codes";
import {
  applyVuukleVars,
  extractVuukleConfig,
  resolveVuukleVars,
  vuukleWidgetId,
  type VuukleArticleContext,
} from "@/lib/builder/vuukle";
import { extractTaboolaConfig } from "@/lib/builder/taboola";
import { generateArticleSchemaFromStory } from "@/lib/seo/schema";
import { SITE_URL } from "@/lib/constants";

// ── AMP component scripts, added only when their component is used ───────────
type AmpScripts = Set<string>;
const SCRIPT_SRC: Record<string, string> = {
  youtube: "https://cdn.ampproject.org/v0/amp-youtube-0.1.js",
  twitter: "https://cdn.ampproject.org/v0/amp-twitter-0.1.js",
  instagram: "https://cdn.ampproject.org/v0/amp-instagram-0.1.js",
  carousel: "https://cdn.ampproject.org/v0/amp-carousel-0.2.js",
  social: "https://cdn.ampproject.org/v0/amp-social-share-0.1.js",
  ad: "https://cdn.ampproject.org/v0/amp-ad-0.1.js",
  // `<amp-embed>` (Taboola) is served by the amp-ad extension — there is NO
  // amp-embed-0.1.js. Declaring it as amp-ad keeps the validator happy.
  embed: "https://cdn.ampproject.org/v0/amp-ad-0.1.js",
  iframe: "https://cdn.ampproject.org/v0/amp-iframe-0.1.js",
  sidebar: "https://cdn.ampproject.org/v0/amp-sidebar-0.1.js",
  "sticky-ad": "https://cdn.ampproject.org/v0/amp-sticky-ad-1.0.js",
};

/** custom-element name for a script key (social → social-share, embed → ad). */
function customElement(key: string): string {
  if (key === "social") return "amp-social-share";
  if (key === "embed") return "amp-ad"; // amp-embed ships with the amp-ad extension
  return `amp-${key}`;
}

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stripTags(html?: string): string {
  return (html ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sectionPath(raw?: string): string {
  return (
    "/" +
    String(raw ?? "")
      .replace(/^https?:\/\/[^/]+/, "")
      .replace(/^\/+/, "")
  );
}

function ampImg(
  src: string | undefined,
  width: number,
  height: number,
  alt = "",
  layout = "responsive",
  cls = "",
): string {
  const url = toMediaUrl(src);
  if (!url) return "";
  return `<amp-img src="${esc(url)}" width="${width}" height="${height}" layout="${layout}" alt="${esc(alt)}"${cls ? ` class="${cls}"` : ""}></amp-img>`;
}

/** Make an arbitrary rich-text HTML fragment AMP-valid. */
function cleanHtmlForAmp(html: string): string {
  if (!html) return "";
  return html
    .replace(/<img([^>]*)>/gi, (m) => {
      const src = m.match(/src="([^"]*)"/i)?.[1] ?? "";
      const alt = m.match(/alt="([^"]*)"/i)?.[1] ?? "";
      return ampImg(src, 640, 360, alt);
    })
    .replace(
      /<a\s+(?![^>]*target=)([^>]*)>/gi,
      '<a $1 target="_blank" rel="noopener">',
    )
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/\s+on\w+="[^"]*"/gi, "")
    .replace(/\s+style="[^"]*"/gi, "");
}

function youTubeId(url?: string): string | null {
  if (!url) return null;
  return (
    url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
    )?.[1] ?? null
  );
}

// ── Story-element → AMP ──────────────────────────────────────────────────────
function renderElement(el: any, story: Story, scripts: AmpScripts): string {
  const type = el?.type;
  const subtype = el?.subtype;

  if (type === "text") {
    if (!el.text && subtype !== "q-and-a" && subtype !== "bigfact") return "";
    if (subtype === "summary") {
      // Same ribbon-tab card design as the also-read block.
      return `<div class="amp-summary-wrap"><span class="amp-ribbon-tab">Summary</span><div class="amp-summary">${cleanHtmlForAmp(el.text)}</div></div>`;
    }
    if (subtype === "also-read") {
      const id = el.metadata?.["linked-story-id"] || el["linked-story-id"];
      const linked =
        (id && story["linked-stories"]?.[id]) || el.metadata?.["linked-story"];
      if (!linked?.slug) return "";
      return linkedCard(linked);
    }
    if (subtype === "quote" || subtype === "blockquote") {
      return `<blockquote class="amp-quote">${cleanHtmlForAmp(el.text)}</blockquote>`;
    }
    if (subtype === "blurb") {
      return `<div class="amp-blurb">${cleanHtmlForAmp(el.text)}</div>`;
    }
    if (subtype === "bigfact") {
      const c = el.metadata?.content || el.text;
      return c
        ? `<div class="amp-bigfact">${esc(stripTags(c))}${el.metadata?.attribution ? `<span>${esc(el.metadata.attribution)}</span>` : ""}</div>`
        : "";
    }
    if (subtype === "q-and-a") {
      const q = el.metadata?.question;
      const a = el.metadata?.answer;
      return `${q ? `<div class="amp-qa amp-q"><b>Q</b><div>${cleanHtmlForAmp(q)}</div></div>` : ""}${a ? `<div class="amp-qa amp-a"><b>A</b><div>${cleanHtmlForAmp(a)}</div></div>` : ""}`;
    }
    if (subtype === "question") {
      return `<div class="amp-qa amp-q"><b>Q</b><div>${cleanHtmlForAmp(el.text)}</div></div>`;
    }
    if (subtype === "answer") {
      return `<div class="amp-qa amp-a"><b>A</b><div>${cleanHtmlForAmp(el.text)}</div></div>`;
    }
    if (subtype === "cta" && el.metadata?.["cta-url"]) {
      return `<div class="amp-cta"><a href="${esc(el.metadata["cta-url"])}" target="_blank" rel="noopener">${esc(el.metadata["cta-title"] || stripTags(el.text) || "Read more")}</a></div>`;
    }
    if (el.metadata?.["promotional-message"]) {
      return `<div class="amp-promo">${cleanHtmlForAmp(el.text)}</div>`;
    }
    return `<div class="amp-text">${cleanHtmlForAmp(el.text)}</div>`;
  }

  if (type === "title" && el.text) {
    return `<h2 class="amp-subhead">${esc(stripTags(el.text))}</h2>`;
  }

  if (type === "image" && el["image-s3-key"]) {
    const cap =
      el.title || el["image-attribution"]
        ? `<figcaption>${esc(stripTags(el.title))}${el.title && el["image-attribution"] ? " — " : ""}${esc(el["image-attribution"])}</figcaption>`
        : "";
    return `<figure class="amp-figure">${ampImg(el["image-s3-key"], 800, 450, el.title || el["alt-text"] || "")}${cap}</figure>`;
  }

  if (type === "youtube-video" && el["embed-url"]) {
    const id = youTubeId(el["embed-url"]);
    if (!id) return "";
    scripts.add("youtube");
    return `<amp-youtube data-videoid="${esc(id)}" layout="responsive" width="480" height="270"></amp-youtube>`;
  }

  if (type === "jsembed" && subtype === "tweet") {
    // The tweet id lives in metadata; `embed-js` is often base64-encoded, so the
    // `status/<id>` regex on it fails. Prefer metadata (`tweet-id`/`tweet-url`),
    // then fall back to the raw embed-js.
    const tid =
      el.metadata?.["tweet-id"] ||
      String(el.metadata?.["tweet-url"] || "").match(/status\/(\d+)/)?.[1] ||
      String(el["embed-js"] || "").match(/status\/(\d+)/)?.[1];
    if (tid) {
      scripts.add("twitter");
      return `<amp-twitter data-tweetid="${esc(String(tid))}" layout="responsive" width="375" height="472"></amp-twitter>`;
    }
    return "";
  }
  if (type === "jsembed" && subtype === "instagram") {
    const sc = String(el["embed-js"] || "").match(
      /instagram\.com\/(?:p|reel)\/([\w-]+)/,
    )?.[1];
    if (sc) {
      scripts.add("instagram");
      return `<amp-instagram data-shortcode="${esc(sc)}" layout="responsive" width="400" height="400"></amp-instagram>`;
    }
    return "";
  }

  if (type === "composite" && subtype === "image-gallery") {
    const imgs = (el["story-elements"] ?? []).filter(
      (i: any) => i["image-s3-key"],
    );
    if (imgs.length === 0) return "";
    scripts.add("carousel");
    const slides = imgs
      .map((i: any) => ampImg(i["image-s3-key"], 800, 450, i.title || ""))
      .join("");
    return `<amp-carousel class="amp-gallery" layout="responsive" width="800" height="450" type="slides">${slides}</amp-carousel>`;
  }
  if (type === "composite" && subtype === "references") {
    const refs = el["story-elements"] ?? [];
    if (refs.length === 0) return "";
    const items = refs
      .map(
        (r: any) =>
          `<li>${r.metadata?.url ? `<a href="${esc(r.metadata.url)}" target="_blank" rel="noopener">${esc(r.metadata?.name || "Reference")}</a>` : esc(r.metadata?.name)}</li>`,
      )
      .join("");
    return `<div class="amp-refs"><h4>ಆಕರಗಳು</h4><ul>${items}</ul></div>`;
  }

  if (type === "data" && subtype === "table") {
    const grid = tableRows(el.data); // array-of-rows OR a { content } CSV blob
    if (grid.length === 0) return "";
    const hasHeader = el.metadata?.["has-header"] === true;
    const head = hasHeader
      ? `<thead><tr>${grid[0].map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead>`
      : "";
    const body = (hasHeader ? grid.slice(1) : grid)
      .map((row) => `<tr>${row.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`)
      .join("");
    return `<div class="amp-table-wrap"><table>${head}<tbody>${body}</tbody></table></div>`;
  }

  // File attachment → download link.
  if (type === "file" && (el.url || el["s3-key"])) {
    const href = el.url || toMediaUrl(el["s3-key"]);
    return `<a class="amp-file" href="${esc(href)}" target="_blank" rel="noopener">${esc(el["file-name"] || "Download attachment")}</a>`;
  }

  return "";
}

function linkedCard(linked: any): string {
  const img = linked["hero-image-s3-key"]
    ? ampImg(
        linked["hero-image-s3-key"],
        150,
        100,
        linked.headline || "",
        "fixed",
      )
    : "";
  return `<div class="amp-linked-wrap"><span class="amp-ribbon-tab">Also Read</span><a class="amp-linked" href="/${esc(linked.slug)}">${img}<h4>${esc(linked.headline)}</h4></a></div>`;
}

// ── Body with paragraph-anchored ads ─────────────────────────────────────────
/** Review rating (out of 5) → AMP markup (unicode stars). Empty when no rating. */
function renderReviewRatingAmp(story: Story): string {
  const meta = (story?.metadata ?? {}) as Record<string, any>;
  const rating = meta["review-rating"];
  const value = Number(rating?.value ?? rating?.label);
  if (!Number.isFinite(value) || value <= 0) return "";
  const MAX = 5;
  const filled = Math.max(0, Math.min(MAX, Math.round(value)));
  const title = esc(String(meta["review-title"] || "Rating"));
  const stars = "★".repeat(filled) + "☆".repeat(MAX - filled);
  return `<div class="amp-review-rating"><span class="r-title">${title}</span><span class="r-stars">${stars}</span><span class="r-value">${esc(String(value))}/${MAX}</span></div>`;
}

/** Live-blog card timestamp (event → added → updated), like the HTML timeline. */
function liveCardTime(card: any): number | undefined {
  return (
    card?.["card-event-at"] || card?.["card-added-at"] || card?.["card-updated-at"]
  );
}

/**
 * AMP live-blog timeline — mirrors the HTML `ArticleLiveBlog`: a LIVE/CLOSED
 * badge + update count, then each card as a dotted timeline entry with its own
 * timestamp and elements (tweets, images, text). Newest-first while live,
 * chronological once closed.
 */
function renderLiveBlog(story: Story, scripts: AmpScripts): string {
  const isClosed =
    !!(story?.metadata as any)?.["is-closed"] ||
    story?.["is-live-blog"] === false;
  const cards = [...(story?.cards ?? [])].sort((a: any, b: any) => {
    const asc = (liveCardTime(a) ?? 0) - (liveCardTime(b) ?? 0);
    return isClosed ? asc : -asc;
  });
  const badge = isClosed
    ? `<span class="amp-live-badge amp-live-closed">ಮುಕ್ತಾಯ</span>`
    : `<span class="amp-live-badge amp-live-on">LIVE</span>`;
  const head = `<div class="amp-live-head">${badge}<span class="amp-live-count">${cards.length} ನವೀಕರಣಗಳು</span></div>`;
  const entries = cards
    .map((card: any) => {
      const ts = liveCardTime(card);
      const time = ts
        ? `<time class="amp-live-time">${esc(formatArticleDate(ts))}</time>`
        : "";
      const els = (card["story-elements"] ?? [])
        .map((el: any) => renderElement(el, story, scripts))
        .join("");
      return `<article class="amp-live-item">${time}<div class="amp-live-body">${els}</div></article>`;
    })
    .join("");
  return `<div class="amp-liveblog">${head}<div class="amp-live-timeline">${entries}</div></div>`;
}

function renderBody(
  story: Story,
  inArticleAds: InArticleAdSlot[] | undefined,
  scripts: AmpScripts,
): string {
  // Live blogs render as a timeline of dated card updates, not a flat body.
  if (
    story?.["is-live-blog"] === true ||
    story?.["story-template"] === "live-blog"
  ) {
    return renderLiveBlog(story, scripts);
  }
  const paraMap = computeParagraphMap(story);
  const hasParagraphs = Object.keys(paraMap).length > 0;
  const plan = buildParagraphAdPlan(inArticleAds, hasParagraphs);
  const renderInlineAd = (idx: number): string => {
    const slot = getAdSlotForParagraph(plan, idx);
    return slot ? renderAmpAd(slot, scripts) : "";
  };

  // Video templates play the lead video in the hero → skip that body element.
  const template = story?.["story-template"];
  const heroVideoKey =
    template === "video" || template === "gumlet-video"
      ? resolveStoryVideo(story).elementKey
      : undefined;

  // Review stories lead with their rating (out of 5).
  let out = template === "review" ? renderReviewRatingAmp(story) : "";
  out += renderInlineAd(-1);
  const cards = story?.cards ?? [];
  for (let ci = 0; ci < cards.length; ci++) {
    const els = cards[ci]?.["story-elements"] ?? [];
    for (let ei = 0; ei < els.length; ei++) {
      if (`${ci}_${ei}` === heroVideoKey) continue;
      const el = els[ei];
      const info = paraMap[`${ci}_${ei}`];
      if (
        el?.type === "text" &&
        el.text &&
        info &&
        info.paragraphs.length > 0
      ) {
        // Regular body text → split, interleave ads at configured positions.
        info.paragraphs.forEach((para: string, i: number) => {
          out += `<div class="amp-text">${cleanHtmlForAmp(para)}</div>`;
          out += renderInlineAd(info.startIndex + i);
        });
      } else {
        out += renderElement(el, story, scripts);
      }
    }
  }
  return out;
}

/** In-article ad → AMP. image → amp-img; ad w/ a GPT slot path → amp-ad
 *  doubleclick; plain html (no <script>) → inline; script-bearing html/ad is
 *  dropped (AMP forbids arbitrary JS). */
function renderAmpAd(slot: InArticleAdSlot, scripts: AmpScripts): string {
  const type = slot.contentType || "ad";
  if (type === "image") {
    const src = slot.desktopImage || slot.mobileImage || slot.imageLinkUrl;
    if (!src) return "";
    const link =
      slot.desktopImage || slot.mobileImage ? slot.imageLinkUrl : undefined;
    const img = ampImg(src, 336, 280, "", "responsive");
    return `<div class="amp-ad-box">${link ? `<a href="${esc(link)}" target="_blank" rel="noopener">${img}</a>` : img}</div>`;
  }
  if (type === "html") {
    const html = slot.desktopHtml || slot.mobileHtml || slot.html || "";
    if (!html || /<script/i.test(html)) return "";
    return `<div class="amp-ad-box">${cleanHtmlForAmp(html)}</div>`;
  }
  // 'ad' — extract a GPT slot path from the raw code → amp-ad doubleclick.
  const code = slot.desktopCode || slot.mobileCode || "";
  const slotPath = code.match(/defineSlot\(\s*['"]([^'"]+)['"]/)?.[1];
  if (!slotPath) return "";
  scripts.add("ad");
  const size = slot.adSize?.match(/^(\d+)\s*x\s*(\d+)$/i);
  const w = size ? size[1] : "300";
  const h = size ? size[2] : "250";
  return `<div class="amp-ad-box"><amp-ad width="${w}" height="${h}" type="doubleclick" data-slot="${esc(slotPath)}"></amp-ad></div>`;
}

// ── Hero (heroFields → AMP) ──────────────────────────────────────────────────
function renderHero(
  heroFields: HeroField[],
  story: Story,
  ampUrl: string,
  scripts: AmpScripts,
): string {
  const fields = heroFields
    .filter((f) => !f.hidden)
    .sort((a, b) => a.order - b.order);
  return fields.map((f) => renderHeroField(f, story, ampUrl, scripts)).join("");
}

function renderHeroField(
  field: HeroField,
  story: Story,
  ampUrl: string,
  scripts: AmpScripts,
): string {
  switch (canonicalHeroFieldId(field)) {
    case "breadcrumb":
      return renderBreadcrumb(story);
    case "categoryBadge": {
      const label =
        resolveSlotValue(
          story,
          findSlot(field, "sectionLabel") ?? { key: "" },
        ) || story?.sections?.[0]?.name;
      if (!label) return "";
      const url = story?.sections?.[0]?.["section-url"];
      return `<a class="amp-category" href="${esc(sectionPath(url))}">${esc(label)}</a>`;
    }
    case "title": {
      const t =
        resolveSlotValue(story, findSlot(field, "title") ?? { key: "" }) ||
        story?.headline;
      return t ? `<h1 class="amp-headline">${esc(t)}</h1>` : "";
    }
    case "description": {
      const d =
        resolveSlotValue(
          story,
          findSlot(field, "description") ?? { key: "" },
        ) ||
        story?.subheadline ||
        story?.summary;
      return d ? `<p class="amp-subhead-text">${esc(stripTags(d))}</p>` : "";
    }
    case "heroImage":
      return renderHeroMedia(field, story, scripts);
    case "authorBlock":
      return renderAuthorAmp(field, story);
    case "dateMeta":
      return renderDateAmp(field, story);
    case "socialShare":
      return renderSocialShare(ampUrl, story, scripts);
    default:
      return "";
  }
}

function renderHeroMedia(
  field: HeroField,
  story: Story,
  scripts: AmpScripts,
): string {
  const template = story["story-template"];
  const mode =
    field.mediaMode ??
    (template === "video" || template === "gumlet-video" ? "video" : undefined);

  if (mode === "video" || mode === "gumletVideo") {
    // Story-level embed OR the first youtube-video body element → play in hero.
    const video = resolveStoryVideo(story);
    const id = video.embedUrl ? youTubeId(video.embedUrl) : "";
    if (id) {
      scripts.add("youtube");
      return `<amp-youtube data-videoid="${esc(id)}" layout="responsive" width="480" height="270" class="amp-hero"></amp-youtube>`;
    }
  }
  if (mode === "photoGallery" || template === "photo") {
    // Single static image in the hero (no carousel/arrows): hero image, else the
    // first gallery image.
    const first =
      story["hero-image-s3-key"] ||
      (story.cards ?? [])
        .flatMap((c: any) => c["story-elements"] ?? [])
        .find((e: any) => e["image-s3-key"])?.["image-s3-key"];
    if (first) {
      return `<figure class="amp-figure amp-hero">${ampImg(first, 800, 450, story.headline || "")}</figure>`;
    }
  }
  if (!story["hero-image-s3-key"]) return "";
  const cap =
    story["hero-image-caption"] || story["hero-image-attribution"]
      ? `<figcaption>${esc(stripTags(story["hero-image-caption"]))}${story["hero-image-caption"] && story["hero-image-attribution"] ? " — " : ""}${esc(story["hero-image-attribution"])}</figcaption>`
      : "";
  return `<figure class="amp-figure amp-hero">${ampImg(story["hero-image-s3-key"], 800, 450, story.headline || "")}${cap}</figure>`;
}

function renderBreadcrumb(story: Story): string {
  const s = story?.sections?.[0];
  const crumb = s?.name
    ? ` <span>›</span> <a href="${esc(sectionPath(s["section-url"] ?? s.slug))}">${esc(s.name)}</a>`
    : "";
  return `<nav class="amp-breadcrumb"><a href="/">ಮುಖಪುಟ</a>${crumb}</nav>`;
}

/** AMP author block — rich card config (dinamani parity) with a story-authors
 *  fallback. Avatar/name/prefix per card, primary + optional guest. */
function renderAuthorAmp(field: HeroField, story: Story): string {
  if (field.author) {
    const cards = [
      resolveAuthorCard(field.author, story),
      field.guestAuthorEnabled
        ? resolveAuthorCard(field.guestAuthor, story)
        : null,
    ].filter(Boolean) as ResolvedAuthorCard[];
    if (cards.length === 0) return "";
    const html = cards
      .map((c) => {
        const prefix = c.prefixLabel
          ? `<span class="amp-author-prefix">${esc(c.prefixLabel)}</span>`
          : "";
        const avatar =
          c.showProfile && c.profileImage
            ? `<amp-img src="${esc(c.profileImage)}" width="32" height="32" layout="fixed" class="amp-avatar" alt="${esc(c.label)}"></amp-img>`
            : "";
        const name = c.showName
          ? c.url
            ? `<a href="${esc(c.url)}" class="amp-author">${esc(c.label)}</a>`
            : `<span class="amp-author">${esc(c.label)}</span>`
          : "";
        return `<span class="amp-author-card">${prefix}${avatar}${name}</span>`;
      })
      .join("");
    return `<div class="amp-byline">${html}</div>`;
  }
  // Fallback: names from story.authors.
  const authors = (story?.authors ?? []).filter((a: any) => a?.name);
  if (authors.length === 0) return "";
  const names = authors
    .map((a: any) =>
      a.slug
        ? `<a href="/author/${esc(a.slug)}">${esc(a.name)}</a>`
        : esc(a.name),
    )
    .join(", ");
  const avatar = authors[0]?.["avatar-s3-key"]
    ? ampImg(
        authors[0]["avatar-s3-key"],
        32,
        32,
        authors[0].name,
        "fixed",
        "amp-avatar",
      )
    : "";
  return `<div class="amp-byline">${avatar}<span class="amp-author">${names}</span></div>`;
}

/**
 * AMP date meta (the dateMeta hero field) — mirrors the HTML `DateMetaField`:
 * reads the configured created/updated slots, honours each slot's hide/show
 * toggle, and shows the builder-configured labels ("Published :" / "Updated :")
 * instead of a hardcoded string.
 */
function renderDateAmp(field: HeroField, story: Story): string {
  const createdSlot = findSlot(field, "createdAt");
  const updatedSlot = findSlot(field, "updatedAt");
  const createdLabelSlot = findSlot(field, "createdLabel");
  const updatedLabelSlot = findSlot(field, "updatedLabel");

  const createdTs =
    resolveSlotTimestamp(story, createdSlot) ?? story["published-at"];
  const updatedTs =
    resolveSlotTimestamp(story, updatedSlot) ??
    story["updated-at"] ??
    story["last-published-at"];

  const rows = [
    !createdSlot?.hidden &&
      createdTs && {
        showLabel: !createdLabelSlot?.hidden,
        label:
          resolveSlotValue(story, createdLabelSlot ?? { key: "" }) ||
          "Published",
        value: formatArticleDate(createdTs),
      },
    !updatedSlot?.hidden &&
      updatedTs && {
        showLabel: !updatedLabelSlot?.hidden,
        label:
          resolveSlotValue(story, updatedLabelSlot ?? { key: "" }) || "Updated",
        value: formatArticleDate(updatedTs),
      },
  ].filter(Boolean) as Array<{
    showLabel: boolean;
    label: string;
    value: string;
  }>;
  if (rows.length === 0) return "";

  const inner = rows
    .map(
      (r) =>
        `<span class="amp-date">${r.showLabel ? `${esc(r.label)} : ` : ""}${esc(r.value)}</span>`,
    )
    .join("");
  return `<div class="amp-byline amp-datemeta">${inner}</div>`;
}

function renderByline(story: Story): string {
  const authors = (story?.authors ?? []).filter((a: any) => a?.name);
  const names = authors
    .map((a: any) =>
      a.slug
        ? `<a href="/author/${esc(a.slug)}">${esc(a.name)}</a>`
        : esc(a.name),
    )
    .join(", ");
  const ts =
    story["updated-at"] || story["last-published-at"] || story["published-at"];
  const when = ts ? `Updated On ${formatArticleDate(ts)}` : "";
  const avatar = authors[0]?.["avatar-s3-key"]
    ? ampImg(
        authors[0]["avatar-s3-key"],
        32,
        32,
        authors[0].name,
        "fixed",
        "amp-avatar",
      )
    : "";
  if (!names && !when) return "";
  return `<div class="amp-byline">${avatar}<div>${names ? `<span class="amp-author">${names}</span>` : ""}${when ? `<span class="amp-date">${esc(when)}</span>` : ""}</div></div>`;
}

function renderSocialShare(
  ampUrl: string,
  story: Story,
  scripts: AmpScripts,
): string {
  scripts.add("social");
  // Matches the HTML hero share row (WhatsApp / X / Facebook / Telegram) plus
  // LinkedIn, Email and the native "share" (AMP `system`, shown only where the
  // Web Share API is available — the AMP equivalent of the hero's share button).
  // `telegram` isn't a built-in AMP provider, so it needs an explicit endpoint.
  const buttons = [
    { type: "whatsapp" },
    { type: "twitter" },
    { type: "facebook" },
    {
      type: "telegram",
      endpoint: `https://t.me/share/url?url=${encodeURIComponent(ampUrl)}&text=${encodeURIComponent(story.headline || "")}`,
    },
    { type: "linkedin" },
    { type: "email" },
    { type: "system" },
  ];
  return `<div class="amp-share" data-title="${esc(story.headline)}" data-url="${esc(ampUrl)}">${buttons
    .map(
      (b) =>
        `<amp-social-share type="${b.type}" width="36" height="36"${b.endpoint ? ` data-share-endpoint="${esc(b.endpoint)}"` : ""}></amp-social-share>`,
    )
    .join("")}</div>`;
}

/**
 * The builder-authored comments disclaimer from a template's (first) comments
 * component, or undefined. Used by the AMP route to fall back to the HTML
 * template's disclaimer when the AMP-variant component doesn't set its own.
 */
export function findCommentsDisclaimer(
  template: ArticleTemplateConfig | null,
): string | undefined {
  for (const c of flattenComponents(template)) {
    const type = (c.component_type || "").replace(/^Amp/, "");
    if (type === "ArticleComments" || type === "ArticleCommentsSection") {
      const d = (c.props as Record<string, unknown> | undefined)?.disclaimer;
      if (typeof d === "string" && d.trim()) return d;
    }
  }
  return undefined;
}

// ── Template walk (which markers appear, in order) ───────────────────────────
function flattenComponents(
  template: ArticleTemplateConfig | null,
): PageComponent[] {
  const sections: Section[] =
    (template?.pageJson?.sections as Section[]) ?? template?.sections ?? [];
  const out: PageComponent[] = [];
  const walkCol = (col: Column) => {
    if (col.children_order?.length) {
      for (const child of col.children_order) {
        if (child.type === "component") {
          const c = col.components?.find((x) => x.id === child.id);
          if (c) out.push(c);
        } else if (child.type === "nested-column") {
          const nc = col.columns?.find((x) => x.id === child.id);
          if (nc) walkCol(nc);
        } else if (child.type === "nested-row") {
          const nr = col.rows?.find((x) => x.id === child.id);
          if (nr) walkRow(nr);
        }
      }
    } else {
      col.components?.forEach((c) => out.push(c));
      col.columns?.forEach(walkCol);
      col.rows?.forEach(walkRow);
    }
  };
  const walkRow = (row: Row) => row.columns?.forEach(walkCol);
  sections.forEach((s) => s.rows?.forEach(walkRow));
  return out;
}

const BODY_MARKERS = new Set([
  "ArticleTextTemplate",
  "ArticleListicleTemplate",
  "ArticleVideoTemplate",
  "ArticleQuestionAnswerTemplate",
  "ArticleGumletVideoTemplate",
  "ArticleReviewTemplate",
  "ArticleSyndicatedTemplate",
  "ArticlePhotoTemplate",
  "ArticleInterviewTemplate",
  "ArticlePhotoVisualTemplate",
  "ArticleLiveBlogTemplate",
]);

// ── AMP header: hamburger sidebar + mega menu (dinamani parity) ──────────────
export interface AmpNavItem {
  title: string;
  url: string;
  children?: AmpNavItem[];
}

const SIDEBAR_ID = "amp-sidebar";
const MEGA_ID = "amp-mega-menu";
const BACKDROP_ID = "amp-nav-backdrop";
const SIDEBAR_CLOSE = `${SIDEBAR_ID}.close`;

// Site wordmark image (source 358×120 ≈ 2.98:1) — the AMP header logo.
const AMP_LOGO_URL =
  "https://media.kannadaprabha.com/kannadaprabha/2025-07-25/sco3feff/kplogo.png";
const AMP_LOGO_W = 119;
const AMP_LOGO_H = 40;
const ampLogoImg = (cls = "amp-logo-img") =>
  `<amp-img src="${esc(AMP_LOGO_URL)}" width="${AMP_LOGO_W}" height="${AMP_LOGO_H}" layout="fixed" alt="ಕನ್ನಡಪ್ರಭ" class="${cls}"></amp-img>`;

function menuId(prefix: string, item: AmpNavItem, i: number): string {
  return `amp-menu-${prefix}-${(item.url || item.title || i)
    .toString()
    .replace(/[^\w-]/g, "")
    .slice(0, 24)}-${i}`;
}

/** Toggle target + hide every sibling panel + toggle the shared backdrop. */
function panelToggle(target: string, all: string[], backdrop: string): string {
  const hideOthers = all
    .filter((id) => id !== target)
    .map((id) => `${id}.hide`)
    .join(",");
  return `${hideOthers ? hideOthers + "," : ""}${target}.toggleVisibility,${backdrop}.toggleVisibility`;
}

/** One top-nav-row item: leaf → link; parent → inline trigger + dropdown panel. */
function navRowItem(
  item: AmpNavItem,
  index: number,
  allPanelIds: string[],
  closeAction: string,
): { trigger: string; panel: string } {
  const href = item.url || "#";
  if (!item.children || item.children.length === 0) {
    return {
      trigger: `<a href="${esc(href)}" class="amp-nav-item">${esc(item.title)}</a>`,
      panel: "",
    };
  }
  const id = menuId("nav", item, index);
  const toggle = panelToggle(id, allPanelIds, BACKDROP_ID);
  const children = item.children
    .map(
      (c) =>
        `<a href="${esc(c.url || "#")}" class="amp-nav-dropdown-child" on="tap:${closeAction}">${esc(c.title)}</a>`,
    )
    .join("");
  return {
    trigger: `<div role="button" tabindex="0" class="amp-nav-item amp-nav-trigger" on="tap:${toggle}"><span>${esc(item.title)}</span><span class="amp-nav-caret">▾</span></div>`,
    panel: `<div id="${id}" class="amp-nav-panel" hidden><a href="${esc(href)}" class="amp-nav-dropdown-link" on="tap:${closeAction}">${esc(item.title)}</a>${children}</div>`,
  };
}

function moreTrigger(allPanelIds: string[]): string {
  const toggle = panelToggle(MEGA_ID, allPanelIds, BACKDROP_ID);
  return `<div role="button" tabindex="0" class="amp-nav-item amp-nav-more" aria-label="More menu" on="tap:${toggle}"><span class="amp-nav-dots">⋮</span></div>`;
}

/** Card-style mega-menu item (used by both the ⋮ overlay and the sidebar). */
function megaItem(
  prefix: string,
  item: AmpNavItem,
  index: number,
  menuIds: string[],
  closeAction: string,
): string {
  const href = item.url || "#";
  if (!item.children || item.children.length === 0) {
    return `<div class="amp-mega-item"><div class="amp-mega-row"><a href="${esc(href)}" class="amp-mega-link" on="tap:${closeAction}">${esc(item.title)}</a></div></div>`;
  }
  const id = menuId(prefix, item, index);
  const children = item.children
    .map(
      (c) =>
        `<a href="${esc(c.url || "#")}" class="amp-mega-child" on="tap:${closeAction}">${esc(c.title)}</a>`,
    )
    .join("");
  const closeSiblings = menuIds
    .filter((x) => x !== id)
    .map((x) => `${x}.hide`)
    .join(",");
  const toggle = closeSiblings
    ? `${closeSiblings},${id}.toggleVisibility`
    : `${id}.toggleVisibility`;
  return `<div class="amp-mega-item"><div class="amp-mega-row"><a href="${esc(href)}" class="amp-mega-link" on="tap:${closeAction}">${esc(item.title)}</a><div role="button" tabindex="0" class="amp-mega-trigger" aria-label="Expand submenu" on="tap:${toggle}">▾</div></div><div id="${id}" class="amp-mega-children" hidden>${children}</div></div>`;
}

function megaList(
  prefix: string,
  items: AmpNavItem[],
  closeAction: string,
): string {
  const menuIds = items
    .map((it, i) => (it.children?.length ? menuId(prefix, it, i) : null))
    .filter((x): x is string => Boolean(x));
  return items
    .map((it, i) => megaItem(prefix, it, i, menuIds, closeAction))
    .join("");
}

function renderHeader(menu: AmpNavItem[], scripts: AmpScripts): string {
  scripts.add("sidebar");
  const rowItems = menu.slice(0, 8);
  const panelIds = rowItems
    .map((it, i) => (it.children?.length ? menuId("nav", it, i) : null))
    .filter((x): x is string => Boolean(x));
  const allPanelIds = [...panelIds, MEGA_ID];
  const closeAction = `${allPanelIds.map((id) => `${id}.hide`).join(",")},${BACKDROP_ID}.hide`;

  const rows = rowItems.map((it, i) =>
    navRowItem(it, i, allPanelIds, closeAction),
  );
  const triggers =
    rows.map((r) => r.trigger).join("") +
    (menu.length ? moreTrigger(allPanelIds) : "");
  const panels = rows.map((r) => r.panel).join("");

  return `
<amp-sidebar id="${SIDEBAR_ID}" layout="nodisplay" side="left" class="amp-sidebar">
  <div class="amp-sidebar-head">${ampLogoImg()}<button class="amp-sidebar-close" on="tap:${SIDEBAR_ID}.close" aria-label="Close">✕</button></div>
  <nav class="amp-mega">${megaList("sidebar", menu, SIDEBAR_CLOSE)}</nav>
</amp-sidebar>
<header class="amp-header">
  <div class="amp-header-top">
    <button class="amp-hamburger" on="tap:${SIDEBAR_ID}.toggle" aria-label="Open menu"><span></span><span></span><span></span></button>
    <a href="/" class="amp-logo-link">${ampLogoImg()}</a>
  </div>
  <div class="amp-nav-row">${triggers}</div>
  ${panels}
  <div id="${MEGA_ID}" class="amp-mega-overlay" hidden>
    <div class="amp-mega-overlay-head">${ampLogoImg()}<button class="amp-sidebar-close" on="tap:${closeAction}" aria-label="Close">✕</button></div>
    <nav class="amp-mega">${megaList("mega", menu, closeAction)}</nav>
  </div>
  <div id="${BACKDROP_ID}" role="button" tabindex="0" aria-label="Close menu" class="amp-nav-backdrop" on="tap:${closeAction}" hidden></div>
</header>`;
}

// ── Layout ads on AMP (top banner + sticky/anchor) ──────────────────────────
/** Parse a GPT `defineSlot('/path',[sizes],'div')` code → slot path + a size. */
function parseGpt(
  code?: string,
): { path: string; width: number; height: number } | null {
  if (!code) return null;
  const m = code.match(
    /defineSlot\(\s*['"]([^'"]+)['"]\s*,\s*(\[[\s\S]*?\])\s*,/,
  );
  if (!m) return null;
  let width = 728;
  let height = 90;
  try {
    const sizes = JSON.parse(m[2].replace(/'/g, '"'));
    const norm: number[][] = Array.isArray(sizes[0]) ? sizes : [sizes];
    const real = norm.filter((s) => Array.isArray(s) && s[0] > 1 && s[1] > 1);
    if (real.length) {
      const big = real.reduce((a, b) => (b[0] > a[0] ? b : a));
      width = big[0];
      height = big[1];
    }
  } catch {
    /* keep defaults */
  }
  return { path: m[1], width, height };
}

/** GPT code → `<amp-ad type=doubleclick>` (mobile code preferred on AMP). */
function ampAdFromPlacement(p: AdPlacement, scripts: AmpScripts): string {
  const g = parseGpt(p.mobile || p.desktop);
  if (!g) return "";
  scripts.add("ad");
  return `<amp-ad width="${g.width}" height="${g.height}" type="doubleclick" data-slot="${esc(g.path)}"></amp-ad>`;
}

/**
 * Layout ads for AMP article pages (pageType "articlePage"): the Top banner
 * (inline `amp-ad`) and ONE bottom bar (sticky→anchor) as `amp-sticky-ad`. LHS/
 * RHS/interstitial are dropped (no place in AMP's single mobile column).
 */
function ampLayoutAds(
  adCodes: Record<string, unknown> | undefined,
  scripts: AmpScripts,
): { top: string; sticky: string } {
  const placements = getAdPlacements(adCodes, "articlePage");
  const pick = (kind: string) => placements.find((p) => p.kind === kind);

  const top = pick("top");
  const topHtml = top
    ? `<div class="amp-layout-ad">${ampAdFromPlacement(top, scripts)}</div>`
    : "";

  const bar = pick("sticky") || pick("anchor");
  const barAd = bar ? ampAdFromPlacement(bar, scripts) : "";
  const stickyHtml = barAd
    ? (scripts.add("sticky-ad"),
      `<amp-sticky-ad layout="nodisplay">${barAd}</amp-sticky-ad>`)
    : "";

  return { top: topHtml, sticky: stickyHtml };
}

// ── Public entry ─────────────────────────────────────────────────────────────
export function buildAmpDocument(opts: {
  story: Story;
  template: ArticleTemplateConfig | null;
  related: Story[];
  menu?: AmpNavItem[];
  adCodes?: Record<string, unknown>;
  vuukle?: Record<string, unknown> | null;
  taboola?: Record<string, unknown> | null;
  canonicalUrl: string;
  ampUrl: string;
  /** Comments disclaimer to use when the AMP component doesn't set its own
   *  (typically the HTML template's authored value). */
  fallbackDisclaimer?: string;
}): string {
  const {
    story,
    template,
    related,
    menu = [],
    adCodes,
    vuukle,
    taboola,
    canonicalUrl,
    ampUrl,
    fallbackDisclaimer,
  } = opts;
  const scripts: AmpScripts = new Set();
  const layoutAds = ampLayoutAds(adCodes, scripts);

  // Taboola (AMP) — `config.amp.{enabled, headerCode, bodyCode, fullVideoPageAdCode}`.
  // `bodyCode` is an <amp-embed type="taboola"> (with a {PUBLISHER_ID} placeholder);
  // `headerCode` declares the amp-embed custom-element script → injected into <head>
  // ONCE. Empty until the builder enables AMP + adds code (renders nothing till then).
  const taboolaConfig = extractTaboolaConfig(taboola);
  // Taboola's amp-embed script is declared via the deduped script list, not a
  // raw head injection (see below). Kept empty for the <head> template slot.
  const taboolaHead = "";
  const renderTaboolaAmp = (variant: "body" | "fullVideo" = "body"): string => {
    const amp = taboolaConfig?.amp;
    if (!taboolaConfig || taboolaConfig.enabled === false || !amp?.enabled)
      return "";
    const raw =
      variant === "fullVideo" ? amp.fullVideoPageAdCode : amp.bodyCode;
    const code = (raw ?? "").trim();
    if (!code) return "";
    // Declare the amp-embed extension via the (deduped) script list. We do NOT
    // inject the builder's raw `headerCode` — it ships an invalid
    // `custom-element="amp-embed" src=".../amp-embed-0.1.js"` tag (there is no
    // amp-embed extension; `<amp-embed>` is served by amp-ad), which fails AMP
    // validation. `scripts.add("embed")` resolves to the correct amp-ad script.
    scripts.add("embed");
    const html = code.replace(
      /\{PUBLISHER_ID\}/g,
      taboolaConfig.publisherId ?? "",
    );
    return `<div class="amp-taboola">${html}</div>`;
  };

  // Vuukle comments (AMP) — resolve the builder config for this story once.
  const vuukleConfig = extractVuukleConfig(vuukle);
  const renderVuukleAmp = (disclaimer?: string): string => {
    const amp = vuukleConfig?.amp;
    if (!vuukleConfig?.enabled || !amp?.enabled) return "";
    const section = story?.sections?.[0] as
      { slug?: string; "section-url"?: string } | undefined;
    const ctx: VuukleArticleContext = {
      canonicalUrl,
      id: String(story.id ?? ""),
      title: story.headline ?? "",
      imageUrl: story["hero-image-s3-key"]
        ? toMediaUrl(story["hero-image-s3-key"])
        : "",
      categorySlug: section?.slug ?? section?.["section-url"] ?? "",
    };
    const vars = resolveVuukleVars(vuukleConfig, ctx, vuukleWidgetId(ctx.id));
    let out = "";
    if (amp.loadCookieCode) {
      scripts.add("iframe");
      out += applyVuukleVars(amp.loadCookieCode, vars);
    }
    if (amp.commentsCode) {
      scripts.add("iframe");
      out += applyVuukleVars(amp.commentsCode, vars);
    }
    if (!out) return "";
    // Builder-authored disclaimer shown above the comments; unset renders
    // nothing (mirrors the HTML VuukleCommentsBlock).
    const note = disclaimer?.trim()
      ? `<p class="amp-vuukle-disclaimer">${esc(disclaimer)}</p>`
      : "";
    return `<section class="amp-comments">${note}${out}</section>`;
  };

  // Which pieces to render, in the template's order (default set if no template).
  const components = flattenComponents(template);
  const emit = (component: PageComponent): string => {
    // AMP-variant templates key components as `AmpArticleHeroSection`,
    // `AmpArticleTextTemplate`, … — strip the `Amp` prefix so they match the
    // same markers/switch cases as the HTML component types (mirrors the HTML
    // renderer). Without this, an AMP template renders no hero/body.
    const type = (component.component_type || "").replace(/^Amp/, "");
    const props = (component.props ?? {}) as Record<string, any>;
    if (BODY_MARKERS.has(type))
      return renderBody(
        story,
        props.inArticleAds as InArticleAdSlot[],
        scripts,
      );
    switch (type) {
      case "ArticleHeroSection":
        return renderHero(
          Array.isArray(props.heroFields) && props.heroFields.length
            ? (props.heroFields as HeroField[])
            : DEFAULT_HERO_FIELDS,
          story,
          ampUrl,
          scripts,
        );
      case "ArticleBreadcrumb":
        return renderBreadcrumb(story);
      case "ArticleAuthorBlock":
        return renderByline(story);
      case "ArticleRelatedStories":
        return renderRelated(related, scripts);
      case "ArticleTags":
      case "ArticleStoryTags":
        return renderTags(story);
      case "ArticleComments":
      case "ArticleCommentsSection":
      case "AmpArticleComments":
        return renderVuukleAmp(
          typeof props.disclaimer === "string" && props.disclaimer.trim()
            ? props.disclaimer
            : fallbackDisclaimer,
        );
      // Taboola on AMP — bottom/mid → the amp-embed bodyCode. Right rail has no
      // AMP equivalent (single column), so it renders nothing.
      case "ArticleTaboolaBottom":
      case "AmpArticleTaboolaBottom":
      case "ArticleTaboolaMid":
        return renderTaboolaAmp("body");
      case "ArticleTaboolaRightRail":
        return "";
      default:
        return "";
    }
  };

  let bodyHtml: string;
  if (components.length > 0) {
    bodyHtml = components.map(emit).join("");
  } else {
    // No template → default order.
    bodyHtml =
      renderHero(DEFAULT_HERO_FIELDS, story, ampUrl, scripts) +
      renderBody(story, undefined, scripts) +
      renderTags(story) +
      renderRelated(related, scripts);
  }

  // Header (hamburger sidebar + mega menu) — built before the script list so
  // its amp-sidebar script is included.
  const headerHtml = menu.length ? renderHeader(menu, scripts) : "";

  const desc = esc(
    story.seo?.["meta-description"] || story.summary || story.subheadline || "",
  );
  // Dedupe by custom-element name: `ad` and `embed` both resolve to the amp-ad
  // extension, and AMP allows only ONE script tag per extension.
  const scriptTags = Array.from(
    new Map(
      Array.from(scripts).map((s) => [
        customElement(s),
        `<script async custom-element="${customElement(s)}" src="${SCRIPT_SRC[s]}"></script>`,
      ]),
    ).values(),
  ).join("");

  return `<!doctype html>
<html ⚡ lang="kn">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
<link rel="canonical" href="${esc(canonicalUrl)}">
<title>${esc(story.seo?.["meta-title"] || story.headline || "ಕನ್ನಡಪ್ರಭ")}</title>
<meta name="description" content="${desc}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Baloo+Tamma+2:wght@400;500;700&family=Noto+Sans+Kannada:wght@400;600;700&display=swap" rel="stylesheet">
<script async src="https://cdn.ampproject.org/v0.js"></script>
${scriptTags}
${taboolaHead}
<script type="application/ld+json">${ampJsonLd(story)}</script>
<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
<style amp-custom>${AMP_CSS}</style>
</head>
<body>
${headerHtml || `<header class="amp-header"><div class="amp-header-top"><a href="/" class="amp-logo-link">${ampLogoImg()}</a></div></header>`}
${layoutAds.top}
<main class="amp-article">
${bodyHtml}
</main>
<footer class="amp-footer">© kannadaprabha ${new Date(story["published-at"] || Date.now()).getFullYear()}</footer>
${layoutAds.sticky}
</body>
</html>`;
}

function renderTags(story: Story): string {
  const tags = (story?.tags ?? []).filter((t: any) => t?.name);
  if (tags.length === 0) return "";
  return `<div class="amp-tags">${tags
    .map(
      (t: any) =>
        `<a href="${t.slug ? `/topic/${esc(t.slug)}` : "#"}">${esc(t.name)}</a>`,
    )
    .join("")}</div>`;
}

function renderRelated(related: Story[], _scripts: AmpScripts): string {
  const list = (related ?? []).filter((s: any) => s?.slug).slice(0, 6);
  if (list.length === 0) return "";
  return `<aside class="amp-related"><h2>ಸಂಬಂಧಿತ ಸುದ್ದಿಗಳು</h2>${list
    .map(
      (s: any) =>
        `<a class="amp-rel-item" href="/${esc(s.slug)}">${s["hero-image-s3-key"] ? ampImg(s["hero-image-s3-key"], 96, 64, s.headline || "", "fixed") : ""}<h3>${esc(s.headline)}</h3></a>`,
    )
    .join("")}</aside>`;
}

/**
 * AMP structured data — reuses the canonical article graph builder so the AMP
 * page carries schema IDENTICAL to its canonical HTML page (WebPage +
 * BreadcrumbList + NewsArticle, plus VideoObject/LiveBlogPosting when
 * applicable). Google requires structured-data parity across amphtml/canonical
 * pairs (doc §7). Emitted as a single JSON array (Google accepts an array of
 * top-level objects in one ld+json block).
 */
function ampJsonLd(story: Story): string {
  const slug = String(story.slug ?? "").replace(/^\/+/, "");
  return JSON.stringify(generateArticleSchemaFromStory(story, slug)).replace(
    /</g,
    "\\u003c",
  );
}

// AMP allows exactly one <style amp-custom> (<75KB, no !important).
const AMP_CSS = `
*{box-sizing:border-box}
body{margin:0;font-family:'Noto Sans Kannada','Baloo Tamma 2',system-ui,sans-serif;color:#333;background:#fff;line-height:1.6}
a{color:#009ef9;text-decoration:none}
.amp-logo{font-family:'Baloo Tamma 2';font-weight:700;font-size:22px;color:#1e1e1e}
.amp-logo-link{display:inline-block;line-height:0}
.amp-logo-img{max-width:100%}
/* header + hamburger */
.amp-header{position:sticky;top:0;z-index:20;background:#fff;border-bottom:1px solid #dfdfdf}
.amp-header-top{position:relative;display:flex;align-items:center;justify-content:center;min-height:44px;padding:10px 16px}
.amp-hamburger{position:absolute;left:12px;top:50%;transform:translateY(-50%);background:none;border:0;display:flex;flex-direction:column;gap:4px;padding:6px;cursor:pointer}
.amp-hamburger span{width:22px;height:2px;background:#1e1e1e;display:block}
.amp-nav-row{display:flex;justify-content:safe center;gap:4px;overflow-x:auto;padding:0 12px 8px;-webkit-overflow-scrolling:touch;white-space:nowrap}
.amp-nav-row>*{flex:0 0 auto}
.amp-nav-row::-webkit-scrollbar{display:none}
.amp-nav-item{display:inline-flex;align-items:center;gap:4px;padding:6px 10px;font-family:'Baloo Tamma 2';font-weight:600;font-size:14px;color:#1e1e1e;flex:0 0 auto;cursor:pointer}
.amp-nav-caret{font-size:10px;color:#808080}
.amp-nav-more{font-weight:700}.amp-nav-dots{font-size:20px;line-height:1}
.amp-nav-panel{position:absolute;top:100%;left:50%;transform:translateX(-50%);min-width:220px;width:max-content;max-width:min(92vw,360px);background:#fff;border:1px solid #dfdfdf;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.12);padding:8px;z-index:30;max-height:60vh;overflow:auto}
.amp-nav-dropdown-link,.amp-nav-dropdown-child{display:block;padding:8px 10px;font-size:14px;color:#333}
.amp-nav-dropdown-link{font-weight:700;border-bottom:1px solid #eee}
/* backdrop */
.amp-nav-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:15}
/* sidebar + mega */
.amp-sidebar{width:82vw;max-width:340px;padding:0;background:#fff}
.amp-sidebar-head,.amp-mega-overlay-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #dfdfdf}
.amp-sidebar-close{background:none;border:0;font-size:18px;color:#808080;cursor:pointer}
.amp-mega-overlay{position:fixed;inset:0;background:#fff;z-index:25;overflow:auto}
.amp-mega{padding:12px}
.amp-mega-item{border:1px solid #eef1f6;border-radius:10px;margin-bottom:8px;overflow:hidden}
.amp-mega-row{display:flex;align-items:center;justify-content:space-between}
.amp-mega-link{flex:1;padding:12px 14px;font-family:'Baloo Tamma 2';font-weight:600;font-size:15px;color:#1e1e1e}
.amp-mega-trigger{padding:12px 14px;color:#808080;cursor:pointer}
.amp-mega-children{border-top:1px solid #eef1f6;padding:4px 0 4px 14px;border-left:3px solid #009ef9;margin:0 8px 8px}
.amp-mega-child{display:block;padding:8px 10px;font-size:14px;color:#4a4a4a}
.amp-article{max-width:720px;margin:0 auto;padding:16px}
.amp-breadcrumb{font-size:12px;color:#808080;margin-bottom:8px}
.amp-breadcrumb span{margin:0 4px}
.amp-category{font-family:'Baloo Tamma 2';font-weight:600;font-size:12px;text-transform:uppercase;color:#3742b8}
.amp-headline{font-family:'Baloo Tamma 2';font-weight:700;font-size:28px;line-height:1.2;color:#1e1e1e;margin:8px 0}
.amp-subhead-text{font-size:17px;color:#4f4f4f;margin:8px 0}
.amp-figure{margin:16px 0}
.amp-figure figcaption{font-size:12px;color:#6d6d6d;margin-top:6px}
.amp-review-rating{display:flex;flex-wrap:wrap;align-items:center;gap:10px;border:1px solid #dfdfdf;background:#f9f9f9;border-radius:8px;padding:10px 14px;margin:0 0 16px}
.amp-review-rating .r-title{font-weight:700;color:#1e1e1e}
.amp-review-rating .r-stars{color:#f5a623;font-size:20px;letter-spacing:2px}
.amp-review-rating .r-value{font-size:14px;font-weight:600;color:#6d6d6d}
.amp-hero{margin:16px 0}
.amp-byline{display:flex;align-items:center;gap:8px;padding:4px 0;margin:8px 0}
.amp-avatar{border-radius:999px;overflow:hidden}
.amp-author{font-weight:600;color:#333;display:block;font-size:14px}
.amp-date{font-size:12px;color:#808080}
.amp-datemeta{gap:16px;flex-wrap:wrap}
.amp-share{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}
amp-social-share[type="telegram"]{background:#0088cc url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23fff'%3E%3Cpath d='M21.9 4.3 18.7 19c-.2 1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.3-4.9 8.9-8c.4-.3-.1-.5-.6-.2L6.4 13 1.7 11.5c-1-.3-1-1 .2-1.5l18.7-7.2c.9-.3 1.6.2 1.3 1.5Z'/%3E%3C/svg%3E") center/60% no-repeat}
.amp-text{font-size:18px;color:#333;margin:0 0 16px}
.amp-text p{margin:0 0 16px}
.amp-text ul,.amp-text ol{padding-left:24px;margin:0 0 16px}
.amp-subhead{font-family:'Baloo Tamma 2';font-weight:700;font-size:22px;margin:24px 0 8px;color:#1e1e1e}
.amp-quote{border-left:4px solid #009ef9;padding-left:16px;font-style:italic;font-size:20px;color:#4a4a4a;margin:20px 0}
.amp-blurb{background:#f9f9f9;padding:16px;border-radius:8px;font-style:italic;margin:16px 0}
.amp-bigfact{text-align:center;border-top:1px solid #dfdfdf;border-bottom:1px solid #dfdfdf;padding:24px 0;margin:24px 0;font-family:'Baloo Tamma 2';font-weight:700;font-size:30px;color:#009ef9}
.amp-bigfact span{display:block;font-size:14px;color:#808080;font-weight:400;margin-top:8px}
.amp-qa{display:flex;gap:12px;padding:16px;border-radius:8px;margin:12px 0}
.amp-q{background:#f2f7ff}.amp-a{background:#fff6de}
.amp-liveblog{margin:8px 0}
.amp-live-head{display:flex;align-items:center;gap:8px;margin-bottom:16px}
.amp-live-badge{border-radius:4px;padding:4px 8px;font-size:12px;font-weight:700;text-transform:uppercase;color:#fff}
.amp-live-on{background:#dc2626}
.amp-live-closed{background:#808080}
.amp-live-count{font-size:12px;color:#808080}
.amp-live-timeline{position:relative;padding-left:20px}
.amp-live-timeline:before{content:"";position:absolute;left:6px;top:6px;bottom:6px;width:1px;background:#dfdfdf}
.amp-live-item{position:relative;margin:0 0 28px}
.amp-live-item:before{content:"";position:absolute;left:-20px;top:4px;width:13px;height:13px;border-radius:50%;border:2px solid #009ef9;background:#fff}
.amp-live-time{display:block;font-size:12px;font-weight:600;color:#808080;margin-bottom:6px}
.amp-live-body>*{margin-top:8px}
.amp-qa b{display:inline-flex;width:28px;height:28px;align-items:center;justify-content:center;border-radius:4px;color:#fff;flex-shrink:0}
.amp-q b{background:#009ef9}.amp-a b{background:#facc15}
.amp-cta{text-align:center;margin:16px 0}
.amp-cta a{display:inline-block;background:#009ef9;color:#fff;padding:12px 24px;border-radius:999px;font-family:'Baloo Tamma 2';font-weight:600}
.amp-promo{font-size:14px;color:#808080;margin:12px 0}
/* Ribbon-tab card design shared by the Summary and Also-Read blocks. */
.amp-summary-wrap,.amp-linked-wrap{position:relative;margin:12px 0}
.amp-ribbon-tab{position:absolute;left:0;top:0;z-index:1;background:#2c39c6;color:#fff;font-weight:600;font-size:13px;padding:5px 14px;border-radius:8px 0 8px 0;line-height:1}
.amp-summary{border:1px solid #dfdfdf;border-radius:8px;padding:36px 14px 14px}
.amp-summary>*{margin:0 0 8px}.amp-summary>*:last-child{margin-bottom:0}
.amp-linked{display:flex;gap:12px;border:1px solid #dfdfdf;border-radius:8px;padding:36px 12px 12px;align-items:center}
.amp-linked h4{margin:0;font-family:'Baloo Tamma 2';font-weight:700;font-size:16px;color:#183354}
.amp-refs{border:1px solid #dfdfdf;background:#f9f9f9;border-radius:8px;padding:16px;margin:16px 0}
.amp-refs ul{padding-left:20px}
.amp-table-wrap{overflow-x:auto;margin:16px 0}
.amp-table-wrap table{width:100%;border-collapse:collapse;font-size:14px}
.amp-table-wrap td,.amp-table-wrap th{border:1px solid #dfdfdf;padding:8px 12px}
.amp-table-wrap th{background:#f9f9f9;text-align:left;font-weight:600;color:#1e1e1e}
.amp-file{display:inline-flex;align-items:center;gap:8px;border:1px solid #dfdfdf;border-radius:6px;padding:10px 12px;margin:12px 0;font-size:14px;color:#183354;text-decoration:none}
.amp-table-wrap td{border:1px solid #dfdfdf;padding:8px}
.amp-ad-box{margin:16px 0;text-align:center}
.amp-taboola{margin:20px 0}
.amp-vuukle-disclaimer{font-family:'Baloo Tamma 2';font-size:12px;color:#808080;line-height:1.6;margin:0 0 12px}
.amp-tags{display:flex;flex-wrap:wrap;gap:8px;border-top:1px solid #dfdfdf;padding-top:16px;margin-top:16px}
.amp-tags a{border:1px solid #dfdfdf;border-radius:999px;padding:4px 12px;font-size:13px;color:#4a4a4a}
.amp-related{margin-top:32px}
.amp-related h2{font-family:'Baloo Tamma 2';font-weight:700;font-size:18px;border-bottom:1px solid #dfdfdf;padding-bottom:8px}
.amp-rel-item{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid #dfdfdf;align-items:center}
.amp-rel-item h3{margin:0;font-family:'Baloo Tamma 2';font-weight:600;font-size:14px;color:#333}
.amp-footer{text-align:center;padding:24px 16px;color:#808080;font-size:12px;border-top:1px solid #dfdfdf;margin-top:32px}
.amp-layout-ad{display:flex;justify-content:center;overflow:hidden;margin:8px 0}
`;
