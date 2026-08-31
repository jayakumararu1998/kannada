import LiveBlink from "@/components/ui/LiveBlink";
import type { StandardNewsProps } from "@/components/news-props";
import { fieldValue } from "@/components/news-props";
import { DEFAULT_THUMBNAIL_IMAGE } from "@/lib/images";
import { isLiveBlogValue } from "@/lib/liveBlog";
import { cn } from "@/lib/utils";
import CardImage from "@/components/ui/CardImage";

type Props = StandardNewsProps;

const FALLBACK_IMAGE = DEFAULT_THUMBNAIL_IMAGE;

export default function VerticalBigNews({
  category = {
    hidden: false,
    value: "ಬಹತ ಉಲಗ",
    customClass: "",
  },
  title = {
    hidden: false,
    value: "ಹಮಚವನ ಬಹತ ಉಲಗ ಎಮರಕಯಲಯ ಡಬಟಸಕ ಧನಲಪಪರ ಮಶಖ.",
    customClass: "",
  },
  excerpt = {
    hidden: false,
    value: "ಹಮಚವನ ಬಹತ ಉಲಗ ಎಮರಕಯಲಯ ಡಬಟಸಕ ಧನಲಪಪರ ಮಶಖ.",
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
    <article className="w-full overflow-hidden bg-transparent">
      <div className="w-full overflow-hidden bg-transparent">
        <CardImage
          className="w-full aspect-video object-cover"
          src={fieldValue(imageSrc) || FALLBACK_IMAGE}
          alt={titleValue || categoryValue || "news image"}
          priority={priority}
        />
      </div>

      <div className="bg-transparent px-4 pt-4 pb-5 sm:px-5 sm:pt-5 sm:pb-6">
        {!category?.hidden && categoryValue && (
          <div
            className={`mb-2 text-3742B8 text-12-balootamma2-600 leading-100 capitalize ${category?.customClass || ""}`}
          >
            {categoryValue}
          </div>
        )}

        {!title?.hidden && titleValue && (
          <h2
            className={cn(
              "mb-2 text-333333",
              "text-32-balootamma2-600 leading-106 capitalize",
              title?.customClass,
            )}
          >
            {isLiveBlog && <LiveBlink className="mr-1.5" />}
            {titleValue}
          </h2>
        )}

        {!excerpt?.hidden && excerptValue && (
          <p
            className={cn(
              "text-808080",
              "text-15-inter-400 leading-120 capitalize",
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
