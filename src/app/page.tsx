import type { Metadata } from "next";

import { resolveBuilderPage } from "@/components/builder/resolveBuilderPage";
import SiteChrome from "@/components/layout/SiteChrome";
import SchemaMarkup from "@/components/seo/SchemaMarkup";
import { generateHomePageSchema } from "@/lib/seo/schema";
import { applySocialMetaOverride } from "@/lib/seo/social-meta";
import { siteConfig } from "@/config/site";
import AstrologyFull from "@/components/unique/AstrologyFull";
import Twitter from "@/components/unique/Twitter";
import TrendingSection from "@/components/component_unique/TrendingSection";
import BookmarkIcon from "@/components/ui/bookmarkicon";
import BorderButton from "@/components/ui/BorderButton";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Chips from "@/components/ui/Chips";
import ContinueButton from "@/components/ui/ContinueButton";
import FiveStar from "@/components/ui/FiveStar";
import HorizontalTab from "@/components/ui/HorizontalTab";
import NewsCategoryButton from "@/components/ui/newscategorybutton";
import Pagination from "@/components/ui/Pagination";
import PlaybackControls from "@/components/ui/playbackcontrols";
import PlayButton from "@/components/ui/PlayButton";
import PremiumBadge from "@/components/ui/PremiumBadge";
import Rating from "@/components/ui/Rating";
import SearchBar from "@/components/ui/SearchBar";
import Socialicons from "@/components/ui/socialicons";
import SocialIconsHeadeer from "@/components/ui/SocialIconsHeadeer";
import {
  EmailIcon,
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  ShareNodesIcon,
  WhatsappIcon,
  XIcon,
  YoutubeIcon,
} from "@/components/ui/socialIconSvgs";
import TabPillMenu from "@/components/ui/TabPillMenu";
import ThemeToggle from "@/components/ui/ThemeToggle";
import VerticalAstrologyCard from "@/components/ui/VerticalAstrologyCard";
import WhiteBarRightButton from "@/components/ui/WhiteBarRightButton";
import HorizontalCategoryNews from "@/components/component_horizontal/HorizontalCategoryNews";
import HorizontalCategoryNewsRightImage from "@/components/component_horizontal/HorizontalCategoryNewsRightImage";
import HorizontalMediumCategoryNews from "@/components/component_horizontal/HorizontalMediumCategoryNewsWithMain";
import HorizontalNewsArticlePage from "@/components/component_horizontal/HorizontalNewsArticlePage";
import HorizontalNotificationNews from "@/components/component_horizontal/HorizontalNotificationNews";
import HorizontalPremiumLeftImageNews from "@/components/component_horizontal/HorizontalPremiumLeftImageNews";
import HorizontalPremiumRightImageNews from "@/components/component_horizontal/HorizontalPremiumRightImageNews";
import HorizontalProfileNews from "@/components/component_horizontal/HorizontalProfileNews";
import HorizontalSmallCategoryNews from "@/components/component_horizontal/HorizontalSmallCategoryNews";
import HorizontalSmallCategoryNewsLeftImage from "@/components/component_horizontal/HorizontalSmallCategoryNewsLeftImage";
import HorizontalSmallCategoryNewsRightImage from "@/components/component_horizontal/HorizontalSmallCategoryNewsRightImage";
import HorizontalSmallNewsLeftImage from "@/components/component_horizontal/HorizontalSmallNewsLeftImage";
import HorizontalSmallVideoNews from "@/components/component_horizontal/HorizontalSmallVideoNewsWithMain";
import HorizontalSquareProfileNews from "@/components/component_horizontal/HorizontalSquareProfileNews";
import QuestionAndAnswer from "@/components/component_horizontal/QuestionAndAnswer";
import VerticalBigCategoryNews from "@/components/component_vertical/VerticalBigCategoryNews";
import VerticalBigImageNews from "@/components/component_vertical/VerticalBigImageNews";
import VerticalBigImageNewsCard from "@/components/component_vertical/VerticalBigImageNewsCard";
import VerticalBigImageNewsList from "@/components/component_vertical/VerticalBigImageNewsList";
import VerticalBigNews from "@/components/component_vertical/verticalbignews";
import VerticalButtonWithText from "@/components/component_vertical/VerticalButtonWithText";
import VerticalCategoryTitleNews from "@/components/component_vertical/VerticalCategoryTitleNews";
import VerticalImageGradientNews from "@/components/component_vertical/VerticalImageGradientNews";
import VerticalImageNews from "@/components/component_vertical/VerticalImageNews";
import VerticalMediumCategoryNewsPara from "@/components/component_vertical/VerticalMediumCategoryNewsPara";
import VerticalMediumCategoryTitleNews from "@/components/component_vertical/VerticalMediumCategoryTitleNews";
import VerticalMediumImageWithDate from "@/components/component_vertical/VerticalMediumImageWithDate";
import VerticalMediumNews from "@/components/component_vertical/VerticalMediumNews";
import VerticalMediumTitleCategoryNews from "@/components/component_vertical/VerticalMediumTitleCategoryNews";
import VerticalMediumVideoNews from "@/components/component_vertical/VerticalMediumVideoNews";
import VerticalPremiumFeatureNews from "@/components/component_vertical/VerticalPremiumFeatureNews";
import VerticalPremiumReviewNews from "@/components/component_vertical/VerticalPremiumReviewNews";
import VerticalReviewNews from "@/components/component_vertical/VerticalReviewNews";
import VerticalSmallImageNews from "@/components/component_vertical/VerticalSmallImageNewsWithMain";
import VerticalSummeryNews from "@/components/component_vertical/VerticalSummeryNews";
import VerticalVideoNews from "@/components/component_vertical/VerticalVideoNews";
import VerticalVideoPlayNews from "@/components/component_vertical/VerticalVideoPlayNews";

