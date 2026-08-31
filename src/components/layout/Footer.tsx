import Link from "next/link";

import SocialIconsHeadeer from "@/components/ui/SocialIconsHeadeer";
import type {
  FooterLink,
  FooterNewsItem,
  FooterView,
} from "@/lib/builder/header-footer";

const LOGO_URL =
  "https://media.kannadaprabha.com/kannadaprabha/2026-08-11/lnydjlev/kp-logo-1.jpeg";

/** Fallback link columns shown until the builder provides footer groups. */
const FALLBACK_LINK_COLUMNS = [
  [
    "ದಿ ನ್ಯೂ ಇಂಡಿಯನ್ ಎಕ್ಸ್‌ಪ್ರೆಸ್",
    "ಡೈನಂದಿನ",
    "ಸಮಾಲೋಚ ಮಲಯಾಳಂ",
    "ಇಂಡಲ್ ಎಕ್ಸ್‌ಪ್ರೆಸ್",
  ],
  [
    "ಎಕ್ಸ್‌ಪ್ರೆಸ್",
    "ಸಿನಿಮಾ ಎಕ್ಸ್‌ಪ್ರೆಸ್",
    "ಈವೆಂಟ್‌ಎಕ್ಸ್‌ಪ್ರೆಸ್",
    "ದಿ ಮಾರ್ನಿಂಗ್ ಸ್ಟ್ಯಾಂಡರ್ಡ್",
    "TNIE ಇ-ಪೇಪರ್",
  ],
  [
    "ದಿನಮಣಿ ಇ-ಪತ್ರಿಕೆ",
    "ಮಲಯಾಳಂ ಸಾಪ್ತಾಹಿಕ ಇ-ಪತ್ರಿಕೆ",
    "ಇ-ಪತ್ರಿಕೆಯನ್ನು ಆನಂದಿಸಿ",
    "ನಮ್ಮ ಬಗ್ಗೆ",
  ],
].map((column) => column.map((label) => ({ label, url: "#" }) as FooterLink));

const FALLBACK_RECENT_TITLE = "ದಿನಮಣಿ ಇ-ಪತ್ರಿಕೆ";

const FALLBACK_RECENT_NEWS = [
  "FIFA ವಿಶ್ವಕಪ್ ವಿಶೇಷ ರಷ್ಯಾ ಸ್ಪರ್ಧೆ ಆರಂಭ.",
  "ತಾಯಿಯ ಆರೋಗ್ಯ ರಕ್ಷೆಯ ಭವಿಷ್ಯ: ವಿಜ್ಞಾನರ್ ರಾಜ್ಯ ಮತ್ತು ಬಲವಾದ ಸಾಮಾಜಿಕ ಆಸರೆ, ಜೀವಗಳನ್ನು ಉಳಿಸಬಹುದು.",
  "ಮೂಡಲ್ ಹೆಲ್ತ್‌ನಿಂದ ರಿಜಿಸ್ಟರ್ ಮಾಡಲು ಇಲ್ಲಿ ಉನ್ನತ ಸಾಧ್ಯತೆಗಾಗಿ ಬುದ್ಧಿ ನೀಡುವ ಶಿಕ್ಷಣ ಬಗ್ಗೆ ಹೆಚ್ಚಿನ ಮಾಹಿತಿ.",
];

const FALLBACK_QUICK_LINKS: FooterLink[] = [
  "ಇಂಡಲ್ ಎಕ್ಸ್‌ಪ್ರೆಸ್",
  "ಈವೆಂಟ್‌ಎಕ್ಸ್‌ಪ್ರೆಸ್",
  "ಎಕ್ಸ್‌ಪ್ರೆಸ್",
].map((label) => ({ label, url: "#" }));

/** External (absolute) URLs open in a new tab; internal paths use next/link. */
function linkTarget(link: FooterLink): string | undefined {
  if (link.openInNewTab) return "_blank";
  return /^https?:\/\//i.test(link.url) ? "_blank" : undefined;
}

/** Distribute items left-to-right into up to `columnCount` balanced columns. */
function splitIntoColumns<T>(items: T[], columnCount: number): T[][] {
  const cols = Math.max(1, columnCount);
  if (items.length === 0) return [];
  const size = Math.ceil(items.length / cols);
  return Array.from({ length: cols }, (_, i) =>
    items.slice(i * size, (i + 1) * size),
  ).filter((column) => column.length > 0);
}

