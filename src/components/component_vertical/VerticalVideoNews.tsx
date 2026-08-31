import type { StandardNewsProps } from "@/components/news-props";
import { fieldValue } from "@/components/news-props";
import PlayButton from "@/components/ui/PlayButton";
import { DEFAULT_THUMBNAIL_IMAGE } from "@/lib/images";
import { cn } from "@/lib/utils";
import CardImage from "@/components/ui/CardImage";

type Props = StandardNewsProps;

export default function VerticalVideoNews({
  category = {
    hidden: false,
    value: "ಎಮರಕಯ",
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
  const imageValue = fieldValue(imageSrc) || DEFAULT_THUMBNAIL_IMAGE;

  return (
    <article className={cn("w-full overflow-hidden bg-transparent", className)}>
      <div className="relative w-full overflow-hidden bg-transparent">
        <CardImage
          className="w-full aspect-video object-cover"
          src={imageValue}
          alt={titleValue || categoryValue || "video news image"}
          priority={priority}
        />

        <div className="absolute inset-0 flex items-center justify-center">
          <PlayButton label="Play video" />
        </div>
      </div>

      <div className="bg-transparent pt-4">
        {!category?.hidden && categoryValue && (
          <div
            className={`mb-3 text-3742B8 text-12-inter-600 leading-[1.2] ${
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
