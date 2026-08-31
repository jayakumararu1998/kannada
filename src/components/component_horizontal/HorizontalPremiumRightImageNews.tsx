import NextLink from "next/link";

import type { StandardNewsProps } from "@/components/news-props";
import { fieldValue } from "@/components/news-props";
import PremiumBadge from "@/components/ui/PremiumBadge";
import { DEFAULT_THUMBNAIL_IMAGE } from "@/lib/images";
import { cn } from "@/lib/utils";
import CardImage from "@/components/ui/CardImage";

type Props = StandardNewsProps;

const DEFAULT_IMAGE = DEFAULT_THUMBNAIL_IMAGE;

export default function HorizontalPremiumRightImageNews({
  className,
  articleHref,
  slug,
  templatetype = { hidden: false, value: "Premium" },
  title = {
    hidden: false,
    value: "ಹಿಮೋಜಿನಿ ಬ್ಲಾಕ್ ಉಲಿಂಗ್ ಎಮಾರಾಕ್ಷಲಿಯಾ ಡಂಬಟೋಸ್ಕೆ ಧುಸ್ಸಿಫ್.",
  },
  imageSrc = { hidden: false, value: DEFAULT_IMAGE },
  priority = false,
}: Props) {
  const imageValue = fieldValue(imageSrc) || DEFAULT_IMAGE;
  const badgeLabel = fieldValue(templatetype);
  const href = articleHref || (slug ? `/${slug.replace(/^\/+/, "")}` : "#");

  return (
    <article className={cn("w-full overflow-hidden bg-transparent", className)}>
      <NextLink
        href={href}
        className={cn(
          "grid grid-cols-[minmax(0,1fr)_36%] text-inherit no-underline",
          imageSrc.hidden && "grid-cols-[minmax(0,1fr)]",
        )}
      >
        <div className="flex min-w-0 flex-col justify-start py-2 pl-4 pr-3 [@media(min-width:480px)]:pl-[32px]">
          {!templatetype.hidden && badgeLabel && (
            <PremiumBadge
              label={badgeLabel}
              className={cn("mb-[7px] self-start", templatetype.customClass)}
            />
          )}

          {!title.hidden && title.value && (
            <h3
              className={cn(
                "line-clamp-3 overflow-hidden text-16-balootamma2-700 leading-122 text-333333",
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
