"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import RawEmbed from "@/components/article/elements/RawEmbed";
import { extractAnchorAdUnit, injectAnchorAd } from "@/lib/ads/anchor";
import {
  getAdPlacements,
  type AdPlacement,
  type PageType,
} from "@/lib/builder/ad-codes";
import { getLayoutCodePlacements } from "@/lib/builder/layout-codes";

/**
 * Global positional ad codes rendered site-wide (via SiteChrome). Fully
 * data-driven: `getAdPlacements()` discovers EVERY configured slot for the page
 * type, so any ad code added in the builder renders here automatically. Known
 * kinds get a dedicated placement (Top above header, LHS/RHS rails, Sticky /
 * Anchor bottom bars, Interstitial out-of-page); anything new renders as a
 * centered in-flow banner. gpt.js is in the <head>; unfilled slots collapse
 * (collapseEmptyDivs) so they never leave white space. Client-only.
 */

/**
 * GPT native bottom anchor (dinamani behaviour): renders nothing itself.
 * On the first REAL user scroll it defines the extracted ad unit as an
 * OutOfPageFormat.BOTTOM_ANCHOR slot — GPT's own bar slides up from the
 * bottom and carries the native collapse chevron for a gentle dismiss.
 */
function AnchorAd({
  desktop,
  mobile,
  pathname,
}: {
  desktop?: string;
  mobile?: string;
  pathname: string;
}) {
  useEffect(() => {
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    const code = (isDesktop ? desktop : mobile) || desktop || mobile;
    const adUnitPath = extractAnchorAdUnit(code || "");
    if (!adUnitPath) return;

    // Wait for a user-initiated scroll before defining the anchor slot:
    //  1. Attach the listener after 500ms — skips the browser's automatic
    //     scroll-to-top on soft navigation between pages.
    //  2. Only trigger once the user moved >= 50px from the baseline captured
    //     at attach time — rejects spurious scroll events fired during
    //     layout/font loading.
    let triggered = false;
    let baselineScrollY = 0;

    const onScroll = () => {
      if (triggered) return;
      if (Math.abs(window.scrollY - baselineScrollY) < 50) return;
      triggered = true;
      window.removeEventListener("scroll", onScroll);
      injectAnchorAd(adUnitPath);
    };

    const attachTimer = setTimeout(() => {
      baselineScrollY = window.scrollY;
      window.addEventListener("scroll", onScroll, { passive: true });
    }, 500);

    return () => {
      clearTimeout(attachTimer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [desktop, mobile, pathname]);

  return null;
}

function AdInject({
  desktop,
  mobile,
  className,
  strictDevice = false,
}: {
  desktop?: string;
  mobile?: string;
  className?: string;
  /** Don't fall back to the other device's code (top leaderboard: a 970px
   *  desktop banner on a phone overflows and shifts the whole page). */
  strictDevice?: boolean;
}) {
  // Device code is chosen on the client (SSR renders nothing — ads are
  // client-only), so a single GPT request goes out per slot.
  const [picked, setPicked] = useState<string | null>(null);
  useEffect(() => {
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    const own = isDesktop ? desktop : mobile;
    setPicked(strictDevice ? own || null : own || desktop || mobile || null);
  }, [desktop, mobile, strictDevice]);

  if (!desktop && !mobile) return null;
  return (
    <div className={className} aria-label="Advertisement">
      {picked && <RawEmbed embedJs={picked} raw className="[&>div]:mx-auto" />}
    </div>
  );
}

export default function LayoutAds({
  config,
  layoutCodes,
  pageType = "sectionPage",
  part = "rest",
}: {
  config?: Record<string, unknown>;
  /** GAM/GPT layout codes (header+body snippets), rendered through the same pipeline. */
  layoutCodes?: Record<string, unknown>;
  pageType?: PageType;
  /** "top" = the leaderboard rendered ABOVE the header; "rest" = everything else. */
  part?: "top" | "rest";
}) {
  const [stickyClosed, setStickyClosed] = useState(false);
  const pathname = usePathname();
  const placements = [
    ...getAdPlacements(config, pageType, pathname),
    ...getLayoutCodePlacements(layoutCodes, pageType),
  ];
  if (placements.length === 0) return null;

  const of = (kind: AdPlacement["kind"]) =>
    placements.filter((p) => p.kind === kind);

  // ── Top leaderboard — placed above the header by SiteChrome. ──────────────
  if (part === "top") {
    return (
      <>
        {of("top").map((p) => (
          <AdInject
            key={p.position}
            desktop={p.desktop}
            mobile={p.mobile}
            strictDevice
            // Reserve the leaderboard height on desktop from SSR so the filled
            // ad doesn't push the whole page down (CLS). Mobile reserves only
            // when a mobile code exists (no cross-device fallback).
            className={
              "flex w-full justify-center overflow-hidden" +
              (p.desktop ? " md:min-h-[90px]" : "") +
              (p.mobile ? " max-md:min-h-[50px]" : "")
            }
          />
        ))}
      </>
    );
  }

  const sticky = of("sticky");
  const anchor = of("anchor");
  const generic = of("generic");

  return (
    <>
      {/* LHS / RHS skyscrapers — fixed rails on very wide screens. */}
      {of("lhs").map((p) => (
        <AdInject
          key={p.position}
          desktop={p.desktop}
          mobile={p.mobile}
          className="fixed left-2 top-28 z-40 hidden overflow-hidden [@media(min-width:1440px)]:block"
        />
      ))}
      {of("rhs").map((p) => (
        <AdInject
          key={p.position}
          desktop={p.desktop}
          mobile={p.mobile}
          className="fixed right-2 top-28 z-40 hidden overflow-hidden [@media(min-width:1440px)]:block"
        />
      ))}

      {/* Generic (any NEW position added in the builder) — centered in-flow banner. */}
      {generic.length > 0 && (
        <div className="flex flex-col items-center gap-2">
          {generic.map((p) => (
            <AdInject
              key={p.position}
              desktop={p.desktop}
              mobile={p.mobile}
              className="flex w-full justify-center overflow-hidden"
            />
          ))}
        </div>
      )}

      {/* Sticky bottom bar with a close button. Yields to the anchor when an
          anchor code exists for this page — both live at the viewport bottom. */}
      {sticky.length > 0 && anchor.length === 0 && !stickyClosed && (
        <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center border-t border-DFDFDF bg-FFFFFF/95 py-1 backdrop-blur">
          <button
            type="button"
            onClick={() => setStickyClosed(true)}
            aria-label="Close ad"
            className="absolute -top-6 right-2 grid h-6 w-10 place-items-center rounded-t border border-b-0 border-DFDFDF bg-FFFFFF/95 text-14-inter-600 text-6D6D6D"
          >
            ✕
          </button>
          {sticky.map((p) => (
            <AdInject
              key={p.position}
              desktop={p.desktop}
              mobile={p.mobile}
              className="flex w-full justify-center overflow-hidden"
            />
          ))}
        </div>
      )}

      {/* Anchor — GPT native BOTTOM_ANCHOR, defined on first user scroll so it
          slides up from the bottom with GPT's own collapse/close chevron. */}
      {anchor.map((p) => (
        <AnchorAd
          key={p.position}
          desktop={p.desktop}
          mobile={p.mobile}
          pathname={pathname}
        />
      ))}

      {/* Interstitial — GPT out-of-page; zero-size hidden container. */}
      {of("interstitial").map((p) => (
        <AdInject
          key={p.position}
          desktop={p.desktop}
          mobile={p.mobile}
          className="absolute h-0 w-0 overflow-hidden"
        />
      ))}
    </>
  );
}
