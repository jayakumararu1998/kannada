import NextLink from "next/link";

import type { StandardNewsProps } from "@/components/news-props";
import { fieldValue } from "@/components/news-props";
import LiveBlink from "@/components/ui/LiveBlink";
import { DEFAULT_THUMBNAIL_IMAGE } from "@/lib/images";
import { isLiveBlogValue } from "@/lib/liveBlog";
import { cn } from "@/lib/utils";
import CardImage from "@/components/ui/CardImage";

type Props = StandardNewsProps;

const DEFAULT_IMAGE = DEFAULT_THUMBNAIL_IMAGE;

export default function HorizontalSmallCategoryNewsLeftImage({
  className,
  articleHref,
  slug,
  category = { hidden: false, value: "ವಿಮರ್ಶೆ" },
  title = {
    hidden: false,
    value:
      "ಜ್ಯೋತಿಷ್ಕೋತ್ತರ ಚಾರ್ಚಡಿ ಕೇಳಿ ನಿರ್ಮಲ ಮುಖ್ಯಮಂತ್ರಿ ಪ್ರಕಾರ ಕೆಲಸ ಮಾಡಿ ಕೊತ್ತಾ.",
  },
  imageSrc = { hidden: false, value: DEFAULT_IMAGE },
  priority = false,
  templatetype = { hidden: false, value: "" },
  isliveblog = { hidden: false, value: "" },
}: Props) {
  const imageValue = fieldValue(imageSrc) || DEFAULT_IMAGE;
  const titleValue = fieldValue(title);
  const href = articleHref || (slug ? `/${slug.replace(/^\/+/, "")}` : "#");
  const isLiveBlog =
    isLiveBlogValue(fieldValue(templatetype)) ||
    isLiveBlogValue(fieldValue(isliveblog));

  return (
    <article className={cn("w-full bg-transparent", className)}>
      <NextLink
        href={href}
        className={cn(
          "grid grid-cols-[36%_minmax(0,1fr)] text-inherit no-underline",
          imageSrc.hidden &&
            "grid-cols-[minmax(0,1fr)] [@media(min-width:375px)]:grid-cols-[minmax(0,1fr)]",
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

        <div className="flex flex-col justify-start py-2.5 pl-4 pr-2 [@media(min-width:480px)]:pl-[22px]">
          {!category.hidden && category.value && (
            <p
              className={cn(
                "mb-2 font-inter text-xs font-semibold leading-none text-3742B8",
                category.customClass,
              )}
            >
              {category.value}
            </p>
          )}

          {!title.hidden && (
            <h3
              className={cn(
                "line-clamp-3 overflow-hidden font-manrope text-base font-bold leading-120 text-333333",
                title.customClass,
              )}
            >
              {isLiveBlog && <LiveBlink className="mr-1.5" />}
              {titleValue}
            </h3>
          )}
        </div>
      </NextLink>
    </article>
  );
}