const mediaPlaceholder =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 778 557'><rect width='778' height='557' fill='#d8d8d8'/><rect x='32' y='32' width='714' height='493' rx='12' fill='#eeeeee'/></svg>",
  );

const verticalComponents = [
  { id: "vertical-big-category-news", component: <VerticalBigCategoryNews /> },
  { id: "vertical-big-image-news", component: <VerticalBigImageNews /> },
  { id: "vertical-big-image-news-card", component: <VerticalBigImageNewsCard /> },
  { id: "vertical-big-image-news-list", component: <VerticalBigImageNewsList /> },
  { id: "vertical-big-news", component: <VerticalBigNews /> },
  { id: "vertical-button-with-text", component: <VerticalButtonWithText /> },
  { id: "vertical-category-title-news", component: <VerticalCategoryTitleNews /> },
  { id: "vertical-image-gradient-news", component: <VerticalImageGradientNews /> },
  { id: "vertical-image-news", component: <VerticalImageNews /> },
  {
    id: "vertical-medium-category-news-para",
    component: <VerticalMediumCategoryNewsPara />,
  },
  {
    id: "vertical-medium-category-title-news",
    component: <VerticalMediumCategoryTitleNews />,
  },
  {
    id: "vertical-medium-image-with-date",
    component: <VerticalMediumImageWithDate />,
  },
  { id: "vertical-medium-news", component: <VerticalMediumNews /> },
  {
    id: "vertical-medium-title-category-news",
    component: <VerticalMediumTitleCategoryNews />,
  },
  {
    id: "vertical-medium-video-news",
    component: <VerticalMediumVideoNews imageSrc={{ value: mediaPlaceholder }} />,
    dark: true,
  },
  {
    id: "vertical-premium-feature-news",
    component: <VerticalPremiumFeatureNews />,
  },
  {
    id: "vertical-premium-review-news",
    component: <VerticalPremiumReviewNews />,
  },
  {
    id: "vertical-review-news",
    component: <VerticalReviewNews imageSrc={{ value: mediaPlaceholder }} />,
  },
  { id: "vertical-small-image-news", component: <VerticalSmallImageNews /> },
  { id: "vertical-summery-news", component: <VerticalSummeryNews /> },
  {
    id: "vertical-video-news",
    component: <VerticalVideoNews imageSrc={{ value: mediaPlaceholder }} />,
  },
  { id: "vertical-video-play-news", component: <VerticalVideoPlayNews /> },
];

const horizontalComponents = [
  { id: "horizontal-category-news", component: <HorizontalCategoryNews /> },
  {
    id: "horizontal-category-news-right-image",
    component: <HorizontalCategoryNewsRightImage />,
  },
  {
    id: "horizontal-medium-category-news",
    component: <HorizontalMediumCategoryNews />,
  },
  { id: "horizontal-news-article-page", component: <HorizontalNewsArticlePage /> },
  { id: "horizontal-notification-news", component: <HorizontalNotificationNews /> },
  {
    id: "horizontal-premium-left-image-news",
    component: <HorizontalPremiumLeftImageNews />,
  },
  {
    id: "horizontal-premium-right-image-news",
    component: <HorizontalPremiumRightImageNews />,
  },
  { id: "horizontal-profile-news", component: <HorizontalProfileNews /> },
  {
    id: "horizontal-small-category-news",
    component: <HorizontalSmallCategoryNews />,
  },
  {
    id: "horizontal-small-category-news-left-image",
    component: <HorizontalSmallCategoryNewsLeftImage />,
  },
  {
    id: "horizontal-small-category-news-right-image",
    component: <HorizontalSmallCategoryNewsRightImage />,
  },
  {
    id: "horizontal-small-news-left-image",
    component: <HorizontalSmallNewsLeftImage />,
  },
  {
    id: "horizontal-small-video-news",
    component: <HorizontalSmallVideoNews />,
  },
  {
    id: "horizontal-square-profile-news",
    component: <HorizontalSquareProfileNews />,
  },
  { id: "question-and-answer", component: <QuestionAndAnswer /> },
];

