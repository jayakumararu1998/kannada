/**
 * Component registry — maps a builder `component_type` string to the actual
 * kannada component plus its `propShape` (how mapped values must be shaped).
 *
 * The components are `"use client"` leaves; this module has no "use client" of
 * its own, so it's a server module that renders client components (a normal
 * server→client boundary). Add new entries here as the builder starts emitting
 * more component types.
 */

import type { ComponentType } from "react";

import VerticalBigImageNews from "@/components/component_vertical/VerticalBigImageNews";
import VerticalBigImageNewsCard from "@/components/component_vertical/VerticalBigImageNewsCard";
import VerticalBigImageNewsList from "@/components/component_vertical/VerticalBigImageNewsList";
import VerticalImageNews from "@/components/component_vertical/VerticalImageNews";
import VerticalMediumNews from "@/components/component_vertical/VerticalMediumNews";
import VerticalBigCategoryNews from "@/components/component_vertical/VerticalBigCategoryNews";
import VerticalSmallImageNews from "@/components/component_vertical/VerticalSmallImageNewsWithMain";
import VerticalCategoryTitleNews from "@/components/component_vertical/VerticalCategoryTitleNews";
import VerticalMediumImageWithDate from "@/components/component_vertical/VerticalMediumImageWithDate";
import VerticalBigNews from "@/components/component_vertical/verticalbignews";
import VerticalMediumTitleCategoryNews from "@/components/component_vertical/VerticalMediumTitleCategoryNews";
import VerticalMediumCategoryTitleNews from "@/components/component_vertical/VerticalMediumCategoryTitleNews";
import VerticalMediumCategoryNewsPara from "@/components/component_vertical/VerticalMediumCategoryNewsPara";
import VerticalImageGradientNews from "@/components/component_vertical/VerticalImageGradientNews";
import VerticalMediumVideoNews from "@/components/component_vertical/VerticalMediumVideoNews";
import VerticalPremiumFeatureNews from "@/components/component_vertical/VerticalPremiumFeatureNews";
import VerticalPremiumReviewNews from "@/components/component_vertical/VerticalPremiumReviewNews";
import VerticalReviewNews from "@/components/component_vertical/VerticalReviewNews";
import VerticalSummeryNews from "@/components/component_vertical/VerticalSummeryNews";
import VerticalVideoNews from "@/components/component_vertical/VerticalVideoNews";
import VerticalVideoPlayNews from "@/components/component_vertical/VerticalVideoPlayNews";
import VerticalButtonWithText from "@/components/component_vertical/VerticalButtonWithText";
import HorizontalArticleSmallNewsLeftImage from "@/components/component_horizontal/HorizontalArticleSmallNewsLeftImage";
import HorizontalCategoryNews from "@/components/component_horizontal/HorizontalCategoryNews";
import HorizontalCategoryNewsRightImage from "@/components/component_horizontal/HorizontalCategoryNewsRightImage";
import HorizontalMediumCategoryNewsWithRes from "@/components/component_horizontal/HorizontalMediumCategoryNewsWithRes";
import HorizontalNewsArticlePage from "@/components/component_horizontal/HorizontalNewsArticlePage";
import HorizontalNotificationNews from "@/components/component_horizontal/HorizontalNotificationNews";
import HorizontalPremiumLeftImageNews from "@/components/component_horizontal/HorizontalPremiumLeftImageNews";
import HorizontalPremiumRightImageNews from "@/components/component_horizontal/HorizontalPremiumRightImageNews";
import HorizontalSmallNewsLeftImage from "@/components/component_horizontal/HorizontalSmallNewsLeftImage";
import HorizontalSmallCategoryNews from "@/components/component_horizontal/HorizontalSmallCategoryNews";
import HorizontalMediumCategoryNews from "@/components/component_horizontal/HorizontalMediumCategoryNewsWithMain";
import HorizontalProfileNews from "@/components/component_horizontal/HorizontalProfileNews";
import HorizontalSmallCategoryNewsRightImage from "@/components/component_horizontal/HorizontalSmallCategoryNewsRightImage";
import HorizontalSmallCategoryNewsLeftImage from "@/components/component_horizontal/HorizontalSmallCategoryNewsLeftImage";
import HorizontalSmallVideoNewsWithRes from "@/components/component_horizontal/HorizontalSmallVideoNewsWithRes";
import HorizontalSmallVideoNews from "@/components/component_horizontal/HorizontalSmallVideoNewsWithMain";
import HorizontalSquareProfileNews from "@/components/component_horizontal/HorizontalSquareProfileNews";
import QuestionAndAnswer from "@/components/component_horizontal/QuestionAndAnswer";
import TrendingSection from "@/components/component_unique/TrendingSection";
import IncludeSection from "@/components/component_unique/IncludeSection";
import VerticalSmallImageNewsWithRes from "@/components/component_vertical/VerticalSmallImageNewsWithRes";

