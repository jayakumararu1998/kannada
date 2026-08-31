import "server-only";

/**
 * Per-URL social/OpenGraph/Twitter overrides (dinamani parity).
 *
 * A builder-synced `SocialMetaConfig` matched by `pageUrl` wins over the page's
 * own resolved metadata. Any field left null/undefined falls back to the page
 * defaults passed in. Wire via `applySocialMetaOverride()` in a page's
 * `generateMetadata` — return it when non-null, else build metadata normally.
 */

import type { Metadata } from "next";

import { getStore } from "@/lib/builder/store";
import type { SocialMetaConfig } from "@/lib/builder/types";

import { getAppConfig } from "./app-config";

function normalise(path: string): string {
  let p = path || "/";
  try {
    p = decodeURIComponent(p);
  } catch {
    /* keep raw */
  }
  p = p.replace(/^https?:\/\/[^/]+/i, "");
  if (!p.startsWith("/")) p = `/${p}`;
  return p.length > 1 ? p.replace(/\/+$/, "") : p;
}

/** Look up the active social-meta override for a URL path. */
export function getSocialMetaForPath(pathname: string): SocialMetaConfig | null {
  try {
    return getStore().getSocialMetaByPageUrl(normalise(pathname));
  } catch {
    return null;
  }
}

/** Trim a string; return undefined for empty/whitespace. */
function s(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

/** Only accept a canonical that looks like a URL or absolute path. */
function validCanonical(v: unknown): string | undefined {
  const val = s(v);
  if (!val) return undefined;
  return /^https?:\/\//i.test(val) || val.startsWith("/") ? val : undefined;
}

/** Only accept an image that looks like a URL or absolute path. */
function validImage(v: unknown): string | undefined {
  const val = s(v);
  if (!val) return undefined;
  return /^https?:\/\//i.test(val) || val.startsWith("/") ? val : undefined;
}

/**
 * Convert a SocialMetaConfig → Next.js Metadata, filling gaps from fallbacks.
 *
 * The Kannada builder nests OG/Twitter under `openGraph`/`twitter` objects, so
 * every field is read NESTED-first then from the flat `og*`/`twitter*` aliases.
 * Garbage/empty values (the builder's placeholder "Test"/"test" fields) are
 * ignored so they never overwrite the page's real, resolved metadata.
 */
export function buildSocialMetadata(
  meta: SocialMetaConfig,
  canonicalUrl: string,
  fallbackTitle: string,
  fallbackDescription: string,
): Metadata {
  const c = getAppConfig();
  const og = meta.openGraph ?? {};
  const tw = meta.twitter ?? {};

  const title = s(og.title) || s(meta.ogTitle) || s(meta.name) || fallbackTitle;
  const description =
    s(og.description) ||
    s(meta.ogDescription) ||
    s(meta.description) ||
    fallbackDescription;
  const canonical =
    validCanonical(meta.canonicalUrl) || validCanonical(og.url) || canonicalUrl;
  const ogType =
    (s(og.type) || s(meta.ogType) || "website") as
      | "website"
      | "article"
      | "profile";
  const twitterCard =
    (s(tw.card) || s(meta.twitterCard) || "summary_large_image") as
      | "summary"
      | "summary_large_image";
  const imageUrl =
    validImage(og.image) || validImage(meta.ogImage) || c.defaultOgImage;
  const image = {
    url: imageUrl,
    width: og.imageWidth ?? meta.ogImageWidth ?? 1200,
    height: og.imageHeight ?? meta.ogImageHeight ?? 630,
    alt: title,
  };
  const twImage = validImage(tw.image) || imageUrl;
  const twTitle = s(tw.title) || s(meta.twitterTitle) || title;

  return {
    title,
    description,
    ...(s(meta.keywords) ? { keywords: s(meta.keywords) } : {}),
    alternates: { canonical },
    openGraph: {
      type: ogType,
      siteName: s(og.siteName) || s(meta.ogSiteName) || c.siteName,
      url: canonical,
      title,
      description,
      locale: s(og.locale) || s(meta.ogLocale) || c.ogLocale,
      images: [image],
    },
    twitter: {
      card: twitterCard,
      site: s(tw.site) || s(meta.twitterSite) || c.twitterHandle,
      ...(s(tw.creator) || s(meta.twitterCreator)
        ? { creator: s(tw.creator) || s(meta.twitterCreator) }
        : {}),
      title: twTitle,
      description: s(tw.description) || s(meta.twitterDescription) || description,
      images: [{ ...image, url: twImage, alt: twTitle }],
    },
  };
}

/** One-shot: look up + convert. Returns null when no override applies. */
export function applySocialMetaOverride(
  pathname: string,
  fallbackTitle: string,
  fallbackDescription: string,
  canonicalUrl?: string,
): Metadata | null {
  const meta = getSocialMetaForPath(pathname);
  if (!meta) return null;
  const c = getAppConfig();
  const canonical = canonicalUrl || `${c.siteUrl}${normalise(pathname)}`;
  return buildSocialMetadata(meta, canonical, fallbackTitle, fallbackDescription);
}
