import LiveBlink from "@/components/ui/LiveBlink";
import type { StandardNewsProps } from "@/components/news-props";
import { fieldValue } from "@/components/news-props";
import { DEFAULT_THUMBNAIL_IMAGE } from "@/lib/images";
import { isLiveBlogValue } from "@/lib/liveBlog";
import { cn } from "@/lib/utils";
import CardImage from "@/components/ui/CardImage";

type Props = StandardNewsProps;

const FALLBACK_IMAGE = DEFAULT_THUMBNAIL_IMAGE;

export default function VerticalMediumCategoryTitleNews({
  category = {
    hidden: false,
    value: "ಎಮರಕಯ,",
    customClass: "",
  },
  title = {
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
  const isLiveBlog =
    isLiveBlogValue(fieldValue(templatetype)) ||
    isLiveBlogValue(fieldValue(isliveblog));

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

      <div className="rounded-bl-[10px] rounded-br-[10px] bg-transparent px-4 pt-4 pb-5">
        {!category?.hidden && categoryValue && (
          <div
            className={`mb-2 text-3742B8 text-12-inter-600 uppercase leading-100 tracking-[0.52px] ${category?.customClass || ""}`}
          >
            {categoryValue}
          </div>
        )}

        {!title?.hidden && titleValue && (
          <h3
            className={cn(
              "text-333333 text-24-manrope-700 capitalize leading-120",
              title?.customClass,
            )}
          >
            {isLiveBlog && <LiveBlink className="mr-1.5" />}
            {titleValue}
          </h3>
        )}
      </div>
    </article>
  );
}