import type { PropShape } from "./field-map";

export interface RegistryEntry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Component: ComponentType<any>;
  shape: PropShape;
}

// All cards now share the standard prop contract: text + imageSrc are
// FieldConfig; slug/sectionUrl/articleHref are scalars.
const STANDARD_FIELD_PROPS = [
  "componentdiv",
  "title",
  "category",
  "excerpt",
  "timeAgo",
  "templatetype",
  "isliveblog",
  "heading",
  "description",
  "summary",
  "alsoRead",
  "imageAlt",
  "name",
  "button",
  "date",
];

const VERTICAL_SHAPE: PropShape = {
  fieldProps: STANDARD_FIELD_PROPS,
  imageProp: { name: "imageSrc", shape: "field" },
  hrefProp: "articleHref",
};

const HORIZONTAL_SHAPE: PropShape = VERTICAL_SHAPE;

// Review cards add two star-rating FieldConfig props on top of the standard set.
const REVIEW_SHAPE: PropShape = {
  fieldProps: [...STANDARD_FIELD_PROPS, "criticsRating", "userRating"],
  imageProp: { name: "imageSrc", shape: "field" },
  hrefProp: "articleHref",
};

export const COMPONENT_REGISTRY: Record<string, RegistryEntry> = {
  VerticalBigImageNews: { Component: VerticalBigImageNews, shape: VERTICAL_SHAPE },
  VerticalBigImageNewsCard: { Component: VerticalBigImageNewsCard, shape: VERTICAL_SHAPE },
  VerticalBigImageNewsList: { Component: VerticalBigImageNewsList, shape: VERTICAL_SHAPE },
  VerticalImageNews: { Component: VerticalImageNews, shape: VERTICAL_SHAPE },
  VerticalMediumNews: { Component: VerticalMediumNews, shape: VERTICAL_SHAPE },
  VerticalBigCategoryNews: { Component: VerticalBigCategoryNews, shape: VERTICAL_SHAPE },
  VerticalSmallImageNews: { Component: VerticalSmallImageNews, shape: VERTICAL_SHAPE },
  VerticalSmallImageNewsWithMain: { Component: VerticalSmallImageNews, shape: VERTICAL_SHAPE },
  VerticalSmallImageNewsWithRes: { Component: VerticalSmallImageNewsWithRes, shape: VERTICAL_SHAPE },
  VerticalCategoryTitleNews: { Component: VerticalCategoryTitleNews, shape: VERTICAL_SHAPE },
  VerticalMediumImageWithDate: { Component: VerticalMediumImageWithDate, shape: VERTICAL_SHAPE },
  VerticalBigNews: { Component: VerticalBigNews, shape: VERTICAL_SHAPE },
  VerticalReviewNews: { Component: VerticalReviewNews, shape: REVIEW_SHAPE },
  VerticalMediumTitleCategoryNews: { Component: VerticalMediumTitleCategoryNews, shape: VERTICAL_SHAPE },
  VerticalMediumCategoryTitleNews: { Component: VerticalMediumCategoryTitleNews, shape: VERTICAL_SHAPE },
  VerticalMediumCategoryNewsPara: { Component: VerticalMediumCategoryNewsPara, shape: VERTICAL_SHAPE },
  VerticalImageGradientNews: { Component: VerticalImageGradientNews, shape: VERTICAL_SHAPE },
  VerticalMediumVideoNews: { Component: VerticalMediumVideoNews, shape: VERTICAL_SHAPE },
  VerticalPremiumFeatureNews: { Component: VerticalPremiumFeatureNews, shape: VERTICAL_SHAPE },
  VerticalPremiumReviewNews: { Component: VerticalPremiumReviewNews, shape: VERTICAL_SHAPE },
  VerticalSummeryNews: { Component: VerticalSummeryNews, shape: VERTICAL_SHAPE },
  VerticalVideoNews: { Component: VerticalVideoNews, shape: VERTICAL_SHAPE },
  VerticalVideoPlayNews: { Component: VerticalVideoPlayNews, shape: VERTICAL_SHAPE },
  VerticalImageNewsCard: { Component: VerticalImageNews, shape: VERTICAL_SHAPE },
  VerticalMediumNewsCard: { Component: VerticalMediumNews, shape: VERTICAL_SHAPE },
  VerticalButtonWithText: { Component: VerticalButtonWithText, shape: VERTICAL_SHAPE },
  HorizontalArticleSmallNewsLeftImage: { Component: HorizontalArticleSmallNewsLeftImage, shape: HORIZONTAL_SHAPE },
  HorizontalCategoryNews: { Component: HorizontalCategoryNews, shape: HORIZONTAL_SHAPE },
  HorizontalCategoryNewsRightImage: { Component: HorizontalCategoryNewsRightImage, shape: HORIZONTAL_SHAPE },
  HorizontalSmallNewsLeftImage: { Component: HorizontalSmallNewsLeftImage, shape: HORIZONTAL_SHAPE },
  // Builder emits this type but no bespoke component exists — alias to the
  // closest card so pushed section templates still render.
  VerticalBigCategoryArticleNews: { Component: VerticalBigCategoryNews, shape: VERTICAL_SHAPE },
  HorizontalSmallCategoryNews: { Component: HorizontalSmallCategoryNews, shape: HORIZONTAL_SHAPE },
  HorizontalMediumCategoryNews: { Component: HorizontalMediumCategoryNews, shape: HORIZONTAL_SHAPE },
  HorizontalMediumCategoryNewsWithMain: { Component: HorizontalMediumCategoryNews, shape: HORIZONTAL_SHAPE },
  HorizontalMediumCategoryNewsWithRes: { Component: HorizontalMediumCategoryNewsWithRes, shape: HORIZONTAL_SHAPE },
  HorizontalNewsArticlePage: { Component: HorizontalNewsArticlePage, shape: HORIZONTAL_SHAPE },
  HorizontalNotificationNews: { Component: HorizontalNotificationNews, shape: HORIZONTAL_SHAPE },
  HorizontalPremiumLeftImageNews: { Component: HorizontalPremiumLeftImageNews, shape: HORIZONTAL_SHAPE },
  HorizontalPremiumRightImageNews: { Component: HorizontalPremiumRightImageNews, shape: HORIZONTAL_SHAPE },
  HorizontalProfileNews: { Component: HorizontalProfileNews, shape: HORIZONTAL_SHAPE },
  HorizontalSmallCategoryNewsRightImage: { Component: HorizontalSmallCategoryNewsRightImage, shape: HORIZONTAL_SHAPE },
  HorizontalSmallCategoryNewsLeftImage: { Component: HorizontalSmallCategoryNewsLeftImage, shape: HORIZONTAL_SHAPE },
  HorizontalSmallVideoNews: { Component: HorizontalSmallVideoNews, shape: HORIZONTAL_SHAPE },
  HorizontalSmallVideoNewsWithMain: { Component: HorizontalSmallVideoNews, shape: HORIZONTAL_SHAPE },
  HorizontalSmallVideoNewsWithRes: { Component: HorizontalSmallVideoNewsWithRes, shape: HORIZONTAL_SHAPE },
  HorizontalSquareProfileNews: { Component: HorizontalSquareProfileNews, shape: HORIZONTAL_SHAPE },
  QuestionAndAnswer: { Component: QuestionAndAnswer, shape: HORIZONTAL_SHAPE },
  // Section-style components: consume the WHOLE bound collection (see LIST_TYPES).
  TrendingSection: { Component: TrendingSection, shape: VERTICAL_SHAPE },
  IncludeSection: { Component: IncludeSection, shape: VERTICAL_SHAPE },
};

