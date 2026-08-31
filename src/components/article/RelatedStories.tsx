import Link from "@/components/ui/PrefetchLink";

import type { Story } from "@/lib/api/stories";
import { mediaThumb, toMediaUrl } from "@/lib/images";

/** "Related" rail — server-rendered from stories the page already fetched.
 *  Shows up to 4 stories (image + headline only — no category/time), and is NOT
 *  sticky (the sidebar's Taboola right-rail is the sticky element instead). */
export default function RelatedStories({
  stories,
}: {
  stories: Story[];
  /** Kept for API compatibility; the category badge is no longer rendered. */
  category?: string;
}) {
  const list = (stories ?? []).filter((s: any) => s?.slug).slice(0, 4);
  if (list.length === 0) return null;

  return (
    <aside>
      <h2 className="pb-2 text-18-balootamma2-700 text-1E1E1E">
        ಸಂಬಂಧಿತ ಸುದ್ದಿಗಳು
      </h2>
      <ul>
        {list.map((s: any, i: number) => {
          const img = s["hero-image-s3-key"];
          return (
            <li key={s.slug || i}>
              <Link
                href={`/${s.slug}`}
                className="flex gap-3 py-3 transition-colors hover:bg-F9F9F9"
              >
                {img && (
                  <div className="h-[64px] w-[96px] flex-shrink-0 overflow-hidden rounded">
                    <img
                      src={mediaThumb(img, 200, 70)}
                      alt={s.headline || ""}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="line-clamp-3 text-14-balootamma2-600 leading-snug text-333333">
                    {s.headline}
                  </h3>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