export default function Footer({ footer }: { footer?: FooterView | null }) {
  const logoUrl = footer?.logoUrl || LOGO_URL;
  const logoDarkUrl = footer?.logoDarkUrl;
  const logoAlt = footer?.logoAlt || "ಕನ್ನಡಪ್ರಭ";

  // Builder groups become the left link columns; fall back to the static set.
  const linkColumns =
    footer?.groups && footer.groups.length > 0
      ? footer.groups.map((group) => group.links)
      : FALLBACK_LINK_COLUMNS;

  // Right-side "recent news" panel: use the builder-fetched list when present,
  // otherwise the static fallback headlines. Split across the configured columns.
  const recentNews = footer?.recentNews;
  const recentTitle = recentNews?.title || FALLBACK_RECENT_TITLE;
  const newsItems: FooterNewsItem[] =
    recentNews?.items && recentNews.items.length > 0
      ? recentNews.items
      : FALLBACK_RECENT_NEWS.map((title) => ({ title, url: "#" }));
  const newsColumns = splitIntoColumns(newsItems, recentNews?.columns ?? 2);

  const quickLinks =
    footer?.quickLinks && footer.quickLinks.length > 0
      ? footer.quickLinks
      : FALLBACK_QUICK_LINKS;
  const separator = footer?.bottomBarSeparator ?? "|";
  const copyright = footer?.copyrightText || "© kannadaprabha 2026";

  return (
    <footer className="w-full border-t border-DFDFDF bg-F9F9F9">
      <div className="w-full px-4 sm:px-6 lg:px-[60px] py-8">
        <div className="flex items-center justify-between gap-8">
          <Link href="/" aria-label="Kannada Prabha home" className="block">
            <img
              src={logoUrl}
              alt={logoAlt}
              width={501}
              height={130}
              loading="lazy"
              decoding="async"
              className={`h-auto w-[195px] ${logoDarkUrl ? "dark:hidden" : ""}`}
            />
            {logoDarkUrl && (
              <img
                src={logoDarkUrl}
                alt={logoAlt}
                width={501}
                height={130}
                loading="lazy"
                decoding="async"
                className="hidden h-auto w-[195px] dark:block"
              />
            )}
          </Link>

          <SocialIconsHeadeer links={footer?.social} className="gap-[20px]" />
        </div>

        <div className="mt-8 border-t border-DFDFDF pt-6">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_1.15fr]">
            <div className="grid gap-x-5 gap-y-0 sm:grid-cols-3">
              {linkColumns.map((column, columnIndex) => (
                <div key={columnIndex} className="grid content-start">
                  {column.map((item, itemIndex) => (
                    <Link
                      key={`${item.label}-${itemIndex}`}
                      href={item.url || "#"}
                      target={linkTarget(item)}
                      rel={linkTarget(item) ? "noopener noreferrer" : undefined}
                      className="flex min-h-[50px] items-center border-b border-DFDFDF text-16-inter-500 leading-[1.25] text-000000"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>

            <div className="grid content-start">
              <h2 className="flex min-h-[50px] items-center border-b border-DFDFDF text-16-inter-700 leading-[1.25] text-000000">
                {recentTitle}
              </h2>

              <div className="grid gap-x-5 gap-y-0 md:grid-cols-2">
                {newsColumns.map((column, columnIndex) => (
                  <div key={columnIndex} className="grid content-start">
                    {column.map((item, itemIndex) => (
                      <Link
                        key={`${columnIndex}-${itemIndex}`}
                        href={item.url || "#"}
                        target={
                          /^https?:\/\//i.test(item.url) ? "_blank" : undefined
                        }
                        rel={
                          /^https?:\/\//i.test(item.url)
                            ? "noopener noreferrer"
                            : undefined
                        }
                        className="flex min-h-[50px] items-center border-b border-DFDFDF text-16-inter-500 leading-[1.25] text-000000"
                      >
                        {item.title}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 text-16-inter-500 leading-none text-000000 sm:flex-row sm:items-center sm:justify-between">
          <nav className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {quickLinks.map((item, index) => (
              <Link
                key={`${item.label}-${index}`}
                href={item.url || "#"}
                target={linkTarget(item)}
                rel={linkTarget(item) ? "noopener noreferrer" : undefined}
                className="hover:underline"
              >
                {item.label}
                {index < quickLinks.length - 1 ? (
                  <span className="ml-3">{separator}</span>
                ) : null}
              </Link>
            ))}
          </nav>

          <p className="text-16-inter-500 text-000000">{copyright}</p>
        </div>
      </div>
    </footer>
  );
}
