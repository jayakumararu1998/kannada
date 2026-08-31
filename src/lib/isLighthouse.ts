/**
 * Lighthouse / PageSpeed Insights / synthetic-monitor detection (dinamani parity).
 *
 * Synthetic requests must never be served from (or written to) the CDN cache —
 * a cached synthetic response served to a real user would drop ads/analytics.
 * The middleware forces these to origin with `no-store`.
 *
 * Patterns: Lighthouse / Chrome-Lighthouse / PageSpeed(-Insights) / HeadlessChrome /
 * GoogleOther / GTmetrix / WebPageTest / Pingdom / SpeedCurve / Calibre / DebugBear /
 * the literal "headless" token, plus PSI's mobile-emulation UA "moto g power (2022)".
 */
const LIGHTHOUSE_UA_PATTERN =
  /(?:\b(?:Lighthouse|Chrome-Lighthouse|PageSpeed(?:-Insights)?|HeadlessChrome|GoogleOther|GTmetrix|WebPageTest|Pingdom|SpeedCurve|Calibre|DebugBear|headless)\b|moto g power \(2022\))/i;

export function isLighthouseUA(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  return LIGHTHOUSE_UA_PATTERN.test(userAgent);
}

/**
 * Client-side synthetic-run detection (dinamani parity). navigator.webdriver is
 * set by Puppeteer / Lighthouse / Selenium and almost never in real browsers.
 */
export function isLighthouseClient(): boolean {
  if (typeof navigator === "undefined") return false;
  if (navigator.webdriver === true) return true;
  return isLighthouseUA(navigator.userAgent);
}
