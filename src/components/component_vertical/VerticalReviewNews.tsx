import type { FieldConfig, StandardNewsProps } from "@/components/news-props";
import { fieldValue } from "@/components/news-props";
import FiveStar from "@/components/ui/FiveStar";
import { DEFAULT_THUMBNAIL_IMAGE } from "@/lib/images";
import { cn } from "@/lib/utils";
import CardImage from "@/components/ui/CardImage";

type Props = StandardNewsProps & {
  /** Critics star rating (0–5), as a FieldConfig so the builder can bind it. */
  criticsRating?: FieldConfig;
  /** User star rating (0–5), as a FieldConfig so the builder can bind it. */
  userRating?: FieldConfig;
};

export default function VerticalReviewNews({
  title = {
    hidden: false,
    value: "ಪಲಕಯಟರ ಚಹರಕಯಪ ಕಳಗ ನರಣಯ ಧಮಕವದ ಪರಕರ",
    customClass: "",
  },
  category = {
    hidden: false,
    value: "ಸನಮ ಸದದ (ಸನಮ)",
    customClass: "",
  },
  criticsRating = { hidden: false, value: "3.5", customClass: "" },
  userRating = { hidden: false, value: "1.5", customClass: "" },
  imageSrc,
  priority = false,
  className,
}: Props) {
  const titleValue = fieldValue(title);
  const categoryValue = fieldValue(category);
  const imageValue = fieldValue(imageSrc) || DEFAULT_THUMBNAIL_IMAGE;
  // Bind the stars to the rating value (0–5). Prefer the user rating; fall back
  // to the critics rating when the user rating is hidden.
  const userRatingValue = parseFloat(fieldValue(userRating)) || 0;
  const criticsRatingValue = parseFloat(fieldValue(criticsRating)) || 0;
  const ratingValue = userRating?.hidden ? criticsRatingValue : userRatingValue;
  const showStars = !userRating?.hidden || !criticsRating?.hidden;

  return (
    <article className={cn("w-full overflow-hidden bg-transparent", className)}>
      <div className="w-full overflow-hidden bg-transparent">
        <CardImage
          className="w-full aspect-video object-cover"
          src={imageValue}
          alt={titleValue || categoryValue || "review news image"}
          priority={priority}
        />
      </div>

      <div className="bg-transparent px-4 py-4">
        {showStars && (
          <FiveStar
            rating={ratingValue}
            label={`${ratingValue} out of 5 stars`}
            className="text-FACC15"
            starClassName="h-[14px] w-[14px]"
          />
        )}

        {!category?.hidden && categoryValue && (
          <div
            className={`mt-4 text-3742B8 text-12-inter-600 leading-[1.2] ${
              category?.customClass || ""
            }`}
          >
            {categoryValue}
          </div>
        )}

        {!title?.hidden && titleValue && (
          <h3
            className={`mt-2 text-333333 text-16-manrope-700 leading-[1.25] ${
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
