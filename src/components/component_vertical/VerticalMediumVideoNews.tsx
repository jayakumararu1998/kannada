import type { StandardNewsProps } from "@/components/news-props";
import { fieldValue } from "@/components/news-props";
import PlaybackControls from "@/components/ui/playbackcontrols";
import { cn } from "@/lib/utils";
import CardImage from "@/components/ui/CardImage";

type Props = StandardNewsProps;

export default function VerticalMediumVideoNews({
  title = {
    hidden: false,
    value: "ಪಲಕಯಟರ ಚಹರಕಯಪ ಕಳಗ ನರಣಯ ಧಮಕವದ ಪರಕರ ಕಸನಸ ಮಡ ಕವತರ.",
    customClass: "",
  },
  imageSrc,
  priority = false,
  className,
}: Props) {
  const titleValue = fieldValue(title);
  const imageValue = fieldValue(imageSrc);

  return (
    <article className={cn("w-full overflow-hidden bg-transparent", className)}>
      <div className="relative w-full overflow-hidden bg-transparent">
        {imageValue && (
          <CardImage
            className="w-full aspect-video object-cover"
            src={imageValue}
            alt={titleValue || "video news image"}
            priority={priority}
          />
        )}

        <div className="absolute inset-0 flex items-center justify-center">
          <PlaybackControls isPlaying={false} />
        </div>
      </div>

      {!title?.hidden && titleValue && (
        <h3
          className={`pt-4 text-333333 text-32-manrope-700 leading-[1.18] ${
            title?.customClass || ""
          }`}
        >
          {titleValue}
        </h3>
      )}
    </article>
  );
}
