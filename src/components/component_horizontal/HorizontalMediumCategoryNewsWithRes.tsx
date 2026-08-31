import NextLink from "next/link";

import type { StandardNewsProps } from "@/components/news-props";
import { fieldValue } from "@/components/news-props";
import { DEFAULT_THUMBNAIL_IMAGE } from "@/lib/images";
import { cn } from "@/lib/utils";
import CardImage from "@/components/ui/CardImage";

type Props = StandardNewsProps;

const DEFAULT_IMAGE = DEFAULT_THUMBNAIL_IMAGE;

export default function HorizontalMediumCategoryNewsWithRes({
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
          "flex flex-col text-inherit no-underline md:grid md:grid-cols-[48%_minmax(0,1fr)] md:items-stretch",
          imageSrc.hidden && "md:grid-cols-[minmax(0,1fr)]",
        )}
      >
        {!imageSrc.hidden && (
          <div
            className={cn(
              "order-1 w-full overflow-hidden bg-transparent md:order-1",
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

        <div className="order-2 flex flex-col justify-center pb-3 [@media(min-width:480px)]:pb-3.5 md:order-2 md:py-4 md:pl-6 md:pr-4">
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
