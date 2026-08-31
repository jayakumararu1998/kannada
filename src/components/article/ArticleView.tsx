import type { Metadata } from "next";

import {
  getRelatedStories,
  getStoryBySlug,
  extractMetaDescription,
  type Story,
} from "@/lib/api/stories";
import { toMediaUrl } from "@/lib/images";
import { SITE_URL } from "@/lib/constants";
import { siteConfig } from "@/config/site";
import { getStore } from "@/lib/builder/store";
import ArticleRenderer from "./ArticleRenderer";
import ArticleTemplateRenderer from "./ArticleTemplateRenderer";

/** The builder template key for a story: `live-blog` when flagged, else the
 *  raw story-template (default `text`). */
function templateKey(story: Story): string {
  const t = story["story-template"] || "text";
  if (story["is-live-blog"] === true || t === "live-blog") return "live-blog";
  return t;
}

/**
 * Fetch a story by slug. Shared by the catch-all route's `generateMetadata`
 * and its page body — the underlying `fetch` is data-cached, so the two calls
 * hit Quintype once per revalidate window.
 */
export async function loadArticleStory(slug: string): Promise<Story | null> {
  return getStoryBySlug(slug);
}

/** Build article SEO metadata from a fetched story. */
export function buildArticleMetadata(story: Story, slug: string): Metadata {
  const title = story.seo?.["meta-title"] || story.headline || siteConfig.name;
  const description =
    story.seo?.["meta-description"] ||
    story.summary ||
    story.subheadline ||
    extractMetaDescription(story);
  const image = story["hero-image-s3-key"]
    ? toMediaUrl(story["hero-image-s3-key"])
    : undefined;
  const canonical = `${SITE_URL.replace(/\/+$/, "")}/${slug}`;
  const publishedTime = story["published-at"]
    ? new Date(story["published-at"]).toISOString()
    : undefined;
  const modifiedTime = (story["updated-at"] || story["last-published-at"])
    ? new Date(story["updated-at"] || story["last-published-at"]).toISOString()
    : undefined;
  const authors = (story.authors ?? [])
    .map((a: any) => a?.name)
    .filter(Boolean);

  return {
    title,
    description,
    keywords:
      story.seo?.["meta-keywords"]?.join(", ") ||
      (story.tags ?? []).map((t: any) => t.name).join(", ") ||
      undefined,
    alternates: { canonical },
    openGraph: {
      type: "article",
      siteName: siteConfig.name,
      url: canonical,
      title: story.headline,
      description,
      publishedTime,
      modifiedTime,
      authors,
      images: image ? [{ url: image, alt: story.headline }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: story.headline,
      description,
      images: image ? [image] : undefined,
    },
  };
}

/**
 * Server component: renders a fetched story. Fully builder-driven — if the
 * builder has synced an article template for this story-template, the page is
 * rendered from that template (configurable layout); otherwise it falls back to
 * the built-in default layout. Related stories are loaded in parallel.
 */
export default async function ArticleView({ story }: { story: Story }) {
  const related = await getRelatedStories(
    story.id,
    story.sections?.[0]?.id,
  ).catch(() => []);

  const template = getStore().getArticleTemplateByType(templateKey(story));
  const hasLayout =
    !!template &&
    (((template.pageJson?.sections as unknown[])?.length ?? 0) > 0 ||
      (template.sections?.length ?? 0) > 0);

  // AMP alternate — React 19 hoists this <link> into <head>.
  const ampLink = (
    <link
      rel="amphtml"
      href={`${SITE_URL.replace(/\/+$/, "")}/amp/story/${story.slug}`}
    />
  );

  if (template && hasLayout) {
    return (
      <>
        {ampLink}
        <ArticleTemplateRenderer
          story={story}
          template={template}
          relatedStories={related}
        />
      </>
    );
  }

  return (
    <>
      {ampLink}
      <ArticleRenderer story={story} relatedStories={related} />
    </>
  );
}
