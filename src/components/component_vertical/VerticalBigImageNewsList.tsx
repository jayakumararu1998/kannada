import type { StandardNewsProps } from "@/components/news-props";
import { fieldValue } from "@/components/news-props";
import { DEFAULT_THUMBNAIL_IMAGE } from "@/lib/images";
import { cn } from "@/lib/utils";
import CardImage from "@/components/ui/CardImage";

type Props = StandardNewsProps;

export default function VerticalBigImageNewsList({
  category = {
    hidden: false,
    value: "ಸನಮ ಸದದ (ಸನಮ)",
    customClass: "",
  },
  title = {
    hidden: false,
    value: "ಮನತರಭಲ ಪಲಜ ಅಮತ ಇದ ಮಧಯತರವಗದ ನತಕಚಲನ ಡರರ ನಜ.",
    customClass: "",
  },
  imageSrc,
  priority = false,
}: Props) {
  const categoryValue = fieldValue(category);
  const titleValue = fieldValue(title);

  return (
    <article className="w-full overflow-hidden bg-transparent p-4">
      <div className="w-full overflow-hidden bg-transparent">
        <CardImage
          className="w-full aspect-video object-cover"
          src={fieldValue(imageSrc) || DEFAULT_THUMBNAIL_IMAGE}
          alt={fieldValue(title) || "news image"}
          priority={priority}
        />
      </div>

      <div>
        <div className="border-b border-DFDFDF py-3">
          {!category?.hidden && categoryValue && (
            <div
              className={`mb-2 text-3742B8 text-12-balootamma2-600 leading-[1] ${category?.customClass || ""}`}
            >
              {categoryValue}
            </div>
          )}

          {!title?.hidden && titleValue && (
            <h3
              className={cn(
                "text-333333 text-16-manrope-700 leading-[1.2]",
                title?.customClass,
              )}
            >
              {titleValue}
            </h3>
          )}
        </div>
      </div>
    </article>
  );
}
