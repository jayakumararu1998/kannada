import { SITE_URL } from "@/lib/constants";

const SITE_HOST = (() => {
  try {
    return new URL(SITE_URL).host;
  } catch {
    return "www.kannadaprabha.com";
  }
})();

/**
 * Prepare a Quintype rich-text HTML fragment for `dangerouslySetInnerHTML`:
 *  - rewrite same-site absolute links to root-relative (client-side nav, no
 *    full reload)
 *  - force cross-site links to open safely in a new tab
 * Intentionally light: Quintype already returns sanitized editorial HTML.
 */
export function prepareArticleHtml(html?: string): string {
  if (!html) return "";
  return html.replace(
    /<a\s+([^>]*?)href=(["'])(.*?)\2([^>]*)>/gi,
    (_m, pre: string, q: string, href: string, post: string) => {
      let newHref = href;
      let target = "";
      try {
        if (/^https?:\/\//i.test(href)) {
          const u = new URL(href);
          if (u.host === SITE_HOST) {
            newHref = u.pathname + u.search + u.hash;
          } else {
            target = ' target="_blank" rel="noopener noreferrer"';
          }
        }
      } catch {
        /* leave href as-is */
      }
      return `<a ${pre}href=${q}${newHref}${q}${post}${target}>`;
    },
  );
}

/** Strip tags to plain text (captions, alt fallbacks). */
export function stripTags(html?: string): string {
  return (html ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}
