import type { StandardNewsProps } from "@/components/news-props";
import { fieldValue } from "@/components/news-props";
import { DEFAULT_THUMBNAIL_IMAGE } from "@/lib/images";
import { cn } from "@/lib/utils";
import CardImage from "@/components/ui/CardImage";

type Props = StandardNewsProps;

export default function VerticalBigImageNewsCard({
  title = {
    hidden: false,
    value: "ಹಮಚವನ ಬಹತ ಉಲಗ ಎಮರಕಯಲಯ ಡಬಟಸಕ ಧನಲಪಪರ.",
    customClass: "",
  },
  excerpt = {
    hidden: false,
    value: "ಹಮಚವನ ಬಹತ ಉಲಗ ಎಮರಕಯಲಯ ಡಬಟಸಕ ಧನಲಪಪರ.",
    customClass: "",
  },
  imageSrc,
  priority = false,
}: Props) {
  const titleValue = fieldValue(title);
  const excerptValue = fieldValue(excerpt);

  return (
    <article className="w-full overflow-hidden bg-transparent p-4">
      <div className="w-full overflow-hidden bg-transparent">
        <CardImage
          className="w-full aspect-video object-cover"
          src={fieldValue(imageSrc) || DEFAULT_THUMBNAIL_IMAGE}
          alt={titleValue || excerptValue || "news image"}
          priority={priority}
        />
      </div>

      <div className="bg-transparent pt-4">
        {!title?.hidden && titleValue && (
          <h2
            className={cn(
              "text-333333 text-32-balootamma2-600 leading-[1.12]",
              title?.customClass,
            )}
          >
            {titleValue}
          </h2>
        )}

        {!excerpt?.hidden && excerptValue && (
          <p
            className={cn(
              "mt-1 text-808080 text-15-inter-400 leading-[1.25]",
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
