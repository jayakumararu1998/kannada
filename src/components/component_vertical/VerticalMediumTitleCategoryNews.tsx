import type { StandardNewsProps } from "@/components/news-props";
import { fieldValue } from "@/components/news-props";
import { DEFAULT_THUMBNAIL_IMAGE } from "@/lib/images";
import { cn } from "@/lib/utils";
import CardImage from "@/components/ui/CardImage";

type Props = StandardNewsProps;

const FALLBACK_IMAGE = DEFAULT_THUMBNAIL_IMAGE;

function toFieldString(value?: string): string {
  return typeof value === "string" ? value.trim() : "";
}

export default function VerticalMediumTitleCategoryNews({
  title = {
    hidden: false,
    value: "ಪಲಕಯಟರ ಚಹರಕಯಪ ಕಳಗ ನರಣಯ ಧಮಕವದ ಪರಕರ ಕಸನಸ ಮಡ ಕವತರ.",
    customClass: "",
  },
  category = {
    hidden: false,
    value: "ಎಮರಕಯ",
    customClass: "",
  },
  imageSrc,
  priority = false,
  className,
}: Props) {
  const titleValue = toFieldString(title?.value);
  const categoryValue = toFieldString(category?.value);

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

      <div className="bg-transparent pt-3">
        {!title?.hidden && titleValue && (
          <h3
            className={`text-333333 text-16-manrope-700 leading-[1.2] ${
              title?.customClass || ""
            }`}
          >
            {titleValue}
          </h3>
        )}

        {!category?.hidden && categoryValue && (
          <div
            className={`mt-2 text-3742B8 text-12-inter-600 leading-[1.2] ${
              category?.customClass || ""
            }`}
          >
            {categoryValue}
          </div>
        )}
      </div>
    </article>
  );
}
