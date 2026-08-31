import LiveBlink from "@/components/ui/LiveBlink";
import type { StandardNewsProps } from "@/components/news-props";
import { fieldValue } from "@/components/news-props";
import { DEFAULT_THUMBNAIL_IMAGE } from "@/lib/images";
import { isLiveBlogValue } from "@/lib/liveBlog";
import { cn } from "@/lib/utils";
import CardImage from "@/components/ui/CardImage";

type Props = StandardNewsProps;

const FALLBACK_IMAGE = DEFAULT_THUMBNAIL_IMAGE;

export default function VerticalMediumCategoryNewsPara({
  category = {
    hidden: false,
    value: "ಎಮರಕಯ",
    customClass: "",
  },
  title = {
    hidden: false,
    value:
      "ಪೈಲೋಕ್ಯೂಟರ್ ಚಾಹಿರ್ಕ್ಯಪಿ ಕೆಳಗೆ ನಿರ್ಣಯ ಧುಮುಕುವುದು ಪ್ರಕಾರ ಕಸನಸ ಮೋಡಿ ಕವಿತ್ರಾ.",
    customClass: "",
  },
  excerpt = {
    hidden: false,
    value:
      "ಪೈಲೋಕ್ಯೂಟರ್ ಚಾಹಿರ್ಕ್ಯಪಿ ಕೆಳಗೆ ನಿರ್ಣಯ ಧುಮುಕುವುದು ಪ್ರಕಾರ ಕಸನಸ ಮೋಡಿ ಕವಿತ್ರಾ.",
    customClass: "",
  },
  imageSrc,
  priority = false,
  templatetype = { hidden: false, value: "" },
  isliveblog = { hidden: false, value: "" },
}: Props) {
  const categoryValue = fieldValue(category);
  const titleValue = fieldValue(title);
  const excerptValue = fieldValue(excerpt);
  const isLiveBlog =
    isLiveBlogValue(fieldValue(templatetype)) ||
    isLiveBlogValue(fieldValue(isliveblog));

  return (
    <article className="flex w-full flex-col gap-[15px] overflow-hidden bg-transparent">
      <div className="w-full overflow-hidden bg-transparent">
        <CardImage
          className="w-full aspect-video object-cover"
          src={fieldValue(imageSrc) || FALLBACK_IMAGE}
          alt={titleValue || categoryValue || "news image"}
          priority={priority}
        />
      </div>

      <div className="flex flex-col gap-[15px] bg-transparent">
        {!category?.hidden && categoryValue && (
          <div
            className={`text-3742B8 text-12-inter-600 uppercase leading-100 tracking-[0.52px] ${category?.customClass || ""}`}
          >
            {categoryValue}
          </div>
        )}

        {!title?.hidden && titleValue && (
          <h3
            className={cn(
              "text-333333 text-16-manrope-700 capitalize leading-140 align-middle",
              title?.customClass,
            )}
          >
            {isLiveBlog && <LiveBlink className="mr-1.5" />}
            {titleValue}
          </h3>
        )}

        {!excerpt?.hidden && excerptValue && (
          <p
            className={cn(
              "text-808080 text-14-inter-400 capitalize leading-120",
              excerpt?.customClass,
            )}
          >
            {excerptValue}
          </p>
        )}
      </div>
    </article>
  );
}