// Case-insensitive index so "trendingsection" resolves to "TrendingSection".
const LOWER_INDEX: Record<string, string> = Object.fromEntries(
  Object.keys(COMPONENT_REGISTRY).map((k) => [k.toLowerCase(), k]),
);

export function getRegistryEntry(componentType: string): RegistryEntry | null {
  if (COMPONENT_REGISTRY[componentType]) return COMPONENT_REGISTRY[componentType];
  const canon = LOWER_INDEX[componentType?.toLowerCase?.() ?? ""];
  return canon ? COMPONENT_REGISTRY[canon] : null;
}

/**
 * "Section"/list components that render the ENTIRE bound collection themselves
 * (header + N cards in one unit) instead of one card per item. The renderer maps
 * the bound items into a light `items` array and renders the component once.
 */
export const LIST_TYPES = new Set<string>([
  "TrendingSection",
  "IncludeSection",
]);

/**
 * Section registry (dinamani parity): maps an "include section" slug to a
 * registered component type. When a column/component includes a section by slug,
 * the renderer resolves it here and renders that component with the bound data.
 * Add new reusable sections here as they're built.
 */
export const SECTION_REGISTRY: Record<string, string> = {
  trending: "TrendingSection",
  "trending-section": "TrendingSection",
  trendingsection: "TrendingSection",
  "trending-news": "TrendingSection",
  // The videos include-section renders with the Trending design (same concept).
  videoinclude: "TrendingSection",
};

