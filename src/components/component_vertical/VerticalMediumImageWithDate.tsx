import type { StandardNewsProps } from "@/components/news-props";
import { fieldValue } from "@/components/news-props";
import { DEFAULT_THUMBNAIL_IMAGE } from "@/lib/images";
import { cn } from "@/lib/utils";
import CardImage from "@/components/ui/CardImage";

type Props = StandardNewsProps;

const FALLBACK_IMAGE = DEFAULT_THUMBNAIL_IMAGE;

function ClockIcon() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full bg-transparent text-333333"
    >
      <svg className="h-[13px] w-[13px]" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 7V12L15.5 14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
      </svg>
    </span>
  );
}

export default function VerticalMediumImageWithDate({
  category = {
    hidden: false,
    value: "ಎಮಾರಾಕ್ಕು",
    customClass: "",
  },
  title = {
    hidden: false,
    value: "ಪೈಲೋರೋಟರ್ ಜಾಹಿರ್ಫೆ ತೆರಿಗೆ ನಿರಿಯ ದ್ವಮಮತಮುದ ಫಾರ ಕನಸಸೋ ಮಡಿವ.",
    customClass: "",
  },
  excerpt = {
    hidden: false,
    value: "ಪೈಲೋರೋಟರ್ ಜಾಹಿರ್ಫೆ ತೆರಿಗೆ ನಿರಿಯ ದ್ವಮಮತಮುದ ಫಾರ ಕನಸನ ಮೋಡಿ ರೆವ್ಯೂ.",
    customClass: "",
  },
  timeAgo = {
    hidden: false,
    value: "9:34 Pm, 02 Jun 2026",
    customClass: "",
  },
  imageSrc,
  priority = false,
}: Props) {
  const categoryValue = fieldValue(category);
  const titleValue = fieldValue(title);
  const excerptValue = fieldValue(excerpt);
  const timeAgoValue = fieldValue(timeAgo);

  return (
    <article className="w-full overflow-hidden bg-transparent">
      <div className="w-full overflow-hidden bg-transparent">
        <CardImage
          className="w-full aspect-video object-cover"
          src={fieldValue(imageSrc) || FALLBACK_IMAGE}
          alt={titleValue || categoryValue || "news image"}
          priority={priority}
        />
      </div>

      <div className="bg-transparent pt-4">
        {!category?.hidden && categoryValue && (
          <div
            className={`mb-2 text-3742B8 text-12-balootamma2-600 leading-[1] ${category?.customClass || ""}`}
          >
            {categoryValue}
          </div>
        )}

        {!title?.hidden && titleValue && (
          <h3
            className={cn(
              "mb-2 text-333333 text-16-manrope-700 leading-[1.3]",
              title?.customClass,
            )}
          >
            {titleValue}
          </h3>
        )}

        {!excerpt?.hidden && excerptValue && (
          <p
            className={cn(
              "text-808080 text-14-inter-400 leading-[1.25]",
              excerpt?.customClass,
            )}
          >
            {excerptValue}
          </p>
        )}

        {!timeAgo?.hidden && timeAgoValue && (
          <div className="mt-3 flex items-center gap-2 text-808080 text-14-inter-400 leading-none">
            <ClockIcon />
            <span className={timeAgo?.customClass || ""}>{timeAgoValue}</span>
          </div>
        )}
      </div>
    </article>
  );
}
