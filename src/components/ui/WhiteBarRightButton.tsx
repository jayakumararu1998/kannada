"use client";

import { useId } from "react";
import NextLink from "next/link";
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Section / column heading bar. Styling matches dinamani's RecentNews (with a
 * "more" link) / OnesideText (heading only) exactly:
 *   - bar: full-width, light grey `#F8F8F8` fill, `px-4 py-3` (no min-height,
 *     no white fill, no bottom border). The Kannada Prabha bullet icon is kept
 *     before the title.
 *   - title: brand blue `#215EF9`, bold, `leading-[1.4]`, single line
 *     (`line-clamp-1`); size is heading-level based (h2 = 24px desktop / 18px
 *     mobile) unless overridden via `titleStyle.fontSize` / `level`
 *   - "more": plain blue `12px/600` text (no pill, border, or chevron)
 * Colours/sizes are taken verbatim from dinamani; the font family stays the
 * Kannada display font (Baloo Tamma 2) so Kannada text renders correctly.
 */

function TitleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 8 16"
      className="h-[16px] w-[8px] shrink-0 opacity-100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="4" cy="4" r="4" fill="#FAC43B" />
      <path
        d="M8 8C8 9.06087 7.57857 10.0783 6.82843 10.8284C6.07828 11.5786 5.06087 12 4 12C2.93913 12 1.92172 11.5786 1.17157 10.8284C0.421428 10.0783 1.60186e-07 9.06087 0 8L8 8Z"
        fill="#3046EB"
      />
      <path
        d="M8 12C8 13.0609 7.57857 14.0783 6.82843 14.8284C6.07828 15.5786 5.06087 16 4 16C2.93913 16 1.92172 15.5786 1.17157 14.8284C0.421428 14.0783 1.60186e-07 13.0609 0 12L8 12Z"
        fill="#009EF9"
      />
    </svg>
  );
}

type Level = 1 | 2 | 3 | 4 | 5 | 6;

type WhiteBarRightButtonProps = {
  title?: ReactNode;
  buttonLabel?: ReactNode;
  /** When set, the right-side control renders as a link ("more") instead of a button. */
  href?: string;
  openInNewTab?: boolean;
  onButtonClick?: () => void;
  /** Show the right-side control. Defaults to true when a label + (href|onClick) exist. */
  showButton?: boolean;
  className?: string;
  titleClassName?: string;
  /** Inline style for the title text — used to apply heading color/size/weight. */
  titleStyle?: CSSProperties;
  buttonClassName?: string;
  buttonProps?: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick">;
  /** Heading level → default font size when titleStyle.fontSize is unset. Default 2. */
  level?: Level;
  /** Explicit mobile title size (falls back to the level-based mobile size). */
  fontSizeMobile?: string;
  /** Custom background color; when unset the dinamani grey `#F8F8F8` is used. */
  background?: string;
};

// Dinamani RecentNews desktop/mobile title sizes, by heading level.
const DESKTOP_SIZES: Record<Level, string> = {
  1: "32px", 2: "24px", 3: "22px", 4: "20px", 5: "17px", 6: "15px",
};
const MOBILE_SIZES: Record<Level, string> = {
  1: "24px", 2: "18px", 3: "16px", 4: "15px", 5: "14px", 6: "12px",
};

const BLUE = "#215EF9";

export default function WhiteBarRightButton({
  title = "ಬಹತ ಉಲಗ",
  buttonLabel = "ಮೇಲಿನ",
  href,
  openInNewTab,
  onButtonClick,
  showButton,
  className,
  titleClassName,
  titleStyle,
  buttonClassName,
  buttonProps,
  level = 2,
  fontSizeMobile,
  background,
}: WhiteBarRightButtonProps) {
  const showControl =
    showButton ?? Boolean(buttonLabel && (href || onButtonClick));

  const uid = useId().replace(/:/g, "");
  const titleId = `wbrb-${uid}`;

  const desktopSize = titleStyle?.fontSize ?? DESKTOP_SIZES[level];
  const mobileSize = fontSizeMobile ?? MOBILE_SIZES[level];

  // Title color: explicit override (builder) wins, else dinamani blue.
  const resolvedTitleStyle: CSSProperties = {
    color: BLUE,
    ...titleStyle,
    fontSize: desktopSize,
  };

  const moreEl = (
    <span
      className="translate-y-[0.1em] text-12-balootamma2-600 line-clamp-1"
      style={{ color: (titleStyle?.color as string) || BLUE }}
    >
      {buttonLabel}
    </span>
  );

  return (
    <div
      className={cn("w-full", className)}
      style={background ? { backgroundColor: background } : undefined}
    >
      {/* Per-breakpoint title size: mobile override via a scoped rule (Tailwind
          can't emit a dynamic arbitrary size at build time). */}
      <style>{`@media(max-width:767px){.${titleId}{font-size:${mobileSize} !important}}`}</style>
      <div className="flex w-full items-center justify-between">
        <div className={cn("flex items-center gap-2", titleClassName)}>
          <TitleIcon />
          <span
            className={cn(
              titleId,
              // translate-y: Baloo Tamma 2 draws Kannada glyphs high in its
              // line box (descender room below), so a box-centered title looks
              // raised next to the icon — nudge the glyphs down to the icon's
              // visual center. Em-based so it scales with the font size.
              "translate-y-[0.1em] font-balootamma2 font-bold leading-[1.4] line-clamp-1",
            )}
            style={resolvedTitleStyle}
          >
            {title}
          </span>
        </div>

        {showControl &&
          (href ? (
            <NextLink
              href={href}
              target={openInNewTab ? "_blank" : undefined}
              className={cn(
                "flex items-center gap-1 transition-opacity hover:opacity-80",
                buttonClassName,
              )}
            >
              {moreEl}
            </NextLink>
          ) : (
            <button
              type="button"
              onClick={onButtonClick}
              className={cn(
                "flex items-center gap-1 transition-opacity hover:opacity-80",
                buttonClassName,
              )}
              {...buttonProps}
            >
              {moreEl}
            </button>
          ))}
      </div>
    </div>
  );
}
