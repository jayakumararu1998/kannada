import NextLink from "next/link";

import type { StandardNewsProps } from "@/components/news-props";
import { fieldValue } from "@/components/news-props";
import { DEFAULT_THUMBNAIL_IMAGE } from "@/lib/images";
import { cn } from "@/lib/utils";
import CardImage from "@/components/ui/CardImage";

type Props = StandardNewsProps;

const DEFAULT_IMAGE = DEFAULT_THUMBNAIL_IMAGE;

export default function HorizontalSmallVideoNewsWithMain({
  className,
  articleHref,
  slug,
  title = {
    hidden: false,
    value:
      "ವ್ಹೀಲ್ಚೇರ್ ಚಾಂಪಿಯನ್‌ಷಿಪ್ ಗೆ ಕೆಳಗೆ ನೀರಿನ ಧುಮುಕುವುದು ಪ್ರಕಾರ ಕನಸನ ಮೋದಿ ಕವಿತಾ.",
  },
  imageSrc = { hidden: false, value: DEFAULT_IMAGE },
  priority = false,
}: Props) {
  const imageValue = fieldValue(imageSrc) || DEFAULT_IMAGE;
  const href = articleHref || (slug ? `/${slug.replace(/^\/+/, "")}` : "#");

  return (
    <article className={cn("w-full bg-transparent", className)}>
      <NextLink
        href={href}
        className={cn(
          "grid grid-cols-[38%_minmax(0,1fr)] text-inherit no-underline",
          imageSrc.hidden &&
            "grid-cols-[minmax(0,1fr)] [@media(min-width:480px)]:grid-cols-[minmax(0,1fr)]",
        )}
      >
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
              alt={fieldValue(title)}
              priority={priority}
            />
            <span
              className="absolute bottom-[11px] left-3.5 flex items-center justify-center rounded-full border-2 border-white/90 p-2 text-FFFFFF [@media(min-width:480px)]:bottom-2.5 [@media(min-width:480px)]:left-4"
              aria-label="Play video"
              role="img"
            >
              <svg
                className="ml-[3px] text-14-manrope-400"
                viewBox="0 0 12 14"
                width="1em"
                height="1em"
                aria-hidden="true"
              >
                <path d="M12 7L0 14V0L12 7Z" fill="currentColor" />
              </svg>
            </span>
          </div>
        )}

        <div className="flex items-start bg-transparent py-2.5 pl-[15px] pr-[13px] [@media(min-width:480px)]:py-[15px] [@media(min-width:480px)]:pb-3.5 [@media(min-width:480px)]:pl-[25px] [@media(min-width:480px)]:pr-6">
          {!title.hidden && (
            <h3
              className={cn(
                "line-clamp-3 overflow-hidden font-balootamma2 text-base font-bold leading-122 text-333333 min-480:text-22-balootamma2-700",
                title.customClass,
              )}
            >
              {title.value}
            </h3>
          )}
        </div>
      </NextLink>
    </article>
  );
}
