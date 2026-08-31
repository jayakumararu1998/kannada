import NextLink from "next/link";

import type { StandardNewsProps } from "@/components/news-props";
import { fieldValue } from "@/components/news-props";
import { DEFAULT_THUMBNAIL_IMAGE } from "@/lib/images";
import { cn } from "@/lib/utils";
import CardImage from "@/components/ui/CardImage";

type Props = StandardNewsProps;

const DEFAULT_IMAGE = DEFAULT_THUMBNAIL_IMAGE;

export default function HorizontalSmallCategoryNews({
  className,
  articleHref,
  slug,
  category = { hidden: false, value: "ವಿಶ್ವಕಪ್" },
  title = {
    hidden: false,
    value: "ಹಿಮಾಚಲದಲ್ಲಿ ಭಕ್ತರ ಉಲಿಂಗ್ ಅಮೆರಿಕ್ಯಲಿಯು ಡಂಬೋಸ್ಸಿ ಘುನ್ನಿಸ್ಟರ್.",
  },
  excerpt = {
    hidden: false,
    value:
      "ಬೆಂಗಳೂರು: ಮುಖ್ಯಮಂತ್ರಿ ಡಿಕೆ ಶಿವಕುಮಾರ್ ಅವರು ರಾಜ್ಯದ ಜನತೆಗೆ ತಿಳಿಗೊಳಿಸಿದ ತುರ್ತು ಪರಿಸ್ಥಿತಿ ಮತ್ತು ಪ್ರಮುಖ ನಿರ್ವಹಣೆಗೆ ತಾತ್ಕಾಲಿಕ ಜಿಲ್ಲಾ ಉಸ್ತುವಾರಿ ಜವಾಬ್ದಾರಿ ಹಂಚಿಕೆ ಮಾಡಿದ್ದಾರೆ.",
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
          "grid grid-cols-[44%_minmax(0,1fr)] text-inherit no-underline md:grid-cols-[48%_minmax(0,1fr)]",
          imageSrc.hidden &&
            "grid-cols-[minmax(0,1fr)] [@media(min-width:480px)]:grid-cols-[minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)]",
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

        <div className="flex flex-col justify-start py-3 pl-5 pr-3 md:pl-[22px]">
          {!category.hidden && category.value && (
            <p
              className={cn(
                "mb-2.5 font-inter text-xs font-semibold leading-none text-3742B8",
                category.customClass,
              )}
            >
              {category.value}
            </p>
          )}

          {!title.hidden && (
            <h3
              className={cn(
                "line-clamp-3 overflow-hidden font-manrope text-lg font-bold leading-119 text-000000 min-480:text-21-manrope-700 md:text-2xl",
                title.customClass,
              )}
            >
              {title.value}
            </h3>
          )}

          {!excerpt.hidden && excerpt.value && (
            <p
              className={cn(
                "mt-3 line-clamp-2 overflow-hidden font-manrope text-sm font-normal leading-128 text-333333 min-480:text-15-manrope-400 md:text-15-75-manrope-400",
                excerpt.customClass,
              )}
            >
              {excerpt.value}
            </p>
          )}
        </div>
      </NextLink>
    </article>
  );
}
