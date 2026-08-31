import NextLink from "next/link";

import type { StandardNewsProps } from "@/components/news-props";
import { fieldValue } from "@/components/news-props";
import { DEFAULT_THUMBNAIL_IMAGE } from "@/lib/images";
import { cn } from "@/lib/utils";
import CardImage from "@/components/ui/CardImage";

type Props = StandardNewsProps;

const DEFAULT_IMAGE = DEFAULT_THUMBNAIL_IMAGE;

export default function HorizontalCategoryNews({
  className,
  articleHref,
  slug,
  title = {
    hidden: false,
    value:
      "ಸೇಡಿಗಾಗಿ ಖಾಸಗಿ ಫೋಟೋ, ವಿಡಿಯೋ ವೈರಲ್, ಬೆದರಿಕೆ ಪ್ರಕರಣ: ಕಡ್ಡಾಯವಾಗಿ FIR ದಾಖಲಿಸಬೇಕು, ಪೊಲೀಸರಿಗೆ ಪ್ರಿಯಾಂಕ್ ಖರ್ಗೆ ಖಡಕ್ ಸೂಚನೆ!",
  },
  imageSrc = { hidden: false, value: DEFAULT_IMAGE },
  priority = false,
}: Props) {
  const imageValue = fieldValue(imageSrc) || DEFAULT_IMAGE;
  const href = articleHref || (slug ? `/${slug.replace(/^\/+/, "")}` : "#");

  return (
    <article
      className={cn(
        "w-full overflow-hidden border border-[var(--color-D2D2D2)] bg-transparent",
        className,
      )}
    >
      <div className="border-b border-[var(--color-D2D2D2)] bg-transparent">
        <div className="inline-flex items-center rounded-tr-[13px] bg-[var(--color-3046EB)] px-[26px] py-2.5 font-manrope text-base font-bold leading-none text-FFFFFF">
          Also Read
        </div>
      </div>

      <NextLink
        href={href}
        className={cn(
          "grid grid-cols-[36%_minmax(0,1fr)] items-start gap-[14px] px-3 py-5 text-inherit no-underline [@media(min-width:375px)]:gap-4 [@media(min-width:375px)]:px-4 [@media(min-width:480px)]:gap-[22px] [@media(min-width:480px)]:px-5 [@media(min-width:480px)]:py-6 sm:gap-7 sm:px-6 sm:py-[26px] md:gap-9 md:px-6 md:py-[26px]",
          imageSrc.hidden &&
            "grid-cols-[minmax(0,1fr)] [@media(min-width:375px)]:grid-cols-[minmax(0,1fr)] [@media(min-width:480px)]:grid-cols-[minmax(0,1fr)] sm:grid-cols-[minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)]",
        )}
      >
        {!imageSrc.hidden && (
          <div
            className={cn(
              "w-full overflow-hidden bg-transparent",
              imageSrc.customClass,
            )}
          >
            <CardImage
              className="w-full aspect-video object-cover"
              src={imageValue}
              alt={fieldValue(title)}
              priority={priority}
            />
          </div>
        )}

        {!title.hidden && (
          <h3
            className={cn(
              "line-clamp-4 overflow-hidden font-manrope text-base font-bold leading-145 text-111111 min-375:text-17-manrope-700 min-480:text-19-manrope-700 min-480:leading-150 sm:text-21-manrope-700 sm:leading-155 md:text-2xl md:leading-165",
              title.customClass,
            )}
          >
            {title.value}
          </h3>
        )}
      </NextLink>
    </article>
  );
}
