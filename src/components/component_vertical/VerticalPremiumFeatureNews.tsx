import NextLink from "next/link";

import type { StandardNewsProps, FieldConfig } from "@/components/news-props";
import { fieldValue } from "@/components/news-props";
import PremiumBadge from "@/components/ui/PremiumBadge";
import { DEFAULT_THUMBNAIL_IMAGE } from "@/lib/images";
import { cn } from "@/lib/utils";
import CardImage from "@/components/ui/CardImage";

export type VerticalPremiumFeatureNewsFieldConfig = FieldConfig;

export type VerticalPremiumFeatureNewsProps = StandardNewsProps;

const DEFAULT_IMAGE = DEFAULT_THUMBNAIL_IMAGE;

export default function VerticalPremiumFeatureNews({
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
}: VerticalPremiumFeatureNewsProps) {
  const imageValue = fieldValue(imageSrc) || DEFAULT_IMAGE;
  const badgeValue = fieldValue(templatetype);
  const titleValue = fieldValue(title);
  const href = articleHref || (slug ? `/${slug.replace(/^\/+/, "")}` : "#");

  return (
    <article className={cn("w-full overflow-hidden bg-transparent", className)}>
      <NextLink href={href} className="block text-inherit no-underline">
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
              alt={titleValue || "Premium news thumbnail"}
              priority={priority}
            />
          </div>
        )}

        <div className="px-[19px] pb-[29px] pt-[19px]">
          {badgeValue && (
            <PremiumBadge
              label={badgeValue}
              className={cn("mb-3", templatetype.customClass)}
            />
          )}

          {!title.hidden && titleValue && (
            <h3
              className={cn(
                "line-clamp-3 overflow-hidden text-24-balootamma2-700 leading-122 text-333333",
                title.customClass,
              )}
            >
              {titleValue}
            </h3>
          )}
        </div>
      </NextLink>
    </article>
  );
}
