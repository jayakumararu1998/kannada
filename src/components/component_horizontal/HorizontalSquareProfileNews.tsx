import NextLink from "next/link";

import type { StandardNewsProps } from "@/components/news-props";
import { fieldValue } from "@/components/news-props";
import { DEFAULT_THUMBNAIL_IMAGE } from "@/lib/images";
import { cn } from "@/lib/utils";
import CardImage from "@/components/ui/CardImage";

type Props = StandardNewsProps;

const DEFAULT_IMAGE = DEFAULT_THUMBNAIL_IMAGE;

export default function HorizontalSquareProfileNews({
  className,
  articleHref,
  slug,
  category = { hidden: false, value: "ವಿಮರ್ಶೆ" },
  title = {
    hidden: false,
    value: "ಮಮತಾ ಸುರೇಶ್ ತಿಲವರ ಕಾಂಗ್ರೆಸ್ ಪಕ್ಷವು ನಾಯಕತ್ವ ವರ್ಗಾವಣೆಗೊಂಡು",
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
          "grid grid-cols-[36%_minmax(0,1fr)] text-inherit no-underline",
          imageSrc.hidden && "grid-cols-[minmax(0,1fr)]",
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
              className="w-full aspect-square object-cover"
              src={imageValue}
              alt={fieldValue(title)}
              priority={priority}
            />
          </div>
        )}

        <div className="flex min-w-0 flex-col justify-start py-2.5 pl-4 pr-2 [@media(min-width:480px)]:pl-[22px]">
          {!category.hidden && category.value && (
            <p
              className={cn(
                "mb-2 text-12-inter-600 leading-100 text-3742B8",
                category.customClass,
              )}
            >
              {category.value}
            </p>
          )}

          {!title.hidden && title.value && (
            <h3
              className={cn(
                "line-clamp-3 overflow-hidden text-16-manrope-700 leading-120 text-333333",
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
