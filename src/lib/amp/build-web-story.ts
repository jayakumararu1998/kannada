/**
 * AMP Web Story (Google Web Stories) generator — full-screen, swipeable
 * `<amp-story>` slides. Ported from dinamani's web-story branch, adapted to
 * Kannada Prabha. amp-story renders its own UI chrome (segmented progress bar,
 * pause button, share, prev/next tap zones), so we only supply the pages.
 */

import type { Story } from "@/lib/api/stories";
import { toMediaUrl } from "@/lib/images";
import { SITE_URL } from "@/lib/constants";

const PUBLISHER = "ಕನ್ನಡಪ್ರಭ";
// The site wordmark (media CDN — /logo.png 404s). Shown on the first slide and
// used as the amp-story publisher-logo-src + JSON-LD publisher logo.
const LOGO_URL =
  "https://media.kannadaprabha.com/kannadaprabha/2025-07-25/sco3feff/kplogo.png";
const PUBLISHER_LOGO = LOGO_URL;

interface WebStorySlide {
  image: string;
  title?: string;
  text?: string;
  isVideo?: boolean;
  focusPoint?: number[];
  imageWidth?: number;
  imageHeight?: number;
  isLastCard?: boolean;
  promotionalMessage?: string;
  ctaTitle?: string;
  ctaUrl?: string;
}

