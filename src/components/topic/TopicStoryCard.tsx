import Link from "@/components/ui/PrefetchLink";

import type { Story } from "@/lib/api/stories";
import { toMediaUrl, DEFAULT_THUMBNAIL_IMAGE } from "@/lib/images";

/**
 * One story cell in the topic-page grid — 16:9 image, blue section label,
 * headline, and a two-line excerpt (no background, no time). Matches the
 * Kannada Prabha topic-page design; the whole cell links to the story.
 */
export default function TopicStoryCard({
  story,
  priority = false,
}: {
  story: Story;
  priority?: boolean;
}) {
  const section = story.sections?.[0];
  const sectionName = section?.["display-name"] || section?.name || "";
  const image = story["hero-image-s3-key"]
    ? toMediaUrl(story["hero-image-s3-key"])
    : DEFAULT_THUMBNAIL_IMAGE;
  const excerpt = story.subheadline || story.summary || "";

  return (
    <Link
      href={`/${story.slug}`}
      className="group flex h-full flex-col gap-3 bg-transparent no-underline"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        <img
          src={image}
          alt={story.headline || ""}
          className="h-full w-full object-cover"
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
        />
      </div>

      {sectionName && (
        <span className="text-11-inter-600 uppercase tracking-wide text-3742B8">
          {sectionName}
        </span>
      )}

      <h3 className="text-16-balootamma2-700 leading-[1.4] text-111111 group-hover:text-009EF9">
        {story.headline}
      </h3>

      {excerpt && (
        <p className="line-clamp-2 text-14-inter-400 leading-[1.5] text-6F6F6F">
          {excerpt}
        </p>
      )}
    </Link>
  );
}
