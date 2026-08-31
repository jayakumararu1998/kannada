import Link from "@/components/ui/PrefetchLink";

import type { Story } from "@/lib/api/stories";
import { formatTimeAgo } from "@/lib/api/stories";
import { toMediaUrl, DEFAULT_THUMBNAIL_IMAGE } from "@/lib/images";

/**
 * One search result — horizontal card (image left, category + headline +
 * excerpt + time right). Mirrors dinamani's `HorizontalBigImageCategoryNews
 * Search` using Kannada Prabha tokens. `story` may be a raw Quintype story or a
 * filter-API item; both expose the same fields we read.
 */
export default function SearchResultCard({ story }: { story: Story }) {
  const section = story.sections?.[0];
  const category = section?.["display-name"] || section?.name || "";
  const heroKey =
    story["hero-image-s3-key"] ||
    story.alternative?.home?.default?.["hero-image"]?.["hero-image-s3-key"];
  const image = heroKey ? toMediaUrl(heroKey) : DEFAULT_THUMBNAIL_IMAGE;
  const excerpt = story.subheadline || "";
  const timeAgo = formatTimeAgo(story["published-at"]);

  return (
    <Link
      href={`/${story.slug}`}
      className="group flex flex-col gap-4 bg-transparent p-4 no-underline md:flex-row"
    >
      <div className="w-full shrink-0 md:w-[38%]">
        <div className="relative aspect-[16/9] w-full overflow-hidden md:min-h-[170px]">
          <img
            src={image}
            alt={story.headline || ""}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      </div>

      <div className="flex w-full flex-col gap-3">
        {category && (
          <span className="text-11-inter-600 uppercase tracking-wide text-3742B8">
            {category}
          </span>
        )}
        <h3 className="text-18-balootamma2-700 leading-[1.4] text-111111 group-hover:text-009EF9 md:text-16-balootamma2-700">
          {story.headline}
        </h3>
        {excerpt && (
          <p className="line-clamp-2 text-14-inter-400 leading-[1.5] text-6F6F6F">
            {excerpt}
          </p>
        )}
        {timeAgo && (
          <span className="mt-auto text-12-inter-400 text-8B95A5">
            {timeAgo}
          </span>
        )}
      </div>
    </Link>
  );
}
