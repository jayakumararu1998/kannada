"use client";

import { useEffect, useState } from "react";

import AdvertisePopup from "@/components/ads/AdvertisePopup";
import RawEmbed from "@/components/article/elements/RawEmbed";

/**
 * A builder-bound GPT ad slot (component with `useInstanceAdCode`). The ad code
 * is self-contained googletag markup (`defineSlot` + `display` + the target
 * `<div id="div-gpt-ad-…">`); gpt.js is loaded once in the document <head>
 * (layout.tsx), so injecting the markup fills the slot.
 *
 * Device-aware: picks the desktop OR mobile code by viewport and injects only
 * that one (so a single GPT request per slot, not both).
 *
 * LAYOUT STABILITY — the slot reserves its full height from the SERVER render,
 * via a CSS media query rather than the JS device pick, and never resizes after
 * that. Previously the box was empty until `useEffect` chose a code (page grew
 * ~132px) and then shrank again when the creative resolved smaller than the
 * markup's own reservation (~110px) — together 0.13 CLS on a section page,
 * enough on their own to fail mobile CLS. The reserved height comes from the
 * TALLEST size the ad code itself declares (`defineSlot(..., [[300,300], …])`),
 * so it matches whatever the publisher configured; an unfilled slot now leaves
 * the same labelled grey box instead of moving the article under it.
 */
export default function AdSlot({
  desktop,
  mobile,
  minHeight = 90,
}: {
  desktop?: string;
  mobile?: string;
  /** Floor for the reserved height (px) when the code declares no sizes. */
  minHeight?: number;
}) {
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    const isDesktop =
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 768px)").matches;
    setCode((isDesktop ? desktop : mobile) || desktop || mobile || null);
  }, [desktop, mobile]);

  if (!desktop && !mobile) return null;

  // Both heights are resolved during the server render, so the box is already
  // the right size in the first painted frame.
  const mobileHeight = reservedHeight(mobile || desktop, minHeight);
  const desktopHeight = reservedHeight(desktop || mobile, minHeight);

  return (
    <div className="my-4 w-full">
      {/* Light-gray highlight box around the ad area (same as dinamani's
          bg-gray-100 wrapper) so the slot reads as an ad placement. */}
      <div className="bg-F3F4F6 p-[5px]">
        <div
          className="flex w-full justify-center overflow-hidden h-[var(--ad-h-m)] md:h-[var(--ad-h-d)]"
          style={
            {
              "--ad-h-m": `${mobileHeight}px`,
              "--ad-h-d": `${desktopHeight}px`,
            } as React.CSSProperties
          }
          aria-label="Advertisement"
        >
          {code && (
            <RawEmbed embedJs={code} raw className="w-full [&>div]:mx-auto" />
          )}
        </div>
        {/* "Advertise with us" inquiry trigger under the ad (dinamani port).
            Rendered unconditionally — gating it on `code` made it appear only
            after hydration, which shifted everything below the slot. */}
        <div className="mt-1 flex justify-center">
          <AdvertisePopup />
        </div>
      </div>
    </div>
  );
}

/**
 * Tallest creative height an ad code declares, e.g. the 300 in
 * `defineSlot('/…', [[300, 300], [336, 280], [300, 250]], '…')`. Falls back to
 * `floor` when the code declares nothing parseable (plain HTML creatives).
 */
function reservedHeight(code: string | undefined, floor: number): number {
  if (!code) return floor;
  let tallest = 0;
  for (const m of code.matchAll(/\[\s*(\d{2,4})\s*,\s*(\d{2,4})\s*\]/g)) {
    const height = Number(m[2]);
    if (Number.isFinite(height) && height > tallest) tallest = height;
  }
  return Math.max(floor, tallest);
}
