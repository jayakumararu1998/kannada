import NextLink from "next/link";

import type { StandardNewsProps } from "@/components/news-props";
import { fieldValue } from "@/components/news-props";
import { DEFAULT_THUMBNAIL_IMAGE } from "@/lib/images";
import { cn } from "@/lib/utils";
import CardImage from "@/components/ui/CardImage";

type Props = StandardNewsProps;

const DEFAULT_IMAGE = DEFAULT_THUMBNAIL_IMAGE;

export default function HorizontalNewsArticlePage({
  className,
  articleHref = "#",
  slug,
  imageSrc = { hidden: false, value: DEFAULT_IMAGE },
  category = {
    hidden: false,
    value:
      "ಸೇಡಿಗಾಗಿ ಖಾಸಗಿ ಫೋಟೊ, ವಿಡಿಯೋ ವೈರಲ್, ಬೆದರಿಕೆ ಪ್ರಕರಣ: ಕಡಾಯವಾಗಿ FIR ದಾಖಲಿಸಬೇಕು, ಪೊಲೀಸರಿಗೆ ಪ್ರಿಯಾಂಕ್ ಖರ್ಗೆ ಖಡಕ್ ಸೂಚನೆ!",
  },
  excerpt = {
    hidden: false,
    value:
      "ಬೆಂಗಳೂರು: ಮುಖ್ಯಮಂತ್ರಿಗಳು ಡಿಕೆ ಶಿವಕುಮಾರ್ ಅವರು ರಾಜ್ಯದ ಜನತೆಗೆ ತಿಳಿಗೊಳಿಸಿದ ತುರ್ತು ಪರಿಸ್ಥಿತಿ ಮತ್ತು ಪ್ರಮುಖ ನಿರ್ವಹಣೆಗೆ ತಾತ್ಕಾಲಿಕ ಜಿಲ್ಲಾ ಉಸ್ತುವಾರಿ ಜವಾಬ್ದಾರಿ ಹಂಚಿಕೆ ಮಾಡಿದ್ದಾರೆ.",
  },
  priority = false,
}: Props) {
  const imageValue = fieldValue(imageSrc) || DEFAULT_IMAGE;
  const href = articleHref || (slug ? `/${slug.replace(/^\/+/, "")}` : "#");

  return (
    <section
      className={cn(
        "w-full overflow-hidden border border-[var(--color-D2D2D2)] bg-transparent font-manrope text-111111",
        className,
      )}
    >
      <div className="border-b border-[var(--color-D2D2D2)]">
        <div className="inline-flex items-center rounded-tr-xl bg-[var(--color-3046EB)] px-5 py-2.5 text-15-manrope-700 leading-none text-FFFFFF sm:px-6 sm:text-base">
          Also Read
        </div>
      </div>

      <div className="border-b border-[var(--color-D2D2D2)] px-3 py-4 [@media(min-width:375px)]:px-4 [@media(min-width:480px)]:px-5 sm:px-6 sm:py-[26px]">
        <NextLink
          href={href}
          className={cn(
            "grid grid-cols-[36%_1fr] items-start gap-3 text-inherit no-underline [@media(min-width:480px)]:gap-4 sm:gap-6 md:gap-9",
            imageSrc.hidden &&
              "grid-cols-[minmax(0,1fr)] [@media(min-width:375px)]:grid-cols-[minmax(0,1fr)] [@media(min-width:480px)]:grid-cols-[minmax(0,1fr)] sm:grid-cols-[minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)]",
          )}
        >
          {!imageSrc.hidden && (
            <div
              className={cn(
                "w-full overflow-hidden bg-transparent sm:",
                imageSrc.customClass,
              )}
            >
              <CardImage
                className="w-full aspect-video object-cover"
                src={imageValue}
                alt={fieldValue(category)}
                priority={priority}
              />
            </div>
          )}

          {!category.hidden && (
            <h2
              className={cn(
                "font-manrope text-base font-bold leading-145 text-111111 min-375:text-17-manrope-700 min-480:text-19-manrope-700 min-480:leading-150 sm:text-21-manrope-700 sm:leading-155 md:text-2xl md:leading-165",
                category.customClass,
              )}
            >
              {category.value}
            </h2>
          )}
        </NextLink>
      </div>

      {!excerpt.hidden && excerpt.value && (
        <div className="px-3 py-6 [@media(min-width:375px)]:px-4 [@media(min-width:480px)]:px-5 sm:px-6 sm:py-9 md:py-10">
          <p
            className={cn(
              "font-manrope text-sm font-normal leading-138 text-4A4A4A min-480:text-15-manrope-400 sm:text-base sm:leading-128",
              excerpt.customClass,
            )}
          >
            {excerpt.value}
          </p>
        </div>
      )}
    </section>
  );
}
