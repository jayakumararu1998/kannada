import Link from "@/components/ui/PrefetchLink";

import type { AuthorListItem } from "@/lib/api/stories";
import { toMediaUrl, AUTHOR_AVATAR_PLACEHOLDER } from "@/lib/images";

/**
 * One author cell in the `/authors` index grid: circular avatar, name, and a
 * one-line bio snippet. The whole cell links to the author's page
 * (`/author/{slug}`). Uses Kannada Prabha design tokens.
 */
export default function AuthorCard({
  author,
  priority = false,
}: {
  author: AuthorListItem;
  priority?: boolean;
}) {
  const avatar = toMediaUrl(author.avatarUrl) || AUTHOR_AVATAR_PLACEHOLDER;
  // Collapse the multi-line bio (name / phone / email) to a short snippet.
  const bio = author.bio?.split("\n").map((l) => l.trim()).filter(Boolean)[0];

  return (
    <Link
      href={`/author/${encodeURIComponent(author.slug)}`}
      className="group flex h-full items-center gap-4 rounded-[8px] bg-F9F9F9 p-4 transition-colors hover:bg-E8E8E8"
    >
      <img
        src={avatar}
        alt={author.name}
        className="h-16 w-16 shrink-0 rounded-full object-cover"
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
      />
      <div className="min-w-0">
        <h3 className="text-16-balootamma2-600 leading-[1.4] text-111111 group-hover:text-009EF9">
          {author.name}
        </h3>
        {bio && (
          <p className="mt-1 line-clamp-2 text-12-inter-400 leading-[1.5] text-8B95A5">
            {bio}
          </p>
        )}
      </div>
    </Link>
  );
}
