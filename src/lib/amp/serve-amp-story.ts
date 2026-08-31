import "server-only";
import { NextResponse } from "next/server";

import { getRelatedStories, getStoryBySlug } from "@/lib/api/stories";
import { getStore } from "@/lib/builder/store";
import { getHeaderMenu } from "@/lib/builder/menu";
import {
  buildAmpDocument,
  findCommentsDisclaimer,
  type AmpNavItem,
} from "@/lib/amp/build-amp";
import { buildAmpWebStory, isWebStoryArticle } from "@/lib/amp/build-web-story";
import { SITE_URL } from "@/lib/constants";

/** Map the builder header NavItem tree to the AMP header's shape. */
function toAmpNav(items: any[]): AmpNavItem[] {
  return (items ?? []).map((it) => ({
    title: it.title,
    url: it.url || "#",
    children: it.children?.length ? toAmpNav(it.children) : undefined,
  }));
}

/** Same builder template key resolution as the HTML article page. */
function templateKey(story: any): string {
  const t = story["story-template"] || "text";
  if (story["is-live-blog"] === true || t === "live-blog") return "live-blog";
  return t;
}

const AMP_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
} as const;

/**
 * Shared AMP renderer for a story slug. Web/visual stories → a full-screen
 * `<amp-story>` (Google Web Stories); everything else → the AMP article layout.
 * Used by BOTH `/amp/story/<slug>` and the public `/ampstories/<slug>` route.
 *
 *  - `ampUrl` is this AMP document's own URL (used for share links etc.).
 *  - `canonicalUrl` is the canonical page this AMP doc represents. For a web
 *    story the amp page IS canonical (pass the ampstories URL); for an AMP
 *    article alternate, pass the HTML article URL.
 */
export async function serveAmpStory(
  slugPath: string,
  ampUrl: string,
  canonicalUrl: string,
): Promise<NextResponse> {
  if (!slugPath) return new NextResponse("Not found", { status: 404 });

  const story = await getStoryBySlug(slugPath);
  if (!story) return new NextResponse("Story not found", { status: 404 });

  if (isWebStoryArticle(story, slugPath)) {
    const html = buildAmpWebStory({ story, canonicalUrl, ampUrl });
    return new NextResponse(html, { status: 200, headers: AMP_HEADERS });
  }

  const related = await getRelatedStories(story.id, story.sections?.[0]?.id).catch(
    () => [],
  );
  const store = getStore();
  const html = buildAmpDocument({
    story,
    template: store.getArticleTemplateByType(templateKey(story), "amp"),
    related,
    menu: toAmpNav(getHeaderMenu()),
    adCodes: store.getAdCodes(),
    vuukle: store.getVuukleSettings(),
    taboola: store.getTaboolaSettings(),
    canonicalUrl,
    ampUrl,
    // AMP-variant templates usually leave the comments component's props empty;
    // reuse the HTML template's authored disclaimer so both pages match.
    fallbackDisclaimer: findCommentsDisclaimer(
      store.getArticleTemplateByType(templateKey(story), "default"),
    ),
  });
  return new NextResponse(html, { status: 200, headers: AMP_HEADERS });
}

export const AMP_BASE = () => SITE_URL.replace(/\/+$/, "");
