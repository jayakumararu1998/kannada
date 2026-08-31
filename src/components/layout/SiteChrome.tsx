import { Suspense, type ReactNode } from "react";

import BreakingNews from "@/components/layout/BreakingNews";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import LayoutAds from "@/components/layout/LayoutAds";
import MenuHeaderCodes from "@/components/layout/MenuHeaderCodes";
import type { PageType } from "@/lib/builder/ad-codes";
import { fetchFooterNews } from "@/lib/builder/fetch";
import { toFooterView, toHeaderView } from "@/lib/builder/header-footer";
import { getHeaderMenu } from "@/lib/builder/menu";
import { getStore } from "@/lib/builder/store";

/**
 * Reserved box for the streamed breaking-news ticker. `fallback={null}` let the
 * ticker appear AFTER first paint and push every page down by its own height
 * (39px = the h-[38px] bar + its bottom border) — worth ~0.04 CLS on every
 * mobile page. Same height, so the insert is invisible to layout.
 */
function BreakingNewsPlaceholder() {
  return <div className="h-[39px] w-full border-b border-DFDFDF bg-FFFFFF" />;
}

/**
 * Site chrome = Header (with dynamic menu) + global positional ads + main +
 * Footer. Pages opt into this so that `hide_layout` pages can render bare. Kept
 * out of the root layout so the static home stays cacheable and chrome is
 * data-driven per page. `pageType` selects which ad group applies
 * (homepage/sectionPage/articlePage).
 */
export default async function SiteChrome({
  children,
  pageType = "sectionPage",
  showHeader = true,
  showFooter = true,
}: {
  children: ReactNode;
  pageType?: PageType;
  /** Static pages can hide the header/footer independently (metadata flags). */
  showHeader?: boolean;
  showFooter?: boolean;
}) {
  // Pass the full nested tree (top-level items + their children) for dropdowns.
  const menu = getHeaderMenu();
  const store = getStore();
  // Global synced ad codes (top/lhs/rhs/sticky/anchor) for this page type.
  const adCodes = store.getAdCodes();
  // GAM/GPT layout codes (header+body defineSlot/display), rendered through the
  // same LayoutAds pipeline as the positional ad codes.
  const layoutCodes = store.getAllLayoutCodes();
  // Active CMS header banners (image/HTML), resolved per-page on the client.
  const menuHeaderCodes = store.getAllMenuHeaderCodes();
  // Dynamic header/footer chrome synced from the builder (null → components
  // fall back to their built-in defaults).
  const headerFooter = store.getHeaderFooter();
  const header = toHeaderView(headerFooter);
  const footer = toFooterView(headerFooter);

  // Footer "recent news" panel: fetch its builder-configured API list so the
  // right column renders live headlines. Skipped when disabled or unconfigured.
  const recentNews = footer?.recentNews;
  if (recentNews?.enabled !== false && recentNews?.apiUrl) {
    recentNews.items = await fetchFooterNews(recentNews);
  }

  return (
    <>
      {showHeader && (
        <>
          {/* CMS banner ABOVE the header. */}
          <MenuHeaderCodes codes={menuHeaderCodes} position="above_header" />
          {/* Top leaderboard ad — ABOVE the header. */}
          <LayoutAds
            config={adCodes}
            layoutCodes={layoutCodes}
            pageType={pageType}
            part="top"
          />
          <Header menu={menu} header={header} />
          {/* Breaking-news ticker, directly below the header (all pages). Its
              fetch is cached + independent, so Suspense keeps it off the
              critical render path. */}
          <Suspense fallback={<BreakingNewsPlaceholder />}>
            <BreakingNews />
          </Suspense>
          {/* CMS banner BELOW the breaking-news bar. */}
          <MenuHeaderCodes
            codes={menuHeaderCodes}
            position="below_breaking_news"
          />
          {/* Fixed LHS/RHS/sticky/anchor slots. */}
          <LayoutAds
            config={adCodes}
            layoutCodes={layoutCodes}
            pageType={pageType}
            part="rest"
          />
        </>
      )}
      <main>{children}</main>
      {showFooter && <Footer footer={footer} />}
    </>
  );
}
