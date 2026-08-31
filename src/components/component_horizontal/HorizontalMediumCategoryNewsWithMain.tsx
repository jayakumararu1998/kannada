import NextLink from "next/link";

import type { StandardNewsProps } from "@/components/news-props";
import { fieldValue } from "@/components/news-props";
import { DEFAULT_THUMBNAIL_IMAGE } from "@/lib/images";
import { cn } from "@/lib/utils";
import CardImage from "@/components/ui/CardImage";

type Props = StandardNewsProps;

const DEFAULT_IMAGE = DEFAULT_THUMBNAIL_IMAGE;

export default function HorizontalMediumCategoryNewsWithMain({
  className,
  articleHref,
  slug,
  category = { hidden: false, value: "ವಿಮರ್ಶೆ" },
  title = {
    hidden: false,
    value:
      "'ಕಾಂಗ್ರೆಸ್ ಪಕ್ಷದ ಸ್ವಾತಂತ್ರ್ಯ ಪೂರ್ವ ಹೋರಾಟದ 25 % ಕಲಿತುಕೊಂಡೆ ಖಾಕಿ ಚಡ್ಡಿ ಕರಿ ಟೋಪಿ, ಕೈಯಲ್ಲಿ ದೊಣ್ಣೆ ಹಿಡಿದವಂದೋರು ಇಂದು ಬಿಟ್ಟು ಓಡಿ ಹೋಗ್ತಾರೆ': ಬಿ ಕೆ ಹರಿಪ್ರಸಾದ್",
  },
  imageSrc = { hidden: false, value: DEFAULT_IMAGE },
  priority = false,
}: Props) {
  const imageValue = fieldValue(imageSrc) || DEFAULT_IMAGE;
  const href = articleHref || (slug ? `/${slug.replace(/^\/+/, "")}` : "#");

  return (
    <article className={cn("w-full overflow-hidden bg-transparent", className)}>
      <NextLink
        href={href}
        className={cn(
          "grid grid-cols-[44%_minmax(0,1fr)] items-stretch text-inherit no-underline sm:grid-cols-[48%_minmax(0,1fr)]",
          imageSrc.hidden &&
            "grid-cols-[minmax(0,1fr)] [@media(min-width:375px)]:grid-cols-[minmax(0,1fr)] [@media(min-width:480px)]:grid-cols-[minmax(0,1fr)] sm:grid-cols-[minmax(0,1fr)]",
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
              alt={fieldValue(title)}
              priority={priority}
            />
          </div>
        )}

        <div className="flex flex-col justify-center py-3 pl-3.5 pr-2.5 [@media(min-width:480px)]:py-3.5 [@media(min-width:480px)]:pl-[18px] [@media(min-width:480px)]:pr-3 sm:py-4 sm:pl-6 sm:pr-4">
          {!category.hidden && category.value && (
            <p
              className={cn(
                "mb-1.5 font-manrope text-xs font-bold leading-128 text-3742B8 min-480:text-13-manrope-700",
                category.customClass,
              )}
            >
              {category.value}
            </p>
          )}

          {!title.hidden && (
            <h3
              className={cn(
                "line-clamp-5 overflow-hidden font-manrope text-lg font-bold leading-122 text-333333 [@media(min-width:375px)]:text-xl min-480:text-22-manrope-700 min-480:leading-124 sm:text-25-manrope-700 sm:leading-126",
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
