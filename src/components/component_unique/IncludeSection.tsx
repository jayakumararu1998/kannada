"use client";

import NextLink from "next/link";

import LiveBlink from "@/components/ui/LiveBlink";
import { DEFAULT_THUMBNAIL_IMAGE } from "@/lib/images";
import { isLiveBlogValue } from "@/lib/liveBlog";
import { cn } from "@/lib/utils";

export type IncludeSectionItem = {
  title?: string;
  imageSrc?: string;
  href?: string;
  templatetype?: string;
  isliveblog?: string | boolean;
};

type TitleField =
  | string
  | { value?: string; hidden?: boolean; customClass?: string };

type Props = {
  /** Section heading. Plain string or the builder FieldConfig shape. */
  title?: TitleField;
  items?: IncludeSectionItem[];
  className?: string;
};

function titleText(t?: TitleField): {
  text: string;
  hidden?: boolean;
  cls?: string;
} {
  if (typeof t === "string") return { text: t };
  return { text: t?.value ?? "", hidden: t?.hidden, cls: t?.customClass };
}

/**
 * "Include Section" — a reusable section widget with the same concept as
 * `TrendingSection` (bordered card + gradient header bar), but for ANY section
 * included by slug (e.g. ರಾಜಕೀಯ). Renders the section title, then a vertical
 * list of the section's stories (image + headline), each linking to the story.
 * Fed the whole bound collection by the builder renderer; hidden when empty.
 */
export default function IncludeSection({ title, items, className }: Props) {
  const heading = titleText(title);
  const list = items ?? [];
  if (list.length === 0) return null;

  return (
    <section
      className={cn(
        "w-full overflow-hidden rounded-2xl border border-D2D2D2 bg-FFFFFF",
        className,
      )}
    >
      {!heading.hidden && heading.text && (
        <div className="bg-gradient-to-r from-[#2E6FE6] via-[#3E9E86] to-[#F3C63F] px-6 py-3">
          <h2
            className={cn(
              "font-balootamma2 text-22-balootamma2-700 font-bold leading-none text-FFFFFF",
              heading.cls,
            )}
          >
            {heading.text}
          </h2>
        </div>
      )}

      <ul className="divide-y divide-D2D2D2">
        {list.map((item, i) => (
          <li key={i}>
            <NextLink
              href={item.href || "#"}
              className="flex items-start gap-3 p-4 text-inherit no-underline transition-colors hover:bg-F9F9F9"
            >
              <div className="w-[120px] shrink-0 overflow-hidden rounded">
                <img
                  className="w-full aspect-[120/80] object-cover"
                  src={item.imageSrc || DEFAULT_THUMBNAIL_IMAGE}
                  alt={item.title || "news"}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <p className="line-clamp-3 font-balootamma2 text-[15px] font-bold leading-[1.35] text-333333">
                {(isLiveBlogValue(item.templatetype) ||
                  isLiveBlogValue(item.isliveblog)) && (
                  <LiveBlink className="mr-1.5" />
                )}
                {item.title}
              </p>
            </NextLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
