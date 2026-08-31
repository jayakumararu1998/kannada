import type { StandardNewsProps } from "@/components/news-props";
import { fieldValue } from "@/components/news-props";
import { DEFAULT_THUMBNAIL_IMAGE } from "@/lib/images";
import CardImage from "@/components/ui/CardImage";

type Props = StandardNewsProps;

const FALLBACK_IMAGE = DEFAULT_THUMBNAIL_IMAGE;

export default function VerticalImageNews({
  title = {
    hidden: false,
    value: "ಪಲಕಯಟರ ಚಹರಕಯಪ ಕಳಗ ನರಣಯ ಧಮಕವದ ಪರಕರ ಕಸನಸ ಮಡ ಕವತರ.",
    customClass: "",
  },
  imageSrc,
  priority = false,
}: Props) {
  const titleValue = fieldValue(title);

  return (
    <article className="w-full overflow-hidden bg-transparent">
      <div className="w-full overflow-hidden bg-transparent">
        <CardImage
          className="w-full aspect-video object-cover"
          src={fieldValue(imageSrc) || FALLBACK_IMAGE}
          alt={titleValue || "news image"}
          priority={priority}
        />
      </div>

      {!title?.hidden && titleValue && (
        <div
          className={`px-4 pt-3 pb-4 text-333333 text-16-manrope-700 leading-120 capitalize ${title?.customClass || ""}`}
        >
          {titleValue}
        </div>
      )}
    </article>
  );
}
