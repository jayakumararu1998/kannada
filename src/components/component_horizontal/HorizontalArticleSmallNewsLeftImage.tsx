import NextLink from "next/link";

import type { StandardNewsProps } from "@/components/news-props";
import { fieldValue } from "@/components/news-props";
import { DEFAULT_THUMBNAIL_IMAGE } from "@/lib/images";
import { humanTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import CardImage from "@/components/ui/CardImage";

type Props = StandardNewsProps;

const DEFAULT_IMAGE = DEFAULT_THUMBNAIL_IMAGE;

export default function HorizontalArticleSmallNewsLeftImage({
  className,
  articleHref,
  slug,
  title = {
    hidden: false,
    value: "ಹಿಮಾಚಲದಲ್ಲಿ ಭಕ್ತರ ಉಲಿಂಗ್ ಅಮೆರಿಕ್ಯಲಿಯು ಡಂಬೋಸ್ಸಿ ಘುನ್ನಿಸ್ಟರ್ ಮಲ್ಟರ್.",
  },
  excerpt = {
    hidden: false,
    value: "ಹಿಮಾಚಲದಲ್ಲಿ ಭಕ್ತರ ಉಲಿಂಗ್ ಅಮೆರಿಕ್ಯಲಿಯು ಡಂಬೋಸ್ಸಿ ಘುನ್ನಿಸ್ಟರ್ ಮಲ್ಟರ್.",
  },
  timeAgo = { hidden: false, value: "2 ಗಂಟೆಗಳ ಹಿಂದೆ" },
  imageSrc = { hidden: false, value: DEFAULT_IMAGE },
  priority = false,
}: Props) {
  const imageValue = fieldValue(imageSrc) || DEFAULT_IMAGE;
  const titleValue = fieldValue(title);
  const excerptValue = fieldValue(excerpt);
  // Always render a human-readable time, even if a raw timestamp/ISO slips in.
  const timeAgoValue = humanTime(fieldValue(timeAgo));
  const href = articleHref || (slug ? `/${slug.replace(/^\/+/, "")}` : "#");

  return (
    <article className={cn("w-full bg-transparent", className)}>
      <NextLink
        href={href}
        className={cn(
          // Mobile: vertical card (full-width image on top, text below).
          // sm and up: horizontal card (image left 36%, text right).
          "grid grid-cols-1 items-start gap-4 text-inherit no-underline sm:grid-cols-[36%_minmax(0,1fr)]",
          imageSrc.hidden && "sm:grid-cols-[minmax(0,1fr)]",
        )}
      >
        {!imageSrc.hidden && (
          <div
            className={cn(
              "w-full overflow-hidden bg-transparent",
              imageSrc.customClass,
            )}
          >
            <CardImage
              className="w-full aspect-video object-cover"
              src={imageValue}
              alt={titleValue}
              priority={priority}
            />
          </div>
        )}

        {/* Text column — correct padding matches the sibling card
            (HorizontalSmallCategoryNewsLeftImage); gap-2 spaces the heading,
            excerpt and time evenly like the other cards. */}
        <div className="flex flex-col justify-start gap-4 pt-0 sm:pt-4">
          {!title.hidden && titleValue && (
            <h3
              className={cn(
                "overflow-hidden font-balootamma2 text-[24px] font-bold leading-[1.15] text-333333",
                title.customClass,
              )}
            >
              {titleValue}
            </h3>
          )}

          {!excerpt?.hidden && excerptValue && (
            <p
              className={cn(
                "text-808080 text-15-inter-400 leading-[1.25]",
                excerpt?.customClass,
              )}
            >
              {excerptValue}
            </p>
          )}

          {!timeAgo?.hidden && timeAgoValue && (
            <div className="flex items-center gap-2 text-6D6D6D text-14-inter-400 leading-none">
              <span className={timeAgo?.customClass || ""}>{timeAgoValue}</span>
            </div>
          )}
        </div>
      </NextLink>
    </article>
  );
}
