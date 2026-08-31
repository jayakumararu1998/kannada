"use client";

import type { InArticleAdSlot } from "@/lib/article/inline-ads";
import RawEmbed from "./RawEmbed";

/**
 * Renders one configured in-article ad slot at its paragraph position.
 * Branches on `contentType` (default 'ad'):
 *   - image → a device image (optional click-through)
 *   - html  → raw custom HTML (scripts executed)
 *   - ad    → raw ad markup (scripts executed) — note: kannadaprabha has no GPT
 *     loader, so a GPT `defineSlot` code needs googletag on the page to fill;
 *     the slot + any inline scripts still render at the correct position.
 * Prefers the desktop field, falling back to mobile (single render → scripts
 * execute once).
 */
export default function InArticleAd({
  slot,
}: {
  slot: InArticleAdSlot;
  /** paragraph index — kept for parity / potential unique-id use */
  adIndex?: number;
}) {
  const type = slot.contentType || "ad";

  if (type === "image") {
    const src = slot.desktopImage || slot.mobileImage || slot.imageLinkUrl;
    if (!src) return null;
    // imageLinkUrl doubles as the src when no dedicated image is set — only a
    // click-through when a real image src is present.
    const link = slot.desktopImage || slot.mobileImage ? slot.imageLinkUrl : undefined;
    const img = (
      <img src={src} alt="" className="mx-auto h-auto w-full max-w-[336px]" />
    );
    return (
      <div className="my-4 flex w-full justify-center">
        {link ? (
          <a href={link} target="_blank" rel="noopener noreferrer">
            {img}
          </a>
        ) : (
          img
        )}
      </div>
    );
  }

  const code =
    type === "html"
      ? slot.desktopHtml || slot.mobileHtml || slot.html
      : slot.desktopCode || slot.mobileCode;
  if (!code) return null;

  return (
    <div className="my-4 flex w-full justify-center">
      <RawEmbed embedJs={code} raw className="w-full" />
    </div>
  );
}
