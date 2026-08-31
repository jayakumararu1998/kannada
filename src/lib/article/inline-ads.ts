/**
 * Paragraph-anchored in-article ad placement — ported from dinamani's
 * `articleInlineAds.ts`. A body marker's `props.inArticleAds` is a list of
 * `InArticleAdSlot`s, each pinned to ONE exact paragraph (`afterParagraph`,
 * 1-indexed; `0` = before the first paragraph). We compute a global paragraph
 * index across the story's regular body text and place each configured slot
 * after its paragraph — so ad positions are fully builder-configurable per
 * template, exactly like dinamani.
 */

export type InArticleAdContentType = "ad" | "image" | "html";

export interface InArticleAdSlot {
  id?: string;
  contentType?: InArticleAdContentType;
  /** contentType 'ad' — raw ad markup (may contain <script>). */
  desktopCode?: string;
  mobileCode?: string;
  /** contentType 'image' — device image srcs + optional click-through. */
  desktopImage?: string;
  mobileImage?: string;
  imageLinkUrl?: string;
  /** contentType 'html' — raw custom HTML (may contain <script>). */
  desktopHtml?: string;
  mobileHtml?: string;
  html?: string;
  /** The single 1-indexed paragraph this slot appears after (0 = top of body). */
  afterParagraph?: number;
  /** "300x250" | "in-read" — box hint (in-read = fluid/self-sizing). */
  adSize?: string;
}

export interface ParagraphInfo {
  startIndex: number;
  paragraphs: string[];
}

/** Split HTML into top-level block elements, keeping lists/tables whole. */
export function splitIntoParagraphs(html: string): string[] {
  if (!html) return [];
  const matches = html.match(
    /<(p|ul|ol|div|blockquote|h[1-6]|table)[\s\S]*?<\/\1>/gi,
  );
  return matches || [];
}

/**
 * Map "cardIdx_elementIdx" → { startIndex, paragraphs } over the story's
 * REGULAR body text only (excludes summary/also-read/quote/blockquote/cta/
 * q-and-a/bigfact/blurb/question/promotional — those render as their own cards
 * and never anchor an ad). `answer` is kept (it's the Q&A body).
 */
export function computeParagraphMap(story: any): Record<string, ParagraphInfo> {
  const map: Record<string, ParagraphInfo> = {};
  let globalParaIdx = 0;
  const cards = story?.cards ?? [];
  for (let ci = 0; ci < cards.length; ci++) {
    const els = cards[ci]?.["story-elements"] ?? [];
    for (let ei = 0; ei < els.length; ei++) {
      const el = els[ei];
      if (
        el?.type === "text" &&
        el.text &&
        el.subtype !== "summary" &&
        el.subtype !== "also-read" &&
        el.subtype !== "question" &&
        el.subtype !== "answer" &&
        el.subtype !== "quote" &&
        el.subtype !== "blockquote" &&
        el.subtype !== "cta" &&
        el.subtype !== "q-and-a" &&
        el.subtype !== "bigfact" &&
        el.subtype !== "blurb" &&
        !el.metadata?.["promotional-message"]
      ) {
        const paragraphs = splitIntoParagraphs(el.text);
        if (paragraphs.length > 0) {
          map[`${ci}_${ei}`] = { startIndex: globalParaIdx, paragraphs };
          globalParaIdx += paragraphs.length;
        }
      }
    }
  }
  return map;
}

/**
 * Map "cardIdx_elementIdx" → 0-based global IMAGE index, over every image
 * element in the story. Photo galleries have images (not paragraphs), so their
 * in-article ads anchor to images: `afterParagraph` on a slot is reinterpreted
 * as "after the Nth image". Same 1-based→0-based convention as paragraphs, so
 * the SAME `buildParagraphAdPlan`/`getAdSlotForParagraph` machinery applies.
 */
export function computeImageMap(story: any): Record<string, number> {
  const map: Record<string, number> = {};
  let globalImgIdx = 0;
  const cards = story?.cards ?? [];
  for (let ci = 0; ci < cards.length; ci++) {
    const els = cards[ci]?.["story-elements"] ?? [];
    for (let ei = 0; ei < els.length; ei++) {
      const el = els[ei];
      if (el?.type === "image" && el["image-s3-key"]) {
        map[`${ci}_${ei}`] = globalImgIdx;
        globalImgIdx += 1;
      }
    }
  }
  return map;
}

/** True when a slot has content for its contentType. */
function hasSlotContent(slot: InArticleAdSlot): boolean {
  switch (slot.contentType) {
    case "image":
      return !!(slot.desktopImage || slot.mobileImage || slot.imageLinkUrl);
    case "html":
      return !!(slot.desktopHtml || slot.mobileHtml || slot.html);
    default:
      return !!(slot.desktopCode || slot.mobileCode);
  }
}

/**
 * global-paragraph-index → the slot to render after it. Each slot is a
 * ONE-TIME placement at `afterParagraph - 1` (0-indexed). `afterParagraph: 0`
 * → key `-1` (top of body). Ties resolve in array order. When the article has
 * no body paragraphs, the lowest-configured slot is placed at the top so a
 * player-only (video) article still shows one ad.
 */
export function buildParagraphAdPlan(
  adSlots: InArticleAdSlot[] | undefined,
  hasParagraphs = true,
): Map<number, InArticleAdSlot> {
  const plan = new Map<number, InArticleAdSlot>();
  const valid = (adSlots || []).filter(
    (s) =>
      hasSlotContent(s) &&
      s.afterParagraph !== undefined &&
      s.afterParagraph !== null &&
      s.afterParagraph >= 0,
  );

  if (!hasParagraphs) {
    if (valid.length > 0) {
      const first = valid.reduce((lo, s) =>
        s.afterParagraph! < lo.afterParagraph! ? s : lo,
      );
      plan.set(-1, first);
    }
    return plan;
  }

  for (const slot of valid) {
    const position = slot.afterParagraph! - 1;
    if (!plan.has(position)) plan.set(position, slot);
  }
  return plan;
}

export function getAdSlotForParagraph(
  plan: Map<number, InArticleAdSlot>,
  globalParaIdx: number,
): InArticleAdSlot | null {
  return plan.get(globalParaIdx) ?? null;
}
