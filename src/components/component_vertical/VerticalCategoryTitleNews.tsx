import LiveBlink from "@/components/ui/LiveBlink";
import type { StandardNewsProps } from "@/components/news-props";
import { fieldValue } from "@/components/news-props";
import { isLiveBlogValue } from "@/lib/liveBlog";
import { cn } from "@/lib/utils";

type Props = StandardNewsProps;

export default function VerticalCategoryTitleNews({
  componentdiv = {
    hidden: false,
    value: "",
    customClass: "",
  },
  category = {
    hidden: false,
    value: "ಎಮರಕಯ",
    customClass: "",
  },
  title = {
    hidden: false,
    value:
      "ಪೈಲೋಕ್ಯೂಟರ್ ಚಾಹಿರ್ಕ್ಯಪಿ ಕೆಳಗೆ ನಿರ್ಣಯ ಧುಮುಕುವುದು ಪ್ರಕಾರ ಕಸನಸ ಮೋಡಿ ಕವಿತ್ರಾ.",
    customClass: "",
  },
  className,
  templatetype = { hidden: false, value: "" },
  isliveblog = { hidden: false, value: "" },
}: Props) {
  const categoryValue = fieldValue(category);
  const titleValue = fieldValue(title);
  const isLiveBlog =
    isLiveBlogValue(fieldValue(templatetype)) ||
    isLiveBlogValue(fieldValue(isliveblog));

  return (
    <article
      className={cn(
        "flex w-full flex-col gap-[15px] overflow-hidden rounded-[10px] bg-transparent",
        componentdiv?.customClass,
        className,
      )}
    >
      {!category?.hidden && categoryValue && (
        <div
          className={`text-3742B8 text-12-inter-600 uppercase leading-100 tracking-[0.52px] ${category?.customClass || ""}`}
        >
          {categoryValue}
        </div>
      )}

      {!title?.hidden && titleValue && (
        <h3
          className={cn(
            "text-333333 text-14-manrope-700 capitalize leading-120",
            title?.customClass,
          )}
        >
          {isLiveBlog && <LiveBlink className="mr-1.5" />}
          {titleValue}
        </h3>
      )}
    </article>
  );
}
