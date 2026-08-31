"use client";

import Link from "@/components/ui/PrefetchLink";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import AccountButton from "@/components/layout/AccountButton";
import SocialIconsHeadeer from "@/components/ui/SocialIconsHeadeer";
import ThemeToggle from "@/components/ui/ThemeToggle";
import TrendingTags from "@/components/ui/TrendingTags";
import type {
  HeaderLink,
  HeaderNavLink,
  HeaderView,
} from "@/lib/builder/header-footer";

const LOGO_URL =
  "https://media.kannadaprabha.com/kannadaprabha/2026-08-11/lnydjlev/kp-logo-1.jpeg";

/** Fallback subscribe CTA shown until the builder provides header buttons. */
const FALLBACK_BUTTONS: NonNullable<HeaderView["buttons"]> = [
  { label: "ಚಂದಾದಾರರಾಗಿ", url: "#", style: "primary" },
];

/** Fallback language strip shown until the builder provides top-bar links. */
const FALLBACK_LANGUAGES: HeaderLink[] = [
  "ಕನ್ನಡ",
  "ಮಲಯಾಳಂ",
  "తెలుగు",
  "தமிழ்",
  "English",
].map((label) => ({ label, url: "#" }));

/** Fallback account entry shown until the builder provides one. */
const FALLBACK_ACCOUNT_LABEL = "ಹಬಳಕ";

/** Default date / time patterns when the builder doesn't supply a format. */
const DEFAULT_DATE_PATTERN = "dd MMMM yyyy";
const DEFAULT_TIME_PATTERN = "hh:mm a";

/** Token letters that belong to the time half of a builder date/time pattern. */
const TIME_TOKENS = /[Hhmsa]/;

/**
 * Split a builder pattern ("dd MMMM yyyy, hh:mm a") into its date and time
 * halves so the header can keep rendering the date bold and the time plain.
 */
function splitPattern(format?: string): { date: string; time: string } {
  if (!format) return { date: DEFAULT_DATE_PATTERN, time: DEFAULT_TIME_PATTERN };
  let cut = -1;
  for (let i = 0; i < format.length; i += 1) {
    if (TIME_TOKENS.test(format[i])) {
      cut = i;
      break;
    }
  }
  if (cut < 0) return { date: format.trim(), time: "" };
  return {
    date: format.slice(0, cut).replace(/[\s,;|/-]+$/, "").trim(),
    time: format.slice(cut).trim(),
  };
}

/** Resolve one pattern token ("MMMM", "hh", …) against a date for a locale. */
function tokenValue(token: string, date: Date, locale: string): string | null {
  const part = (
    options: Intl.DateTimeFormatOptions,
    type: Intl.DateTimeFormatPartTypes,
  ) =>
    new Intl.DateTimeFormat(locale, options)
      .formatToParts(date)
      .find((p) => p.type === type)?.value ?? "";

  switch (token) {
    case "yyyy":
      return part({ year: "numeric" }, "year");
    case "yy":
      return part({ year: "2-digit" }, "year");
    case "MMMM":
      return part({ month: "long" }, "month");
    case "MMM":
      return part({ month: "short" }, "month");
    case "MM":
      return part({ month: "2-digit" }, "month");
    case "M":
      return part({ month: "numeric" }, "month");
    case "dd":
      return part({ day: "2-digit" }, "day");
    case "d":
      return part({ day: "numeric" }, "day");
    case "EEEE":
      return part({ weekday: "long" }, "weekday");
    case "EEE":
      return part({ weekday: "short" }, "weekday");
    case "HH":
      return part({ hour: "2-digit", hour12: false }, "hour");
    case "H":
      return part({ hour: "numeric", hour12: false }, "hour");
    case "hh":
      return part({ hour: "2-digit", hour12: true }, "hour");
    case "h":
      return part({ hour: "numeric", hour12: true }, "hour");
    case "mm":
    case "m":
      return part({ hour: "numeric", minute: "2-digit" }, "minute");
    case "ss":
    case "s":
      return part({ minute: "numeric", second: "2-digit" }, "second");
    case "a":
      return part({ hour: "numeric", hour12: true }, "dayPeriod");
    default:
      return null;
  }
}

