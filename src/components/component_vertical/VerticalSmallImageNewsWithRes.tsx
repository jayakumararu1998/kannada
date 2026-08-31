import LiveBlink from "@/components/ui/LiveBlink";
import type { StandardNewsProps } from "@/components/news-props";
import { fieldValue } from "@/components/news-props";
import { DEFAULT_THUMBNAIL_IMAGE } from "@/lib/images";
import { isLiveBlogValue } from "@/lib/liveBlog";
import { cn } from "@/lib/utils";
import CardImage from "@/components/ui/CardImage";

type Props = StandardNewsProps;

const FALLBACK_IMAGE = DEFAULT_THUMBNAIL_IMAGE;

export default function VerticalSmallImageNewsWithRes({
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
  templatetype = { hidden: false, value: "" },
  isliveblog = { hidden: false, value: "" },
}: Props) {
  const categoryValue = fieldValue(category);
  const excerptValue = fieldValue(excerpt);
  const isLiveBlog =
    isLiveBlogValue(fieldValue(templatetype)) ||
    isLiveBlogValue(fieldValue(isliveblog));

  return (
    <article className="grid w-full grid-cols-[minmax(0,1fr)_36%] items-start gap-[15px] overflow-hidden bg-transparent md:flex md:flex-col">
      <div className="order-2 w-full overflow-hidden bg-transparent md:order-1">
        <CardImage
          className="w-full aspect-video object-cover"
          src={fieldValue(imageSrc) || FALLBACK_IMAGE}
          alt={excerptValue || categoryValue || "news image"}
          priority={priority}
        />
      </div>

      <div className="order-1 flex flex-col gap-[15px] bg-transparent md:order-2">
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
            {isLiveBlog && (
              <>
                <LiveBlink className="mr-1.5" />
                <span className="sr-only">Live blog: </span>
              </>
            )}
            {excerptValue}
          </p>
        )}
      </div>
    </article>
  );
}
