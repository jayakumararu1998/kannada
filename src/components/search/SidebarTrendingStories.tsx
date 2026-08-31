import Link from "@/components/ui/PrefetchLink";

import type { Story } from "@/lib/api/stories";
import { toMediaUrl, DEFAULT_THUMBNAIL_IMAGE } from "@/lib/images";

/** Bullet glyph used before section/column headings across the site. */
function BulletIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 8 16"
      className="h-[16px] w-[8px] shrink-0"
      fill="none"
    >
      <circle cx="4" cy="4" r="4" fill="#FAC43B" />
      <path
        d="M8 8C8 9.06087 7.57857 10.0783 6.82843 10.8284C6.07828 11.5786 5.06087 12 4 12C2.93913 12 1.92172 11.5786 1.17157 10.8284C0.421428 10.0783 0 9.06087 0 8L8 8Z"
        fill="#3046EB"
      />
      <path
        d="M8 12C8 13.0609 7.57857 14.0783 6.82843 14.8284C6.07828 15.5786 5.06087 16 4 16C2.93913 16 1.92172 15.5786 1.17157 14.8284C0.421428 14.0783 0 13.0609 0 12L8 12Z"
        fill="#009EF9"
      />
    </svg>
  );
}

/**
 * Vertical "trending stories" list for the search sidebar — a bulleted heading
 * plus small-image news rows (section label + headline on the left, thumbnail
 * on the right). Fills the sidebar white-space the way category pages do. Pure
 * server component; the whole row links to the story.
 */
export default function SidebarTrendingStories({
  stories,
  title = "ಟ್ರೆಂಡಿಂಗ್",
}: {
  stories: Story[];
  title?: string;
}) {
  const list = (stories ?? []).filter((s) => s?.slug).slice(0, 6);
  if (list.length === 0) return null;

  return (
    <section className="w-full">
      <div className="flex items-center gap-2 pb-3">
        <BulletIcon />
        <h2 className="font-balootamma2 text-18-balootamma2-700 font-bold leading-none text-3046EB">
          {title}
        </h2>
      </div>

      <ul className="flex flex-col">
        {list.map((s, i) => {
          const section = s.sections?.[0];
          const label = section?.["display-name"] || section?.name || "";
          const image = s["hero-image-s3-key"]
            ? toMediaUrl(s["hero-image-s3-key"])
            : DEFAULT_THUMBNAIL_IMAGE;
          return (
            <li key={s.id || s.slug || i} className="border-b border-DFDFDF last:border-b-0">
              <Link
                href={`/${s.slug}`}
                className="group flex items-start gap-3 py-4 no-underline"
              >
                <div className="min-w-0 flex-1">
                  {label && (
                    <span className="mb-1 block text-11-inter-600 uppercase tracking-wide text-3742B8">
                      {label}
                    </span>
                  )}
                  <h3 className="line-clamp-3 text-14-balootamma2-600 leading-[1.4] text-333333 group-hover:text-009EF9">
                    {s.headline}
                  </h3>
                </div>
                <div className="h-[72px] w-[104px] shrink-0 overflow-hidden">
                  <img
                    src={image}
                    alt={s.headline || ""}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
