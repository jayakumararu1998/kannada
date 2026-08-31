import type { Story } from "@/lib/api/stories";
import { HERO_SIZES, heroSrcSet, mediaThumb, toMediaUrl } from "@/lib/images";
import ArticleHero from "./ArticleHero";
import ArticleBody from "./ArticleBody";
import ArticleLiveBlog from "./ArticleLiveBlog";
import ArticleTags from "./ArticleTags";
import RelatedStories from "./RelatedStories";
import RawEmbed from "./elements/RawEmbed";
import YouTubeEmbed from "./elements/YouTubeEmbed";

/**
 * Top-level article layout. Dispatches on `story-template`:
 *
 *  - text / syndicated / interview / listicle / question-and-answer / photo:
 *    hero (with hero image) → body. The distinct visual treatments for
 *    listicle numbering, Q&A cards, photo galleries, etc. are already encoded
 *    in the story-elements themselves and rendered by ArticleBody.
 *  - video / gumlet-video: lead with the story-level video (YouTube facade or
 *    raw embed) instead of a static hero image, then body.
 *
 * `live-blog` currently renders as text (chronological cards) — server-rendered
 * snapshot; live polling is intentionally out of scope for this port.
 */

const VIDEO_TEMPLATES = new Set(["video", "gumlet-video"]);

function StoryLevelVideo({
  story,
  heroImageUrl,
}: {
  story: Story;
  heroImageUrl?: string;
}) {
  if (story["embed-url"]) {
    return (
      <div className="pt-4">
        <YouTubeEmbed
          embedUrl={story["embed-url"]}
          thumbnailUrl={heroImageUrl}
          title={story.headline}
        />
      </div>
    );
  }
  if (story["embed-js"]) {
    return (
      <div className="pt-4">
        <RawEmbed embedJs={story["embed-js"]} />
      </div>
    );
  }
  return null;
}

export default function ArticleRenderer({
  story,
  relatedStories = [],
}: {
  story: Story;
  relatedStories?: Story[];
}) {
  const template = story["story-template"] || "text";
  const isVideo = VIDEO_TEMPLATES.has(template);
  const isLiveBlog =
    story["is-live-blog"] === true || template === "live-blog";
  const heroImageUrl = story["hero-image-s3-key"]
    ? toMediaUrl(story["hero-image-s3-key"])
    : undefined;
  const category = story?.sections?.[0]?.name?.trim();

  return (
    <article className="w-full px-4 py-6 sm:px-6 lg:px-[60px]">
      {/* LCP: preload the hero image so the browser fetches it during HTML
          parse. React 19 hoists this <link> into <head> and de-dupes it. */}
      {/* Must be the SAME variant set the hero <img> renders (srcset/sizes
          identical) or the preload double-downloads a second variant. */}
      {heroImageUrl && !isVideo && (
        <link
          rel="preload"
          as="image"
          href={mediaThumb(heroImageUrl, 1200, 75)}
          imageSrcSet={heroSrcSet(heroImageUrl)}
          imageSizes={HERO_SIZES}
          fetchPriority="high"
        />
      )}

      {/* Full-width, borderless layout matching the builder homepage: no outer
          box/border, no column divider — just gap-8 between main and sidebar. */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Main column */}
        <div className="lg:col-span-8">
          {isVideo && (
            <StoryLevelVideo story={story} heroImageUrl={heroImageUrl} />
          )}
          <ArticleHero
            story={story}
            heroImageUrl={heroImageUrl}
            showHeroImage={!isVideo}
          />
          <div className="py-6">
            {isLiveBlog ? (
              <ArticleLiveBlog story={story} heroImageUrl={heroImageUrl} />
            ) : (
              <ArticleBody story={story} heroImageUrl={heroImageUrl} />
            )}
          </div>
          <ArticleTags story={story} />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4">
          <RelatedStories stories={relatedStories} category={category} />
        </div>
      </div>
    </article>
  );
}
