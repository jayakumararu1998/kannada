import NextLink from "next/link";

import type { StandardNewsProps } from "@/components/news-props";
import { fieldValue } from "@/components/news-props";
import { DEFAULT_THUMBNAIL_IMAGE } from "@/lib/images";
import { cn } from "@/lib/utils";
import CardImage from "@/components/ui/CardImage";

type Props = StandardNewsProps;

const DEFAULT_IMAGE = DEFAULT_THUMBNAIL_IMAGE;

export default function HorizontalProfileNews({
  className,
  articleHref,
  slug,
  title = { hidden: false, value: "ವಿಮರ್ಶೆ" },
  category = {
    hidden: false,
    value:
      "ಜ್ಯೋತಿಷ್ಕೋತ್ತರ ಚಾರ್ಚಡಿ ಕೇಳಿ ನಿರ್ಮಲ ಮುಖ್ಯಮಂತ್ರಿ ಪ್ರಕಾರ ಕೆಲಸ ಮಾಡಿ ಕೊತ್ತಾ.",
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
        className="grid grid-cols-[30%_minmax(0,1fr)] items-start gap-4 p-4 text-inherit no-underline [@media(min-width:480px)]:gap-[22px]"
      >
        {!imageSrc.hidden && (
          <div
            className={cn(
              "w-full overflow-hidden rounded-full bg-transparent",
              imageSrc.customClass,
            )}
          >
            <CardImage
              className="w-full aspect-square object-cover"
              src={imageValue}
              alt={fieldValue(category)}
              priority={priority}
            />
          </div>
        )}

        <div>
          {!category.hidden && category.value && (
            <p
              className={cn(
                "mb-2 inline-flex items-center bg-transparent px-2 py-1 font-inter text-xs font-semibold leading-none tracking-[0.52px] text-3742B8",
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
              {title.value}
            </h3>
          )}
        </div>
      </NextLink>
    </article>
  );
}
