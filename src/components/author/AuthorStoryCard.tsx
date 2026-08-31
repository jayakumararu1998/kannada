import Link from "@/components/ui/PrefetchLink";

import type { Story } from "@/lib/api/stories";
import { toMediaUrl, DEFAULT_THUMBNAIL_IMAGE } from "@/lib/images";

/**
 * One story cell in the author-page grid — horizontal layout: image on the
 * left, a blue section label + headline on the right. Matches the author-page
 * design (distinct from the vertical topic card).
 */
export default function AuthorStoryCard({
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

  return (
    <Link
      href={`/${story.slug}`}
      className="group flex min-w-0 gap-3 no-underline"
    >
      <div className="aspect-[4/3] w-[110px] shrink-0 overflow-hidden sm:w-[130px]">
        <img
          src={image}
          alt={story.headline || ""}
          className="h-full w-full object-cover"
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {sectionName && (
          <span className="truncate text-11-inter-600 uppercase tracking-wide text-3742B8">
            {sectionName}
          </span>
        )}
        <h3 className="line-clamp-3 break-words text-15-balootamma2-600 leading-[1.4] text-111111 group-hover:text-009EF9">
          {story.headline}
        </h3>
      </div>
    </Link>
  );
}
