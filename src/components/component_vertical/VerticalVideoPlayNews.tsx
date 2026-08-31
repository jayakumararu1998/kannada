import NextLink from "next/link";

import type { StandardNewsProps, FieldConfig } from "@/components/news-props";
import { fieldValue } from "@/components/news-props";
import { DEFAULT_THUMBNAIL_IMAGE } from "@/lib/images";
import { cn } from "@/lib/utils";
import CardImage from "@/components/ui/CardImage";

export type VerticalVideoPlayNewsFieldConfig = FieldConfig;

export type VerticalVideoPlayNewsProps = StandardNewsProps;

const DEFAULT_IMAGE = DEFAULT_THUMBNAIL_IMAGE;

export default function VerticalVideoPlayNews({
  className,
  articleHref,
  slug,
  category = { hidden: false, value: "ವಿಮರ್ಶೆ" },
  title = {
    hidden: false,
    value: "ಜೇಟೋಸ್ಯ್ಕಾರ್ ಚಾಂಪ್ಯನ್ಷಿಪ್ ಕ್ಕೆಗೆ ನೀರಿನ ಧುಮುಕುವುದು ದುಷ್ಕಾರ",
  },
  imageSrc = { hidden: false, value: DEFAULT_IMAGE },
  priority = false,
}: VerticalVideoPlayNewsProps) {
  const imageValue = fieldValue(imageSrc) || DEFAULT_IMAGE;
  const titleValue = fieldValue(title);
  const categoryValue = fieldValue(category);
  const href = articleHref || (slug ? `/${slug.replace(/^\/+/, "")}` : "#");

  return (
    <article className={cn("w-full overflow-hidden bg-transparent", className)}>
      <NextLink href={href} className="block text-inherit no-underline">
        {!imageSrc.hidden && (
          <div
            className={cn(
              "relative w-full overflow-hidden bg-transparent",
              imageSrc.customClass,
            )}
          >
            <CardImage
              className="w-full aspect-video object-cover"
              src={imageValue}
              alt={titleValue || "Video news thumbnail"}
              priority={priority}
            />

            <span
              className="absolute left-1/2 top-1/2 flex h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[7px] border-white/90 bg-[rgba(0,0,0,0.2)] text-FFFFFF"
              aria-label="Play video"
              role="img"
            >
              <svg
                className="ml-1 h-7 w-7"
                viewBox="0 0 16 18"
                fill="none"
                aria-hidden="true"
              >
                <path d="M16 9L0 18V0L16 9Z" fill="currentColor" />
              </svg>
            </span>
          </div>
        )}

        <div className="px-4 py-4">
          {!category.hidden && categoryValue && (
            <p
              className={cn(
                "mb-2 text-12-inter-600 leading-100 text-3742B8",
                category.customClass,
              )}
            >
              {categoryValue}
            </p>
          )}

          {!title.hidden && titleValue && (
            <h3
              className={cn(
                "line-clamp-3 overflow-hidden text-18-balootamma2-700 leading-122 text-333333",
                title.customClass,
              )}
            >
              {titleValue}
            </h3>
          )}
        </div>
      </NextLink>
    </article>
  );
}