const uniqueComponents = [
  { id: "trending-section", component: <TrendingSection /> },
  { id: "astrology-full", component: <AstrologyFull /> },
  { id: "twitter", component: <Twitter /> },
];

const uiComponents = [
  {
    id: "bookmarkicon",
    component: <BookmarkIcon active className="text-111111" />,
    padded: true,
  },
  { id: "border-button", component: <BorderButton />, padded: true },
  { id: "breadcrumb", component: <Breadcrumb />, padded: true },
  { id: "chips", component: <Chips />, padded: true },
  { id: "continue-button", component: <ContinueButton />, padded: true },
  {
    id: "five-star",
    component: <FiveStar starClassName="h-5 w-5" />,
    padded: true,
  },
  { id: "horizontal-tab", component: <HorizontalTab />, padded: true },
  {
    id: "newscategorybutton",
    component: <NewsCategoryButton label="Category" />,
    padded: true,
  },
  { id: "pagination", component: <Pagination />, padded: true },
  {
    id: "playbackcontrols",
    component: <PlaybackControls />,
    dark: true,
  },
  { id: "play-button", component: <PlayButton />, dark: true },
  { id: "premium-badge", component: <PremiumBadge />, padded: true },
  { id: "rating", component: <Rating />, padded: true },
  {
    id: "search-bar",
    component: <SearchBar resultsText="12 results found" />,
    padded: true,
  },
  { id: "socialicons", component: <Socialicons />, padded: true },
  {
    id: "social-icons-headeer",
    component: <SocialIconsHeadeer />,
    padded: true,
  },
  {
    id: "social-icon-svgs",
    component: (
      <div className="flex flex-wrap items-center gap-4 text-111111">
        <FacebookIcon size={28} />
        <XIcon size={28} />
        <InstagramIcon size={28} />
        <YoutubeIcon size={28} />
        <WhatsappIcon size={28} />
        <LinkedinIcon size={28} />
        <EmailIcon size={28} />
        <ShareNodesIcon size={28} />
      </div>
    ),
    padded: true,
  },
  { id: "tab-pill-menu", component: <TabPillMenu />, padded: true },
  { id: "theme-toggle", component: <ThemeToggle />, padded: true },
  {
    id: "vertical-astrology-card",
    component: <VerticalAstrologyCard />,
  },
  {
    id: "white-bar-right-button",
    component: <WhiteBarRightButton />,
  },
];

function formatComponentName(id: string) {
  return id
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function ComponentSection({
  id,
  title,
  items,
}: {
  id: string;
  title: string;
  items: Array<{
    id: string;
    component: React.ReactNode;
    dark?: boolean;
    padded?: boolean;
  }>;
}) {
  return (
    <section
      id={id}
      className="mx-auto flex w-full max-w-[1080px] flex-col items-center gap-5 px-4 py-6 sm:px-6 lg:px-[48px]"
    >
      <h1 className="w-full max-w-[985px] font-manrope text-[28px] font-bold leading-none text-111111">
        {title}
      </h1>

      {items.map(({ component, dark, id: itemId, padded }) => (
        <div
          key={itemId}
          className={`w-full max-w-[985px] overflow-hidden bg-FFFFFF ${
            padded ? "p-5" : ""
          }`}
        >
          <div className="px-4 py-3 font-manrope text-[15px] font-bold leading-none text-111111">
            {formatComponentName(itemId)}
          </div>
          {dark ? (
            <div className="bg-[#111111] p-4">{component}</div>
          ) : (
            component
          )}
        </div>
      ))}
    </section>
  );
}

// Render the builder-driven homepage (route "/") when one is synced; otherwise
// fall back to the static component showcase below.
export const dynamic = "force-dynamic";

// The homepage self-references the site root as its canonical URL. A builder
// social-meta override for "/" (if any) wins over the defaults.
export async function generateMetadata(): Promise<Metadata> {
  const canonical = siteConfig.url.replace(/\/+$/, "") + "/";
  const override = applySocialMetaOverride(
    "/",
    siteConfig.name,
    siteConfig.description,
    canonical,
  );
  return override ?? { alternates: { canonical } };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const rawPage = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const currentPage = Math.max(1, parseInt(rawPage ?? "1", 10) || 1);
  const builder = await resolveBuilderPage("/", currentPage);
  if (builder) {
    return builder.hideLayout ? (
      builder.content
    ) : (
      <SiteChrome pageType="homepage">
        <SchemaMarkup schema={generateHomePageSchema()} />
        {builder.content}
      </SiteChrome>
    );
  }

  return (
    <SiteChrome>
      <div className="bg-F9F9F9">
        <ComponentSection
          id="vertical"
          title="Vertical"
          items={verticalComponents}
        />
        <ComponentSection
          id="horizontal"
          title="Horizontal"
          items={horizontalComponents}
        />
        <ComponentSection id="unique" title="Unique" items={uniqueComponents} />
        <ComponentSection id="ui" title="UI" items={uiComponents} />
      </div>
    </SiteChrome>
  );
}
