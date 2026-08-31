import type { StandardNewsProps } from "@/components/news-props";
import { fieldValue } from "@/components/news-props";
import { ShareNodesIcon } from "@/components/ui/socialIconSvgs";
import { cn } from "@/lib/utils";
import CardImage from "@/components/ui/CardImage";

type Props = StandardNewsProps;

const DEFAULT_IMAGE = "/images/vertical/vertical-image-gradient-news.jpg";

export default function VerticalImageGradientNews({
  title = {
    hidden: false,
    value: "ಜ್ಯೋತಿಷ್ಕೋತ್ತರ ಚಾಂಪ್ಯನ್ಷಿಪ್\nಕ್ಕೆಗೆ ನೀರಿನ",
    customClass: "",
  },
  imageSrc,
  priority = false,
}: Props) {
  const titleValue = fieldValue(title);

  return (
    <article className="relative max-w-full overflow-hidden bg-transparent">
      <CardImage
        className="w-full aspect-[205/350] object-cover"
        src={fieldValue(imageSrc) || DEFAULT_IMAGE}
        alt={fieldValue(title) || "news image"}
        priority={priority}
      />

      <div className="absolute inset-x-0 bottom-0 h-[48%] bg-gradient-to-t from-black via-black/75 to-transparent" />

      <span
        aria-label="Share"
        role="img"
        className="absolute right-[13px] top-[19px] flex h-5 w-5 items-center justify-center text-white"
      >
        <ShareNodesIcon size={18} />
      </span>

      {!title?.hidden && titleValue && (
        <h2
          className={cn(
            "absolute bottom-[30px] left-[16px] w-[154px] whitespace-pre-line font-kannada text-[14px] font-extrabold leading-[1.08] text-white",
            title?.customClass,
          )}
        >
          {titleValue}
        </h2>
      )}
    </article>
  );
}
