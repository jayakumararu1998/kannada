import NextLink from "next/link";

import type { StandardNewsProps } from "@/components/news-props";
import { fieldValue } from "@/components/news-props";
import { DEFAULT_THUMBNAIL_IMAGE } from "@/lib/images";
import { cn } from "@/lib/utils";
import CardImage from "@/components/ui/CardImage";

type Props = StandardNewsProps;

const DEFAULT_IMAGE = DEFAULT_THUMBNAIL_IMAGE;

export default function HorizontalCategoryNewsRightImage({
  className,
  articleHref,
  slug,
  category = { hidden: true, value: "" },
  title = {
    hidden: false,
    value:
      "Triangle Love: ವಿವಾಹಿತ ಮಹಿಳೆಗೆ ಇಬ್ಬರು ಪುರುಷರ ನಡುವೆ ಜಗಳ, ಮಚ್ಚೇಟಿನಿಂದ...",
  },
  imageSrc = { hidden: false, value: DEFAULT_IMAGE },
  priority = false,
}: Props) {
  const imageValue = fieldValue(imageSrc) || DEFAULT_IMAGE;
  const href = articleHref || (slug ? `/${slug.replace(/^\/+/, "")}` : "#");

  return (
    <article
      className={cn(
        "w-full overflow-hidden rounded-[5px] border border-[var(--color-D2D2D2)] bg-transparent",
        className,
      )}
    >
      <NextLink
        href={href}
        className={cn(
          "grid grid-cols-[minmax(0,1fr)_34%] text-inherit no-underline",
          imageSrc.hidden &&
            "grid-cols-[minmax(0,1fr)] [@media(min-width:375px)]:grid-cols-[minmax(0,1fr)] [@media(min-width:480px)]:grid-cols-[minmax(0,1fr)]",
        )}
      >
        <div className="flex flex-col justify-start py-[17px] pl-[17px] pr-2 [@media(min-width:480px)]:py-[25px] [@media(min-width:480px)]:pb-[18px]">
          {!category.hidden && category.value && (
            <p
              className={cn(
                "mb-1 text-13-manrope-700 leading-128 text-3742B8",
                category.customClass,
              )}
            >
              {category.value}
            </p>
          )}

          {!title.hidden && (
            <h3
              className={cn(
                "line-clamp-3 overflow-hidden text-17-manrope-700 leading-128 tracking-[0] text-333333 [@media(min-width:375px)]:text-lg min-480:text-19-manrope-700",
                title.customClass,
              )}
            >
              {title.value}
            </h3>
          )}
        </div>

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
              alt={fieldValue(title)}
              priority={priority}
            />
          </div>
        )}
      </NextLink>
    </article>
  );
}
