"use client";

import NextLink from "next/link";

import LiveBlink from "@/components/ui/LiveBlink";
import { DEFAULT_THUMBNAIL_IMAGE } from "@/lib/images";
import { isLiveBlogValue } from "@/lib/liveBlog";
import { cn } from "@/lib/utils";

export type TrendingItem = {
  title?: string;
  imageSrc?: string;
  href?: string;
  templatetype?: string;
  isliveblog?: string | boolean;
};

type TitleField = string | { value?: string; hidden?: boolean; customClass?: string };

type Props = {
  /** Header label. Accepts a plain string or the builder FieldConfig shape. */
  title?: TitleField;
  items?: TrendingItem[];
  className?: string;
};

const PLACEHOLDER_TITLE =
  "ಹಿಮೋಚಿವಿನಿ ಬೃಹತ್ ಉಲಿಗ್ ಎಮಾರಾಕ್ಕುಲಿಯಾ ಡಂಬಟೋಸ್ಕಿ ಧುನ್ಲಿಫ್ಪರ್ ಮಶಿಖ್.";

const DEFAULT_ITEMS: TrendingItem[] = Array.from({ length: 6 }, () => ({
  title: PLACEHOLDER_TITLE,
  imageSrc: DEFAULT_THUMBNAIL_IMAGE,
  href: "#",
}));

function titleText(t?: TitleField): { text: string; hidden?: boolean; cls?: string } {
  if (typeof t === "string") return { text: t };
  return { text: t?.value ?? "", hidden: t?.hidden, cls: t?.customClass };
}

/**
 * "Trending" strip — a bordered card with a gradient header bar and a row of
 * small image + title cards. Binds to a trending collection (fed the whole list
 * by the builder renderer).
 */
export default function TrendingSection({ title, items, className }: Props) {
  const heading = titleText(title);
  const headingText = heading.text || "ಟ್ರೆಂಡಿಂಗ್";
  // Show at most 4 trending cards in the horizontal scroll.
  const list = (items?.length ? items : DEFAULT_ITEMS).slice(0, 4);

  return (
    <section
      className={cn(
        "w-full overflow-hidden rounded-2xl border border-D2D2D2 bg-FFFFFF",
        className,
      )}
    >
      {!heading.hidden && (
        <div className="bg-gradient-to-r from-[#2E6FE6] via-[#3E9E86] to-[#F3C63F] px-6 py-3">
          <h2
            className={cn(
              "font-balootamma2 text-22-balootamma2-700 font-bold leading-none text-FFFFFF",
              heading.cls,
            )}
          >
            {headingText}
          </h2>
        </div>
      )}

      <div className="flex gap-6 overflow-x-auto p-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {list.map((item, i) => (
          <NextLink
            key={i}
            href={item.href || "#"}
            className="flex grow shrink-0 basis-[260px] items-start gap-3 text-inherit no-underline"
          >
            <div className="w-[130px] shrink-0 overflow-hidden bg-transparent">
              <img
                className="w-full aspect-[130/96] object-cover"
                src={item.imageSrc || DEFAULT_THUMBNAIL_IMAGE}
                alt={item.title || "trending news"}
                loading="lazy"
                decoding="async"
              />
            </div>
            <p className="font-balootamma2 text-[15px] font-bold leading-[1.3] text-333333">
              {(isLiveBlogValue(item.templatetype) ||
                isLiveBlogValue(item.isliveblog)) && (
                <LiveBlink className="mr-1.5" />
              )}
              {item.title || PLACEHOLDER_TITLE}
            </p>
          </NextLink>
        ))}
      </div>
    </section>
  );
}
