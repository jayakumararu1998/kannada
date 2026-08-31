/**
 * GPT native anchor-ad helpers (ported from dinamani's gpt-loader).
 *
 * The CMS stores anchor codes as regular marker-div + defineSlot templates,
 * but rendering those in a fixed bar gives a static always-on strip. Instead we
 * ignore the template and define the extracted ad unit as a GPT
 * OutOfPageFormat.BOTTOM_ANCHOR slot: GPT renders its own bottom bar that
 * slides up when the slot is defined (we define it on the first user scroll)
 * and carries the native collapse chevron so users can dismiss it gently.
 */

/**
 * Extract the ad unit path from a stored anchor ad code. Accepts a bare unit
 * path ('/network/AdUnit'), or a full HTML template containing either
 * `googletag.defineOutOfPageSlot('/network/AdUnit', …)` (dinamani form) or
 * `googletag.defineSlot('/network/AdUnit', sizes, divId)` (kannadaprabha form).
 */
export function extractAnchorAdUnit(adCode: string): string | null {
  if (!adCode) return null;
  const trimmed = adCode.trim();
  if (
    trimmed.startsWith("/") &&
    !trimmed.includes("<") &&
    !trimmed.includes("googletag")
  ) {
    return trimmed;
  }
  const m = trimmed.match(/define(?:OutOfPage)?Slot\(\s*['"]([^'"]+)['"]/);
  return m ? m[1] : null;
}

// Ad units already defined as anchor slots this session — GPT silently drops
// duplicate defineOutOfPageSlot calls, so re-injection refreshes instead.
const definedAnchorUnits = new Set<string>();

/**
 * Define and display a BOTTOM_ANCHOR slot for the given ad unit path. Using
 * googletag.enums.OutOfPageFormat.BOTTOM_ANCHOR lets GPT request anchor
 * inventory directly — no legacy out-of-page creative trafficking required.
 */
export function injectAnchorAd(adUnitPath: string): void {
  if (!adUnitPath) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const googletag = ((window as any).googletag = (window as any).googletag || {
    cmd: [],
  });
  googletag.cmd = googletag.cmd || [];

  googletag.cmd.push(() => {
    try {
      if (definedAnchorUnits.has(adUnitPath)) {
        const existing = googletag
          .pubads()
          .getSlots()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .find((s: any) => s.getAdUnitPath() === adUnitPath);
        if (existing) {
          googletag.pubads().refresh([existing]);
          return;
        }
      }

      const fmt = googletag.enums?.OutOfPageFormat?.BOTTOM_ANCHOR;
      if (fmt === undefined) return;

      const slot = googletag.defineOutOfPageSlot(adUnitPath, fmt);
      // Slot is null on unsupported pages (e.g. missing viewport meta).
      if (!slot) return;

      slot.addService(googletag.pubads());
      googletag.enableServices();
      googletag.display(slot);
      definedAnchorUnits.add(adUnitPath);
    } catch {
      // Swallow — GPT errors here would just leave the anchor unfilled.
    }
  });
}