/** Format a date with a builder pattern; unknown runs pass through literally. */
function formatPattern(date: Date, locale: string, pattern: string): string {
  if (!pattern) return "";
  return pattern.replace(/([EyMdHhmsa])\1*/g, (token) => {
    const value = tokenValue(token, date, locale);
    return value === null ? token : value;
  });
}

/**
 * Live date/time strip in the header top bar. Formatted client-side after mount
 * (so there's no SSR/CSR hydration mismatch) using the builder's locale and
 * format pattern. Renders nothing until mounted or when `enabled` is false.
 */
function HeaderDateTime({
  enabled,
  locale,
  format,
  className,
}: {
  enabled: boolean;
  locale?: string;
  format?: string;
  /** Visibility/layout override — defaults to the desktop top-bar cell. */
  className?: string;
}) {
  const [now, setNow] = useState<{ date: string; time: string } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const loc = locale === "kn" ? "kn-IN" : locale || "en-IN";
    const patterns = splitPattern(format);
    const update = () => {
      const d = new Date();
      setNow({
        date: formatPattern(d, loc, patterns.date),
        time: formatPattern(d, loc, patterns.time),
      });
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [enabled, locale, format]);

  // The box is IDENTICAL whether or not the clock has resolved: the strip is
  // formatted client-side after mount, and an empty-then-filled row pushed
  // every page below it down by ~18px on phones — the single largest CLS
  // contributor measured on mobile. `min-h-[18px]` reserves one 12px line.
  return (
    <div
      className={`min-h-[18px] items-center gap-2 font-manrope ${className ?? "hidden md:flex"}`}
      aria-hidden={now ? undefined : "true"}
      suppressHydrationWarning
    >
      {now && (
        <>
          <span className="font-bold">{now.date}</span>
          <span>{now.time}</span>
        </>
      )}
    </div>
  );
}

export type HeaderNavItem = {
  title: string;
  url: string;
  children?: HeaderNavItem[];
};

/** Builder-authored nav links → the component's nav shape. */
function fromBuilderNav(items: HeaderNavLink[] | undefined): HeaderNavItem[] {
  return (items ?? []).map((item) => ({
    title: item.label,
    url: item.url,
    children: item.children ? fromBuilderNav(item.children) : undefined,
  }));
}

/** External (absolute) URLs open in a new tab; internal paths stay in place. */
function linkTarget(link: { url: string; openInNewTab?: boolean }) {
  if (link.openInNewTab) return "_blank";
  return /^https?:\/\//i.test(link.url) ? "_blank" : undefined;
}

/** True when the current path matches this item (or one of its children). */
function navActive(pathname: string, item: HeaderNavItem): boolean {
  const u = item.url;
  if (u && u !== "#") {
    if (pathname === u || pathname.startsWith(`${u}/`)) return true;
  }
  return (item.children ?? []).some(
    (c) => c.url && c.url !== "#" && (pathname === c.url || pathname.startsWith(`${c.url}/`)),
  );
}

function splitIntoColumns<T>(items: T[], columnCount: number): T[][] {
  if (items.length === 0) return [];
  const size = Math.ceil(items.length / columnCount);
  return Array.from({ length: columnCount }, (_, index) =>
    items.slice(index * size, (index + 1) * size),
  ).filter((column) => column.length > 0);
}

function ChevronDown() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="ml-1 h-3 w-3" fill="none">
      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Fallback nav shown until a dynamic menu is synced from the builder/Quintype. */
const FALLBACK_NAV: HeaderNavItem[] = [
  "ಹೊಂಬೆಳಕು",
  "ಬ್ರೇಕಿಂಗ್ ಅಲರ್ಟ್",
  "ಮಂಗಳೂರು",
  "ಶಿವ",
  "ಡೆಂಜೋಬ್ಲಿ",
  "ಫುಟ್ಬಾಲ್",
  "ಮತಿಕ್ಷ",
  "ಕರ್ನಾಟಕ",
  "ಅಮೆರ",
].map((title) => ({ title, url: "#" }));

function MenuIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path
        d="M4 7H20M4 12H20M4 17H20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path
        d="M6 6L18 18M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path
        d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15ZM16.2 16.2 21 21"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Header({
  menu,
  header,
}: {
  menu?: HeaderNavItem[];
  header?: HeaderView | null;
}) {
  const [activeMenu, setActiveMenu] = useState<"left" | "right" | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  // Index of the nav item whose submenu is open on touch devices (no hover
  // there, and the per-item hover dropdown is clipped by the scroll strip) —
  // a tap opens a full-width panel under the nav bar instead.
  const [mobileSubmenu, setMobileSubmenu] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [navPinned, setNavPinned] = useState(false);
  const pathname = usePathname() || "/";
  const router = useRouter();

  /** Submit the header search → navigate to the `/search/{query}` page. */
  function submitSearch() {
    const q = searchTerm.trim();
    if (!q) return;
    setSearchOpen(false);
    setSearchTerm("");
    router.push(`/search/${encodeURIComponent(q)}`);
  }
  const leftMenuPanelRef = useRef<HTMLDivElement>(null);
  const rightMenuPanelRef = useRef<HTMLDivElement>(null);
  const searchPanelRef = useRef<HTMLDivElement>(null);
  const leftMenuButtonRef = useRef<HTMLButtonElement>(null);
  const rightMenuButtonRef = useRef<HTMLButtonElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const navSentinelRef = useRef<HTMLDivElement>(null);

  // Dynamic chrome from the builder, with graceful fallbacks everywhere.
  const topBar = header?.topBar;
  const mainBar = header?.mainBar;
  const navBar = header?.navBar;
  const account = mainBar?.account;

  const logoUrl = header?.logoUrl || LOGO_URL;
  const logoDarkUrl = header?.logoDarkUrl;
  const logoAlt = header?.logoAlt || "ಕನ್ನಡಪ್ರಭ";
  const ctaButtons =
    header?.buttons && header.buttons.length > 0
      ? header.buttons
      : FALLBACK_BUTTONS;
  const dateTimeEnabled = header?.dateTime?.enabled ?? true;
  const dateTimeLocale = header?.dateTime?.locale;
  const dateTimeFormat = header?.dateTime?.format;

  const topBarEnabled = topBar?.enabled ?? true;
  const showTopBarSocial = topBar?.showSocialLinks ?? true;
  const languageLinks = topBar?.languageLinks?.length
    ? topBar.languageLinks
    : FALLBACK_LANGUAGES;

  const showMenuButton = mainBar?.showMenuButton ?? true;
  const showSearch = mainBar?.showSearch ?? true;
  const showThemeToggle = mainBar?.showThemeToggle ?? true;
  const accountEnabled = account?.enabled ?? true;
  const accountLabel = account?.label || FALLBACK_ACCOUNT_LABEL;
  const logoAlign = mainBar?.logoAlign ?? "center";

  // Builder-authored nav wins; otherwise the synced Quintype menu; then static.
  const builderNav = fromBuilderNav(navBar?.items);
  const navItems =
    builderNav.length > 0 ? builderNav : menu && menu.length > 0 ? menu : FALLBACK_NAV;
  const megaMenuColumns = splitIntoColumns(navItems, 4);
  const navEnabled = navBar?.enabled ?? true;
  const navSticky = navBar?.sticky ?? true;
  // The strip shows at most `maxVisibleItems`; the rest stay in the mega menu.
  const visibleNavItems = navBar?.maxVisibleItems
    ? navItems.slice(0, navBar.maxVisibleItems)
    : navItems;

  useEffect(() => {
    setActiveMenu(null);
    setSearchOpen(false);
    setMobileSubmenu(null);
  }, [pathname]);

  // Close the tap-opened submenu panel when tapping anywhere else. Parent
  // toggles and the panel itself are exempt (mousedown fires before click —
  // closing here first would break the toggle/navigation click).
  useEffect(() => {
    if (mobileSubmenu === null) return;
    function onDown(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-submenu-parent]")) return;
      if (target.closest("[data-submenu-panel]")) return;
      setMobileSubmenu(null);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [mobileSubmenu]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;

      const clickedMenuToggle =
        leftMenuButtonRef.current?.contains(target) ||
        rightMenuButtonRef.current?.contains(target);
      const clickedSearchToggle = searchButtonRef.current?.contains(target);
      const clickedInsideMenu =
        leftMenuPanelRef.current?.contains(target) ||
        rightMenuPanelRef.current?.contains(target);
      const clickedInsideSearch = searchPanelRef.current?.contains(target);

      if (activeMenu && !clickedInsideMenu && !clickedMenuToggle) {
        setActiveMenu(null);
      }

      if (searchOpen && !clickedInsideSearch && !clickedSearchToggle) {
        setSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [activeMenu, searchOpen]);

  useEffect(() => {
    if (!navEnabled || !navSticky) {
      setNavPinned(false);
      return;
    }

    let frame = 0;
    const updatePinned = () => {
      frame = 0;
      const nextPinned = (navSentinelRef.current?.getBoundingClientRect().top ?? 1) <= 0;
      setNavPinned((current) => (current === nextPinned ? current : nextPinned));
    };
    const scheduleUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updatePinned);
    };

    updatePinned();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [navEnabled, navSticky]);

  function toggleMenu(anchor: "left" | "right") {
    setSearchOpen(false);
    setActiveMenu((open) => (open === anchor ? null : anchor));
  }

  function toggleSearch() {
    setSearchOpen((open) => {
      const next = !open;
      if (next) setActiveMenu(null);
      return next;
    });
  }

  function handleChromePointerDown(event: React.MouseEvent<HTMLElement>) {
    const target = event.target;
    if (!(target instanceof Node)) return;

    const clickedMenuToggle =
      leftMenuButtonRef.current?.contains(target) ||
      rightMenuButtonRef.current?.contains(target);
    const clickedSearchToggle = searchButtonRef.current?.contains(target);
    const clickedInsideMenu =
      leftMenuPanelRef.current?.contains(target) ||
      rightMenuPanelRef.current?.contains(target);
    const clickedInsideSearch = searchPanelRef.current?.contains(target);

    if (activeMenu && !clickedInsideMenu && !clickedMenuToggle) {
      setActiveMenu(null);
    }

    if (searchOpen && !clickedInsideSearch && !clickedSearchToggle) {
      setSearchOpen(false);
    }
  }

  return (
    <>
      <div className="relative w-full bg-FFFFFF">
        <header
          className="relative w-full border-6F6F6F border-b border-111111 bg-FFFFFF"
          onMouseDown={handleChromePointerDown}
        >
        {/* Group-sites strip — the FIRST row on phones (start-aligned,
            scrollable from the first site). From sm up the top bar below
            hosts these links instead. */}
        {topBarEnabled && (
          <nav
            aria-label="Group sites"
            className="flex items-center justify-start gap-4 overflow-x-auto whitespace-nowrap border-b border-DFDFDF bg-FFFFFF px-4 py-2 font-balootamma2 text-[12px] font-normal text-111111 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:hidden"
          >
            {languageLinks.map((language, index) => (
              <Link
                key={`m-${language.label}-${index}`}
                href={language.url || "#"}
                target={linkTarget(language)}
                rel={linkTarget(language) ? "noopener noreferrer" : undefined}
                className="shrink-0 underline-offset-2 hover:underline"
              >
                {language.label}
              </Link>
            ))}
          </nav>
        )}
        <div className="w-full px-4 sm:px-6 lg:px-[60px]">
          {topBarEnabled && (
            // Mobile hides the whole top bar — the group-sites strip renders
            // below the menu row instead, and date/time gets its own row.
            <div className="hidden min-h-[54px] grid-cols-1 items-center gap-2 py-2 text-[12px] text-111111 sm:grid sm:grid-cols-[1fr_auto] sm:gap-3 md:grid-cols-[1fr_auto_1fr] md:py-0">
              <HeaderDateTime
                enabled={dateTimeEnabled}
                locale={dateTimeLocale}
                format={dateTimeFormat}
              />

              <nav
                aria-label="Language selection"
                // justify-start on mobile: a centered flex that overflows clips
                // its START off-screen where no amount of scrolling can reach it
                // — start-aligned, the strip scrolls naturally from the first
                // group site. Desktop (where it fits) stays centered.
                className="flex max-w-full items-center justify-start gap-4 overflow-x-auto whitespace-nowrap px-1 pb-1 font-balootamma2 text-[12px] font-normal text-111111 [scrollbar-width:none] sm:justify-center sm:gap-[22px] md:pb-0 [&::-webkit-scrollbar]:hidden"
              >
                {languageLinks.map((language, index) => (
                  <Link
                    key={`${language.label}-${index}`}
                    href={language.url || "#"}
                    target={linkTarget(language)}
                    rel={linkTarget(language) ? "noopener noreferrer" : undefined}
                    className="shrink-0 underline-offset-2 hover:underline"
                  >
                    {language.label}
                  </Link>
                ))}
              </nav>

              {showTopBarSocial ? (
                <div className="hidden justify-center sm:justify-end md:flex">
                  <SocialIconsHeadeer
                    links={header?.social}
                    className="gap-3 sm:gap-[20px]"
                  />
                </div>
              ) : (
                // Keep the grid cell so the language nav stays centred.
                <div className="hidden md:block" aria-hidden="true" />
              )}
            </div>
          )}

          <div className="grid min-h-[60px] grid-cols-[1fr_auto_1fr] items-center gap-2 py-2 sm:min-h-[74px] sm:gap-3 sm:py-0">
            <div className="relative flex min-w-0 items-center gap-1.5 sm:gap-[14px]">
              {showMenuButton && (
                <button
                  ref={leftMenuButtonRef}
                  type="button"
                  aria-label={activeMenu === "left" ? "Close menu" : "Open menu"}
                  aria-expanded={activeMenu === "left"}
                  aria-controls="header-category-menu-left"
                  onClick={() => toggleMenu("left")}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center transition-colors ${
                    activeMenu === "left"
                      ? "text-[#07256D] dark:text-[#9db4d8]"
                      : "text-111111 hover:text-009EF9"
                  }`}
                >
                  {activeMenu === "left" ? <CloseIcon /> : <MenuIcon />}
                </button>
              )}

              {activeMenu === "left" && (
                <div
                  ref={leftMenuPanelRef}
                  id="header-category-menu-left"
                  className="absolute left-0 top-full z-[80] mt-3 w-[min(92vw,760px)] rounded-[4px] border border-[#14356F] bg-[#07256D] text-white shadow-[0_18px_44px_rgba(0,0,0,0.28)]"
                >
                  <div className="grid grid-cols-2 gap-5 p-5 lg:grid-cols-4">
                    {megaMenuColumns.map((column, columnIndex) => (
                      <div key={`left-menu-column-${columnIndex}`} className="space-y-6">
                        {column.map((item, itemIndex) => (
                          <div key={`${item.title}-${itemIndex}`} className="space-y-3">
                            <Link
                              href={item.url || "#"}
                              className="block font-balootamma2 text-[17px] font-semibold leading-[1.2] text-white no-underline transition-opacity hover:opacity-80"
                              onClick={() => setActiveMenu(null)}
                            >
                              {item.title}
                            </Link>

                            {(item.children ?? []).length > 0 && (
                              <div className="space-y-3 border-l border-white/20 pl-4">
                                {item.children?.map((child, childIndex) => (
                                  <Link
                                    key={`${child.title}-${childIndex}`}
                                    href={child.url || "#"}
                                    className="block font-balootamma2 text-[15px] font-medium leading-none text-white/90 no-underline transition-opacity hover:opacity-80"
                                    onClick={() => setActiveMenu(null)}
                                  >
                                    {child.title}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showSearch && (
                <button
                  ref={searchButtonRef}
                  type="button"
                  aria-label={searchOpen ? "Close search" : "Open search"}
                  aria-expanded={searchOpen}
                  aria-controls="header-search-panel"
                  onClick={toggleSearch}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center transition-colors ${
                    searchOpen ? "text-[#07256D] dark:text-[#9db4d8]" : "text-111111 hover:text-009EF9"
                  }`}
                >
                  <SearchIcon />
                </button>
              )}

              {searchOpen && (
                <div
                  ref={searchPanelRef}
                  id="header-search-panel"
                  className="absolute left-0 top-full z-[85] mt-3 w-[min(92vw,520px)] border border-D2D2D2 bg-FFFFFF shadow-[0_14px_32px_rgba(0,0,0,0.14)]"
                >
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-[56px] flex-1 items-center gap-3 border border-D2D2D2 bg-FFFFFF px-4 text-111111">
                        <button
                          type="button"
                          aria-label="Search"
                          onClick={submitSearch}
                          className="shrink-0 text-111111 hover:text-009EF9"
                        >
                          <SearchIcon />
                        </button>
                        <input
                          type="search"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              submitSearch();
                            }
                          }}
                          placeholder="Search Here"
                          autoFocus
                          className="w-full border-0 bg-transparent font-manrope text-[14px] font-medium text-111111 outline-none placeholder:text-[#8A8A8A] dark:placeholder:text-[#9B9B9B]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={submitSearch}
                        disabled={!searchTerm.trim()}
                        className="inline-flex h-[56px] shrink-0 items-center justify-center rounded-none bg-3046EB px-5 font-manrope text-[14px] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Search
                      </button>
                    </div>

                    {/* Trending topics near the search box (ported from dinamani).
                        In the search box these go to the search page, not topics. */}
                    <TrendingTags
                      className="mt-4"
                      destination="search"
                      onNavigate={() => setSearchOpen(false)}
                    />
                  </div>
                </div>
              )}

              {/* Desktop keeps the toggle here; on phones it sits on the right
                  next to the profile button. */}
              {showThemeToggle && <ThemeToggle className="hidden sm:flex" />}
            </div>

            <Link
              href="/"
              aria-label="Kannada Prabha home"
              className={`block min-w-0 ${
                logoAlign === "left"
                  ? "justify-self-start"
                  : logoAlign === "right"
                    ? "justify-self-end"
                    : "justify-self-center"
              }`}
            >
              {/* Height-pinned, width auto: the reserved box is correct before
                  the image decodes whatever the asset's real aspect ratio is.
                  The declared 501x130 did not match the actual logo (358x120),
                  so `h-auto` resized it from 38px to 49px on load and shifted
                  the whole page down. */}
              <img
                src={logoUrl}
                alt={logoAlt}
                width={501}
                height={130}
                className={`h-auto w-[145px] sm:w-[185px] md:w-[205px] ${
                  logoDarkUrl ? "dark:hidden" : ""
                }`}
              />
              {logoDarkUrl && (
                <img
                  src={logoDarkUrl}
                  alt={logoAlt}
                  width={501}
                  height={130}
                  className="hidden h-auto w-[145px] dark:block sm:w-[185px] md:w-[205px]"
                />
              )}
            </Link>

            <div className="flex min-w-0 items-center justify-end gap-2 sm:h-[34px] sm:gap-[14px]">
              {accountEnabled && (
                <AccountButton
                  label={accountLabel}
                  showIcon={account?.showIcon ?? true}
                />
              )}
              {/* Mobile-only dark/light toggle, to the right of the profile. */}
              {showThemeToggle && <ThemeToggle className="flex h-8 w-8 sm:hidden" />}
              {ctaButtons.map((button, index) => (
                <Link
                  key={`${button.label}-${index}`}
                  href={button.url || "#"}
                  className="hidden h-8 max-w-[104px] items-center justify-center overflow-hidden truncate whitespace-nowrap rounded-[6px] bg-[#3046EB] px-2 pt-[2px] font-balootamma2 text-[13px] font-semibold leading-8 text-white sm:inline-flex sm:h-[34px] sm:max-w-none sm:px-[14px] sm:text-[15px] sm:leading-[34px]"
                >
                  {button.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Mobile date/time row — its own row under the main bar (the desktop
              top bar hosts it from md up). */}
          {dateTimeEnabled && (
            <div className="flex justify-center border-t border-EEEEEE py-1.5 text-[12px] text-111111 sm:hidden">
              <HeaderDateTime
                enabled={dateTimeEnabled}
                locale={dateTimeLocale}
                format={dateTimeFormat}
                className="flex"
              />
            </div>
          )}
          </div>

        </header>

        {navEnabled && (
          <>
        {/* Zero-height sentinel: once it scrolls to/past the viewport top, the
            nav bar below pins fixed (dinamani-style sticky nav, all breakpoints). */}
        <div ref={navSentinelRef} aria-hidden="true" className="h-0 w-full" />
        <div
          className={`w-full border-t border-DFDFDF bg-FFFFFF ${
            navSticky && navPinned
              ? "fixed inset-x-0 top-0 z-[60] shadow-md"
              : "relative"
          }`}
        >
        <nav
          aria-label="Primary navigation"
          className="relative flex h-[45px] w-full items-center border-b bg-FFFFFF px-4 sm:px-6 lg:px-[60px]"
          onMouseDown={handleChromePointerDown}
        >
          {/* pr-12 keeps the last scrolling item clear of the absolutely
              positioned 3-dots button on small screens. */}
          {/* md: BOTH overflows must be visible — `overflow-x: visible` next to
              `overflow-y: hidden` computes to `auto` (CSS spec), which would
              keep clipping the hover dropdown on desktop. */}
          <div className="flex h-full min-w-0 flex-1 items-center overflow-x-auto overflow-y-hidden touch-pan-x pr-12 md:justify-center md:overflow-x-visible md:overflow-y-visible md:pr-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {visibleNavItems.map((item, index) => {
              const active = navActive(pathname, item);
              const children = item.children ?? [];
              const hasChildren = children.length > 0;
              return (
                <div
                  key={`${item.title}-${index}`}
                  className="group relative flex h-full shrink-0 items-center"
                >
                  <Link
                    href={item.url || "#"}
                    data-submenu-parent={hasChildren ? "" : undefined}
                    onClick={(e) => {
                      if (!hasChildren) return;
                      // Below md the strip scrolls and clips the hover
                      // dropdown (and touch devices have no hover at all) —
                      // there a click toggles the panel instead of navigating.
                      // Wide hover viewports keep hover + click-to-navigate.
                      if (
                        window.matchMedia("(hover: none)").matches ||
                        window.innerWidth < 768
                      ) {
                        e.preventDefault();
                        setMobileSubmenu((open) =>
                          open === index ? null : index,
                        );
                      }
                    }}
                    className={`flex h-full items-center border-b-4 px-3 font-balootamma2 text-[15px] font-medium leading-none sm:px-[14px] sm:text-[16px] ${
                      active
                        ? "border-009EF9 text-009EF9"
                        : "border-transparent text-000000"
                    }`}
                  >
                    {item.title}
                    {hasChildren && <ChevronDown />}
                  </Link>

                  {/* Hover dropdown — md+ only; below md the strip's scroll
                      clipping would hide it, so the tap panel handles it. */}
                  {hasChildren && (
                    <div className="invisible absolute left-0 top-full z-40 min-w-[210px] border border-DFDFDF bg-FFFFFF py-2 opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-opacity duration-150 md:group-hover:visible md:group-hover:opacity-100">
                      {children.map((child, ci) => {
                        const cActive = child.url && pathname === child.url;
                        return (
                          <Link
                            key={`${child.title}-${ci}`}
                            href={child.url || "#"}
                            className={`block whitespace-nowrap px-4 py-2.5 font-balootamma2 text-[15px] font-medium leading-none hover:bg-F9F9F9 ${
                              cActive ? "text-009EF9" : "text-000000"
                            }`}
                          >
                            {child.title}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {/* Tap-opened submenu (touch devices) — full-width panel below the
              bar; the hover dropdown can't open there and would be clipped by
              the scroll strip anyway. */}
          {mobileSubmenu !== null && visibleNavItems[mobileSubmenu] && (
            <div
              data-submenu-panel=""
              className="absolute left-0 right-0 top-full z-[75] max-h-[60vh] overflow-y-auto border-b border-DFDFDF bg-FFFFFF py-1 shadow-[0_18px_44px_rgba(0,0,0,0.18)]"
            >
              <Link
                href={visibleNavItems[mobileSubmenu].url || "#"}
                className="block px-4 py-2.5 font-balootamma2 text-[15px] font-semibold leading-none text-111111"
              >
                {visibleNavItems[mobileSubmenu].title}
              </Link>
              {(visibleNavItems[mobileSubmenu].children ?? []).map(
                (child, ci) => (
                  <Link
                    key={`msub-${child.title}-${ci}`}
                    href={child.url || "#"}
                    className={`block border-t border-EEEEEE px-4 py-2.5 font-balootamma2 text-[15px] font-medium leading-none ${
                      child.url && pathname === child.url
                        ? "text-009EF9"
                        : "text-333333"
                    }`}
                  >
                    {child.title}
                  </Link>
                ),
              )}
            </div>
          )}
          <button
            ref={rightMenuButtonRef}
            type="button"
            aria-label="More menu"
            aria-expanded={activeMenu === "right"}
            aria-controls="header-category-menu-right"
            onClick={() => toggleMenu("right")}
            className={`absolute right-4 top-0 flex h-full min-w-10 shrink-0 items-center justify-center bg-FFFFFF font-manrope text-[22px] font-semibold leading-none sm:right-6 lg:right-[60px] ${
              activeMenu === "right" ? "text-[#07256D] dark:text-[#9db4d8]" : "text-111111"
            }`}
          >
            <span aria-hidden="true" className="flex items-center gap-[3px]">
              <span className="h-[4px] w-[4px] rounded-full bg-current" />
              <span className="h-[4px] w-[4px] rounded-full bg-current" />
              <span className="h-[4px] w-[4px] rounded-full bg-current" />
            </span>
          </button>

          {activeMenu === "right" && (
            <div
              ref={rightMenuPanelRef}
              id="header-category-menu-right"
              className="absolute right-4 top-full z-[80] mt-3 w-[min(92vw,760px)] rounded-[4px] border border-[#14356F] bg-[#07256D] text-white shadow-[0_18px_44px_rgba(0,0,0,0.28)] sm:right-6 lg:right-[60px]"
            >
                    <div className="grid grid-cols-2 gap-5 p-5 lg:grid-cols-4">
                      {megaMenuColumns.map((column, columnIndex) => (
                        <div key={`right-menu-column-${columnIndex}`} className="space-y-6">
                          {column.map((item, itemIndex) => (
                            <div key={`${item.title}-${itemIndex}`} className="space-y-3">
                              <Link
                                href={item.url || "#"}
                                className="block font-balootamma2 text-[17px] font-semibold leading-[1.2] text-white no-underline transition-opacity hover:opacity-80"
                                onClick={() => setActiveMenu(null)}
                              >
                                {item.title}
                              </Link>

                              {(item.children ?? []).length > 0 && (
                                <div className="space-y-3 border-l border-white/20 pl-4">
                                  {item.children?.map((child, childIndex) => (
                                    <Link
                                      key={`${child.title}-${childIndex}`}
                                      href={child.url || "#"}
                                      className="block font-balootamma2 text-[15px] font-medium leading-none text-white/90 no-underline transition-opacity hover:opacity-80"
                                      onClick={() => setActiveMenu(null)}
                                    >
                                      {child.title}
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
              </div>
            </div>
          )}
          </nav>
        </div>
            {navSticky && navPinned && <div aria-hidden="true" className="h-[45px] w-full" />}
          </>
        )}
      </div>
    </>
  );
}
