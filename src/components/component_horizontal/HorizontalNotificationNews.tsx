import NextLink from "next/link";

import type { StandardNewsProps } from "@/components/news-props";
import { cn } from "@/lib/utils";

type Props = StandardNewsProps;

export default function HorizontalNotificationNews({
  className,
  articleHref,
  slug,
  timeAgo = { hidden: false, value: "9:34 Pm, 02 Jun 2026" },
  title = {
    hidden: false,
    value:
      "ಸ್ಪೀಕರ್ ಯುಟಿ ಖಾದರ್ ರಿಂದ ಸಿದ್ದಿಗೆ ಚೆಕ್‌ಮೇಟ್; ಪಕ್ಕಾ ಆರ್ಯಾ ಸಚಿವ ಸ್ಥಾನ?",
  },
  excerpt = {
    hidden: false,
    value:
      "ಕರ್ನಾಟಕ ವಿಧಾನಸಭೆ ಸಚಿವಾಲಯದ ಅಧಿಕಾರಿಗಳು ಮತ್ತು ನೌಕರರಿಗೆ ಸ್ಪೀಕರ್ ಯು.ಟಿ. ಖಾದರ್ ಅವರು ಚಹಾಕೂಟ ಆಯೋಜಿಸಿದ್ದು, ಅವರು ನೀರಿಳಿಸಲು ಇವರ ಕ್ಷೆ.ಕೆ ಶಿವಕುಮಾರ್ ನೇತೃತ್ವದಲ್ಲಿ ಕೆಲಸ ಮಾಡಿದ್ದಾರೆ.",
  },
}: Props) {
  const href =
    articleHref || (slug ? `/${slug.replace(/^\/+/, "")}` : undefined);

  const heading = !title.hidden ? (
    <h2
      className={cn(
        "mt-[34px] font-manrope text-2xl font-bold leading-119 text-000000 md:mt-9",
        title.customClass,
      )}
    >
      {title.value}
    </h2>
  ) : null;

  return (
    <article
      className={cn(
        "w-full bg-transparent px-5 py-10 font-manrope text-111111 [@media(min-width:480px)]:px-8 [@media(min-width:480px)]:py-12 md:px-20 md:pb-16 md:pt-[88px] lg:pr-[132px]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4">
        {!timeAgo.hidden && (
          <div
            className={cn(
              "inline-flex items-center gap-2.5 text-15-manrope-600 leading-none text-6F6F6F",
              timeAgo.customClass,
            )}
          >
            <svg
              className="shrink-0 text-22-manrope-400 text-D2D2D2"
              viewBox="0 0 22 22"
              width="1em"
              height="1em"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="11" fill="currentColor" />
              <path
                d="M11 5.5V11L15 13.6"
                fill="none"
                stroke="white"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
            <span>{timeAgo.value}</span>
          </div>
        )}

        <span
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-transparent p-2 text-111111"
          aria-label="Share"
          role="img"
        >
          <svg
            className="text-18-manrope-400"
            viewBox="0 0 18 18"
            width="1em"
            height="1em"
            aria-hidden="true"
          >
            <path
              d="M13.25 5.75L6.75 9L13.25 12.25M15 4.5C15 5.32843 14.3284 6 13.5 6C12.6716 6 12 5.32843 12 4.5C12 3.67157 12.6716 3 13.5 3C14.3284 3 15 3.67157 15 4.5ZM7 9C7 9.82843 6.32843 10.5 5.5 10.5C4.67157 10.5 4 9.82843 4 9C4 8.17157 4.67157 7.5 5.5 7.5C6.32843 7.5 7 8.17157 7 9ZM15 13.5C15 14.3284 14.3284 15 13.5 15C12.6716 15 12 14.3284 12 13.5C12 12.6716 12.6716 12 13.5 12C14.3284 12 15 12.6716 15 13.5Z"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </span>
      </div>

      {href && heading ? (
        <NextLink href={href} className="text-inherit no-underline">
          {heading}
        </NextLink>
      ) : (
        heading
      )}

      {!excerpt.hidden && excerpt.value && (
        <div className="mt-6 grid gap-5 md:mt-[26px] md:gap-[22px]">
          <p
            className={cn(
              "font-manrope text-15-75-manrope-400 leading-128 text-333333",
              excerpt.customClass,
            )}
          >
            {excerpt.value}
          </p>
        </div>
      )}
    </article>
  );
}