/**
 * Resolve an include-section slug to its registered component type
 * (case-insensitive), or null when the slug isn't a known/configured section.
 * NOTE: only EXPLICITLY registered slugs resolve — we do NOT default unknown
 * slugs to a component, because pages ship placeholder include-sections (e.g.
 * slug "includesection") that must render nothing, not a broken section.
 */
export function resolveSectionType(slug?: string): string | null {
  if (!slug) return null;
  return SECTION_REGISTRY[slug.trim().toLowerCase()] ?? null;
}

/**
 * Default collection endpoint for an include-section that ships no data_binding
 * (e.g. the homepage "trendingsection" widget). Bound onto its column at render
 * time so the section has data. Uses the public site host (which serves
 * collections; api.kannadaprabha.com does not).
 */
export const SECTION_DEFAULT_COLLECTION: Record<string, string> = {
  trending: "https://www.kannadaprabha.com/api/v1/collections/trending",
  trendingsection: "https://www.kannadaprabha.com/api/v1/collections/trending",
  "trending-section": "https://www.kannadaprabha.com/api/v1/collections/trending",
  "trending-news": "https://www.kannadaprabha.com/api/v1/collections/trending",
  // The "videoinclude" include-section binds to the "videos" collection
  // (ವಿಡಿಯೋ) — there is no "videoinclude" collection upstream.
  videoinclude: "https://www.kannadaprabha.com/api/v1/collections/videos",
};

export function resolveSectionCollection(slug?: string): string | null {
  if (!slug) return null;
  return SECTION_DEFAULT_COLLECTION[slug.trim().toLowerCase()] ?? null;
}

/**
 * Component types that render their OWN <a>/NextLink internally. The renderer
 * must NOT wrap these again (nested anchors are invalid HTML) — but it still
 * feeds them the same nav URL via `articleHref`, so every card navigates alike.
 */
export const SELF_LINKING_TYPES = new Set<string>([
  "HorizontalArticleSmallNewsLeftImage",
  "HorizontalCategoryNews",
  "HorizontalCategoryNewsRightImage",
  "HorizontalSmallCategoryNews",
  "HorizontalSmallCategoryNewsLeftImage",
  "HorizontalSmallCategoryNewsRightImage",
  "HorizontalMediumCategoryNews",
  "HorizontalMediumCategoryNewsWithRes",
  "HorizontalProfileNews",
  "HorizontalSquareProfileNews",
  "HorizontalSmallVideoNews",
  "HorizontalSmallVideoNewsWithRes",
  "HorizontalSmallNewsLeftImage",
  "HorizontalNewsArticlePage",
  "HorizontalNotificationNews",
  "HorizontalPremiumLeftImageNews",
  "HorizontalPremiumRightImageNews",
  "VerticalPremiumFeatureNews",
  "VerticalPremiumReviewNews",
  "VerticalVideoPlayNews",
]);
