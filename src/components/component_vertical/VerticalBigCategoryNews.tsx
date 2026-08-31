import type { StandardNewsProps } from "@/components/news-props";
import { fieldValue } from "@/components/news-props";
import { DEFAULT_THUMBNAIL_IMAGE } from "@/lib/images";
import { cn } from "@/lib/utils";
import Socialicons from "@/components/ui/socialicons";
import BookmarkIcon from "@/components/ui/bookmarkicon";
import CardImage from "@/components/ui/CardImage";

type Props = StandardNewsProps;

export default function VerticalBigCategoryNews({
  category = {
    hidden: false,
    value: "ಬಹತ ಉಲಗ",
    customClass: "",
  },
  title = {
    hidden: false,
    value: "ಹಮಚವನ ಬಹತ ಉಲಗ ಎಮರಕಯಲಯ ಡಬಟಸಕ ಮಶಖ.",
    customClass: "",
  },
  excerpt = {
    hidden: false,
    value: "ಹಮಚವನ ಬಹತ ಉಲಗ ಎಮರಕಯಲಯ ಡಬಟಸಕ ಧನಲಪಪರ ಮಶಖ.",
    customClass: "",
  },
  timeAgo = {
    hidden: false,
    value: "Updated On: 25 June 2026, 11:40 PM",
    customClass: "",
  },
  imageSrc,
  priority = false,
}: Props) {
  const categoryValue = fieldValue(category);
  const titleValue = fieldValue(title);
  const excerptValue = fieldValue(excerpt);
  const timeAgoValue = fieldValue(timeAgo);

  return (
    <article className="grid w-full gap-5 overflow-hidden bg-transparent">
      <div className="relative grid gap-[6px]">
        {!category?.hidden && categoryValue && (
          <div
            className={`text-3742B8 text-12-balootamma2-600 leading-none ${category?.customClass || ""}`}
          >
            {categoryValue}
          </div>
        )}

        {!title?.hidden && titleValue && (
          <h1
            className={cn(
              "pr-8 text-333333 text-32-balootamma2-700 leading-[1.12]",
              title?.customClass,
            )}
          >
            {titleValue}
          </h1>
        )}

        {!excerpt?.hidden && excerptValue && (
          <p
            className={cn(
              "text-808080 text-15-inter-400 leading-[1.25]",
              excerpt?.customClass,
            )}
          >
            {excerptValue}
          </p>
        )}

        {/* <button
          type="button"
          aria-label="Save article"
          className="absolute top-0 right-0 flex h-8 w-8 items-start justify-center text-000000"
        >
          <BookmarkIcon active={false} />
        </button> */}
      </div>

      <div className="relative w-full overflow-hidden bg-transparent">
        <CardImage
          className="w-full aspect-video object-cover"
          src={fieldValue(imageSrc) || DEFAULT_THUMBNAIL_IMAGE}
          alt={fieldValue(title) || "news image"}
          priority={priority}
        />
      </div>

      <div className="grid gap-[13px]">
        {!timeAgo?.hidden && timeAgoValue && (
          <div className="flex flex-wrap items-center gap-x-[17px] gap-y-2 text-6D6D6D text-14-inter-400 leading-none">
            <span className={timeAgo?.customClass || ""}>{timeAgoValue}</span>
          </div>
        )}

        {/* <Socialicons className="mt-[19px]" size="sm" /> */}
      </div>
    </article>
  );
}