function esc(str: unknown): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stripHtml(html: string): string {
  return (html ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/** Is this story a web/visual story (→ amp-story format)? */
export function isWebStoryArticle(story: Story, slug?: string): boolean {
  const template = String(story["story-template"] || "").toLowerCase();
  if (
    template.includes("web-story") ||
    template.includes("webstory") ||
    template.includes("visual-story") ||
    template.includes("visual")
  )
    return true;

  for (const s of story.sections ?? []) {
    const sl = String(s?.slug || "").toLowerCase();
    const nm = String(s?.name || "").toLowerCase();
    if (
      sl.includes("web-stor") ||
      sl.includes("webstor") ||
      nm.includes("web stor") ||
      nm.includes("webstor")
    )
      return true;
  }
  const ct = String(story["content-type"] || "").toLowerCase();
  if (ct === "web-story" || ct === "webstory") return true;
  if (slug && /web-?stor/i.test(slug)) return true;
  return false;
}

/** Each card → a slide (image + caption); hero image is the first slide. */
export function extractWebStorySlides(story: Story): WebStorySlide[] {
  const slides: WebStorySlide[] = [];

  if (story["hero-image-s3-key"]) {
    const hm = story["hero-image-metadata"];
    slides.push({
      image: toMediaUrl(story["hero-image-s3-key"]) ?? "",
      title: story.headline,
      text: story.subheadline || "",
      focusPoint: hm?.["focus-point"],
      imageWidth: hm?.width,
      imageHeight: hm?.height,
    });
  }

  const promo = story["promotional-message"] || "";
  const cards = story.cards ?? [];
  cards.forEach((card: any, cardIndex: number) => {
    const isLast = cardIndex === cards.length - 1;
    const els = card["story-elements"] ?? [];
    let imageEl: any = null;
    let textEl: any = null;
    let ctaTitle: string | undefined;
    let ctaUrl: string | undefined;

    for (const el of els) {
      if (!imageEl && el.type === "image" && el["image-s3-key"]) imageEl = el;
      else if (el.subtype === "cta" && el.metadata) {
        ctaTitle = el.metadata["cta-title"] || "";
        ctaUrl = el.metadata["cta-url"] || "";
      } else if (el.metadata?.["promotional-message"]) {
        /* skip */
      } else if (!textEl && el.type === "text" && el.text) textEl = el;
      else if (
        !imageEl &&
        el.type === "video" &&
        (el["video-poster-s3-key"] || el["image-s3-key"])
      ) {
        imageEl = {
          ...el,
          "image-s3-key": el["video-poster-s3-key"] || el["image-s3-key"],
          isVideo: true,
        };
      }
    }

    if (imageEl) {
      const im = imageEl["image-metadata"];
      const textContent = textEl ? stripHtml(textEl.text) : "";
      slides.push({
        image: toMediaUrl(imageEl["image-s3-key"]) ?? "",
        title: textContent || imageEl.title || "",
        text: imageEl["image-attribution"] || "",
        focusPoint: im?.["focus-point"],
        imageWidth: im?.width,
        imageHeight: im?.height,
        isVideo: imageEl.isVideo || false,
        isLastCard: isLast,
        promotionalMessage: isLast ? promo : undefined,
        ctaTitle: isLast ? ctaTitle : undefined,
        ctaUrl: isLast ? ctaUrl : undefined,
      });
    }
  });

  if (slides.length === 0 && story["hero-image-s3-key"]) {
    slides.push({
      image: toMediaUrl(story["hero-image-s3-key"]) ?? "",
      title: story.headline,
    });
  }
  return slides;
}

export function buildAmpWebStory(opts: {
  story: Story;
  canonicalUrl: string;
  ampUrl: string;
}): string {
  const { story, canonicalUrl } = opts;
  const slides = extractWebStorySlides(story);
  const heroImage = story["hero-image-s3-key"]
    ? toMediaUrl(story["hero-image-s3-key"])
    : "";
  const poster = heroImage || PUBLISHER_LOGO;
  const seoTitle = story.seo?.["meta-title"] || story.headline || PUBLISHER;
  const seoDesc =
    story.seo?.["meta-description"] || story.summary || story.subheadline || "";
  const author = story.authors?.[0]?.name || PUBLISHER;

  // Per-page focus-point object-position.
  const focusCss = slides
    .map((s, i) => {
      if (Array.isArray(s.focusPoint) && s.focusPoint.length >= 2) {
        const [x, y] = s.focusPoint;
        const w = s.imageWidth || 1;
        const h = s.imageHeight || 1;
        return `#page-${i + 1} amp-img img{object-position:${Math.round((x / w) * 100)}% ${Math.round((y / h) * 100)}%}`;
      }
      return "";
    })
    .filter(Boolean)
    .join("");

  const pages = slides
    .map((slide, index) => {
      const id = `page-${index + 1}`;
      const first = index === 0;
      const last = slide.isLastCard === true;
      return `
    <amp-story-page id="${id}" auto-advance-after="4s">
      <amp-story-grid-layer template="fill">
        <amp-img src="${esc(slide.image)}" width="720" height="1280" layout="responsive" alt="${esc(last ? PUBLISHER : slide.title || `Slide ${index + 1}`)}"></amp-img>
      </amp-story-grid-layer>
      ${
        first
          ? `<amp-story-grid-layer template="vertical" class="logo-layer"><amp-img src="${esc(LOGO_URL)}" width="179" height="60" layout="fixed" class="ws-logo" alt="${esc(PUBLISHER)}"></amp-img></amp-story-grid-layer>`
          : ""
      }
      <amp-story-grid-layer template="vertical" class="bottom">
        <div class="ws-text">
          ${last && slide.promotionalMessage ? `<div class="ws-promo">${esc(stripHtml(slide.promotionalMessage))}</div>` : ""}
          ${last ? `<a href="${esc(slide.ctaUrl || "/")}" class="ws-cta">${esc(slide.ctaTitle || "ಮುಖಪುಟಕ್ಕೆ")}</a>` : ""}
          ${!last && first && slide.title ? `<h1 class="ws-title">${esc(slide.title)}</h1>` : ""}
          ${!last && !first && slide.title ? `<p class="ws-caption">${esc(slide.title)}</p>` : ""}
          ${!last && slide.text ? `<p class="ws-attr">${esc(slide.text)}</p>` : ""}
          ${first && author ? `<p class="ws-author">${esc(author)}</p>` : ""}
        </div>
      </amp-story-grid-layer>
    </amp-story-page>`;
    })
    .join("\n");

  return `<!doctype html>
<html amp lang="kn">
<head>
<meta charset="utf-8">
<script async src="https://cdn.ampproject.org/v0.js"></script>
<script async custom-element="amp-story" src="https://cdn.ampproject.org/v0/amp-story-1.0.js"></script>
<title>${esc(seoTitle)}</title>
<link rel="canonical" href="${esc(canonicalUrl)}">
<meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
<meta name="description" content="${esc(seoDesc)}">
<meta name="author" content="${esc(author)}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(story.headline)}">
<meta property="og:image" content="${esc(poster)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Kannada:wght@400;600;700&display=swap" rel="stylesheet">
<script type="application/ld+json">${jsonLd(story, canonicalUrl, slides)}</script>
<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
<style amp-custom>
amp-story{font-family:'Noto Sans Kannada',sans-serif}
amp-story-page{background:linear-gradient(180deg,#1a1a2e 0%,#16213e 100%)}
amp-story-grid-layer{padding:0}
amp-story-page amp-img img{object-fit:cover}
.logo-layer{align-content:start;justify-items:center;padding:40px 14px 0}
/* No chip/box — the logo's white background blends away over the (light,
   blurred) first slide via multiply, leaving just the black wordmark. */
.ws-logo img{object-fit:contain;mix-blend-mode:multiply}
.bottom{align-content:end}
.ws-text{background:linear-gradient(0deg,rgba(0,0,0,.92) 0%,rgba(0,0,0,.75) 35%,rgba(0,0,0,.4) 65%,transparent 100%);padding:20px 20px 40px;min-height:100%;display:flex;flex-direction:column;justify-content:flex-end}
.ws-title{color:#fff;font-size:26px;font-weight:700;line-height:1.3;margin:0 0 10px;text-shadow:0 2px 4px rgba(0,0,0,.5)}
.ws-caption{color:#fff;font-size:18px;font-weight:600;line-height:1.35;margin:0 0 8px;text-shadow:0 2px 4px rgba(0,0,0,.5)}
.ws-attr{color:rgba(255,255,255,.75);font-size:12px;margin:6px 0 0;text-align:right;text-shadow:0 1px 2px rgba(0,0,0,.5)}
.ws-author{color:#facc15;font-size:12px;font-weight:600;margin:8px 0 0;text-align:right;text-shadow:0 1px 2px rgba(0,0,0,.5)}
.ws-promo{color:rgba(255,255,255,.9);font-size:11px;line-height:1.4;margin-bottom:16px}
.ws-cta{display:inline-block;padding:12px 24px;background:rgba(255,255,255,.2);color:#fff;font-size:14px;font-weight:600;border-radius:9999px;border:1px solid rgba(255,255,255,.4);text-decoration:none;align-self:flex-start}
${focusCss}
</style>
</head>
<body>
<amp-story standalone title="${esc(seoTitle)}" publisher="${PUBLISHER}" publisher-logo-src="${esc(PUBLISHER_LOGO)}" poster-portrait-src="${esc(poster)}">
${pages}
</amp-story>
</body>
</html>`;
}

function toIso(ts?: string | number): string | undefined {
  if (ts == null || ts === "") return undefined;
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function jsonLd(story: Story, url: string, slides: WebStorySlide[]): string {
  const imgs = slides.filter((s) => !s.isVideo && s.image);
  const published = toIso(story["first-published-at"] || story["published-at"]);
  const modified = toIso(
    story["last-published-at"] || story["updated-at"] || story["published-at"],
  );
  const description =
    story.seo?.["meta-description"] || story.summary || story.subheadline || "";
  return JSON.stringify([
    {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "@id": `${url}#article`,
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      headline: String(story.headline ?? "").slice(0, 110),
      ...(description ? { description } : {}),
      image: imgs.map((s) => s.image),
      ...(published ? { datePublished: published } : {}),
      ...(modified ? { dateModified: modified } : {}),
      author: (story.authors ?? []).map((a: any) => ({
        "@type": "Person",
        name: a.name,
        ...(a.slug ? { url: `${SITE_URL}/author/${a.slug}` } : {}),
      })),
      publisher: {
        "@type": "Organization",
        name: PUBLISHER,
        logo: { "@type": "ImageObject", url: PUBLISHER_LOGO },
      },
      inLanguage: "kn",
    },
    {
      "@context": "https://schema.org",
      "@type": "ImageGallery",
      "@id": `${url}#gallery`,
      headline: story.headline,
      associatedMedia: imgs.map((s, i) => ({
        "@type": "ImageObject",
        contentUrl: s.image,
        name: s.title || `${story.headline} - ${i + 1}`,
        caption: s.title || story.headline,
      })),
    },
  ]).replace(/</g, "\\u003c");
}
