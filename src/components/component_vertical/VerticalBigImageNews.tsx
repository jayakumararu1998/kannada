import type { StandardNewsProps } from "@/components/news-props";
import { fieldValue } from "@/components/news-props";
import { DEFAULT_THUMBNAIL_IMAGE } from "@/lib/images";
import { cn } from "@/lib/utils";
import Socialicons from "@/components/ui/socialicons";
import CardImage from "@/components/ui/CardImage";

type Props = StandardNewsProps;

const FALLBACK_IMAGE = DEFAULT_THUMBNAIL_IMAGE;

export default function VerticalBigImageNews({
  excerpt = {
    hidden: false,
    value: "ಹಮಚವನ ಬಹತ ಉಲಗ ಎಮರಕಯಲಯ ಡಬಟಸಕ ಧನಲಪಪರ ಮಶಖ.",
    customClass: "",
  },
  title,
  imageSrc,
  priority = false,
}: Props) {
  const excerptValue = fieldValue(excerpt);

  return (
    <article className="w-full overflow-hidden bg-transparent p-4">
      <div className="w-full overflow-hidden bg-transparent">
        <CardImage
          className="w-full aspect-video object-cover"
          src={fieldValue(imageSrc) || FALLBACK_IMAGE}
          alt={fieldValue(title) || excerptValue || "news image"}
          priority={priority}
        />
      </div>

      {!excerpt?.hidden && excerptValue && (
        <p
          className={cn(
            "mt-3 text-808080 text-15-inter-400 leading-[1.25]",
            excerpt?.customClass,
          )}
        >
          {excerptValue}
        </p>
      )}

      <Socialicons className="mt-4" size="sm" />
    </article>
  );
}
