import type { StandardNewsProps } from "@/components/news-props";
import { fieldValue } from "@/components/news-props";
import { DEFAULT_THUMBNAIL_IMAGE } from "@/lib/images";
import { cn } from "@/lib/utils";
import CardImage from "@/components/ui/CardImage";

type Props = StandardNewsProps;

const FALLBACK_IMAGE = DEFAULT_THUMBNAIL_IMAGE;

export default function VerticalSmallImageNews({
  category = {
    hidden: false,
    value: "ಎಮರಕಯ,",
    customClass: "",
  },
  excerpt = {
    hidden: false,
    value: "ಪಲಕಯಟರ ಚಹರಕಯಪ ಕಳಗ ನರಣಯ ಧಮಕವದ ಪರಕರ ಕಸನಸ ಮಡ ಕವತರ.",
    customClass: "",
  },
  imageSrc,
  priority = false,
}: Props) {
  const categoryValue = fieldValue(category);
  const excerptValue = fieldValue(excerpt);

  return (
    <article className="flex w-full flex-col gap-[15px] overflow-hidden bg-transparent">
      <div className="w-full overflow-hidden bg-transparent">
        <CardImage
          className="w-full aspect-video object-cover"
          src={fieldValue(imageSrc) || FALLBACK_IMAGE}
          alt={excerptValue || categoryValue || "news image"}
          priority={priority}
        />
      </div>

      <div className="flex flex-col gap-[15px] bg-transparent">
        {!category?.hidden && categoryValue && (
          <div
            className={cn(
              "text-12-inter-600 leading-110 text-3742B8",
              category?.customClass,
            )}
          >
            {categoryValue}
          </div>
        )}

        {!excerpt?.hidden && excerptValue && (
          <p
            className={cn(
              "text-18-manrope-700 font-bold leading-120 tracking-[0] align-middle capitalize text-4F4F4F",
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
