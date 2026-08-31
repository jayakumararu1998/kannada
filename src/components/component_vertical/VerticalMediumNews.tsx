import type { StandardNewsProps } from "@/components/news-props";
import { fieldValue } from "@/components/news-props";
import { DEFAULT_THUMBNAIL_IMAGE } from "@/lib/images";
import { cn } from "@/lib/utils";
import CardImage from "@/components/ui/CardImage";

type Props = StandardNewsProps;

const FALLBACK_IMAGE = DEFAULT_THUMBNAIL_IMAGE;

export default function VerticalMediumNews({
  category = {
    hidden: false,
    value: "ಸನಮ ಸದದ (ಸನಮ)",
    customClass: "",
  },
  title = {
    hidden: false,
    value: "ಪಲಕಯಟರ ಚಹರಕಯಪ ಕಳಗ ನರಣಯ ಧಮಕವದ ಪರಕರ",
    customClass: "",
  },
  imageSrc,
  priority = false,
  className,
}: Props) {
  const categoryValue = fieldValue(category);
  const titleValue = fieldValue(title);

  return (
    <article className={cn("w-full overflow-hidden bg-transparent", className)}>
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
            className={`mb-2 text-3742B8 text-12-inter-600 leading-[1.2] ${
              category?.customClass || ""
            }`}
          >
            {categoryValue}
          </div>
        )}

        {!title?.hidden && titleValue && (
          <h3
            className={`text-333333 text-16-manrope-700 leading-[1.25] ${
              title?.customClass || ""
            }`}
          >
            {titleValue}
          </h3>
        )}
      </div>
    </article>
  );
}
