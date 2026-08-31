import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { resolveBuilderPage } from "@/components/builder/resolveBuilderPage";
import SiteChrome from "@/components/layout/SiteChrome";
import ArticleView, {
  buildArticleMetadata,
  loadArticleStory,
} from "@/components/article/ArticleView";
import SchemaMarkup from "@/components/seo/SchemaMarkup";
import StaticPageRenderer from "@/components/StaticPageRenderer";
import { getAuthorBySlug } from "@/lib/api/stories";
import {
  getCustomUrlPage,
  staticPageShowFooter,
  staticPageShowHeader,
} from "@/lib/api/static-pages";
import { toMediaUrl } from "@/lib/images";
import { resolvePageMeta } from "@/lib/builder/meta";
import { resolveRoute } from "@/lib/builder/route-resolver";
import { resolveSectionBinding } from "@/lib/builder/section-binding";
import {
  generateAboutPageSchema,
  generateArticleSchemaFromStory,
  generateContactPageSchema,
  generateProfilePageSchema,
  generateSectionPageSchema,
} from "@/lib/seo/schema";
import { applySocialMetaOverride } from "@/lib/seo/social-meta";
import { siteConfig } from "@/config/site";

// This catch-all reads `await params` and an in-memory store, so it is always
// rendered on demand (never placed in the full route cache) — every request
// reflects the latest synced content without any manual revalidation.
//
// Note: because the app has a `loading.tsx` (a Suspense boundary), the shell
// streams before `notFound()` runs, so an unknown route renders the 404 page
// but with an HTTP 200 (soft-404). That's a Next.js streaming trade-off, not a
// routing bug; remove the boundary if a hard 404 status is required.
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function slugFromParams(slug?: string[]): string {
  return "/" + (slug ?? []).join("/");
}

function pageNumber(v: string | string[] | undefined): number {
  const n = parseInt(Array.isArray(v) ? v[0] : (v ?? "1"), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

const ABOUT_SLUGS = new Set([
  "about-us",
  "about",
  "aboutus",
  "about-kannada-prabha",
]);
const CONTACT_SLUGS = new Set(["contact-us", "contact", "contactus"]);

/**
 * Publisher-identity JSON-LD for well-known URLs that otherwise render through
 * the generic static/section paths: author profiles (`/author/{slug}` →
 * ProfilePage + Person), the About page (AboutPage) and the Contact page
 * (ContactPage). Returns null for anything else so the caller keeps its default
 * (section CollectionPage) schema.
 */
async function resolvePublisherPageSchema(
  seg: string[],
): Promise<Record<string, unknown>[] | null> {
  const first = (seg[0] ?? "").toLowerCase();
  if (first === "author" && seg[1]) {
    const author = await getAuthorBySlug(seg.slice(1).join("/"));
    if (!author) return null;
    return generateProfilePageSchema({
      name: author.name,
      slug: author.slug,
      description: author.bio,
      image: toMediaUrl(author.avatarUrl),
      sameAs: author.sameAs,
    });
  }
  if (seg.length === 1 && ABOUT_SLUGS.has(first)) {
    return generateAboutPageSchema("/" + seg.join("/"));
  }
  if (seg.length === 1 && CONTACT_SLUGS.has(first)) {
    return generateContactPageSchema("/" + seg.join("/"));
  }
  return null;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const urlSlug = slugFromParams(slug);
  const canonical = `${siteConfig.url.replace(/\/+$/, "")}${urlSlug}`;
  const routed = resolveRoute(urlSlug);
  // The generic section template matches any URL; treat it as unresolved when the
  // URL isn't a real stored section (so static / article metadata is used).
  const resolved =
    routed &&
    (routed.page.sectionBindings?.length ?? 0) > 0 &&
    urlSlug !== "/" &&
    !resolveSectionBinding(routed.page, urlSlug)
      ? null
      : routed;

  let base: Metadata;
  if (!resolved) {
    // No builder page for this URL — it may be a Quintype article slug, or a
    // static / custom-URL page.
    const joined = (slug ?? []).join("/");
    const story = await loadArticleStory(joined);
    if (story) {
      base = buildArticleMetadata(story, joined);
    } else {
      const staticPage = await getCustomUrlPage("/" + joined);
      const seo = staticPage?.metadata?.seo;
      base = staticPage
        ? {
            title: seo?.["meta-title"] || staticPage.title || siteConfig.name,
            description: seo?.["meta-description"] || undefined,
            keywords: seo?.["meta-keywords"] || undefined,
            alternates: { canonical },
          }
        : { title: siteConfig.name };
    }
  } else {
    // Combines page meta (inline/master) + section meta (master SEO records).
    const { title, description, keywords } = resolvePageMeta(
      resolved.page,
      urlSlug,
    );
    base = {
      title,
      description,
      keywords,
      alternates: { canonical },
      openGraph: {
        title,
        description,
        url: canonical,
        siteName: siteConfig.name,
      },
    };
  }

  // A builder social-meta override for this URL wins over the resolved defaults.
  const override = applySocialMetaOverride(
    urlSlug,
    String(base.title ?? siteConfig.name),
    String(base.description ?? siteConfig.description),
    canonical,
  );
  return override ? { ...base, ...override } : base;
}

export default async function BuilderPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const result = await resolveBuilderPage(
    slugFromParams(slug),
    pageNumber(sp.page),
  );

  // No builder page matched — fall through to the dynamic article page, which
  // renders any Quintype story addressed by its slug (e.g.
  // /politics/2026/Aug/12/some-headline). Mirrors how the builder pages resolve
  // through this same catch-all entry.
  if (!result) {
    const joined = (slug ?? []).join("/");
    const story = await loadArticleStory(joined);
    if (story) {
      return (
        <SiteChrome pageType="articlePage">
          <SchemaMarkup
            schema={generateArticleSchemaFromStory(story, joined)}
          />
          <ArticleView story={story} />
        </SiteChrome>
      );
    }
    // Static / custom-URL page (about-us, /androidappdownload, /t20worldcup, …)
    // — content authored in Quintype, fetched on demand. HTML pages render here;
    // file-like paths (ads.txt, /.well-known/*) are served by their route handlers.
    const staticPage = await getCustomUrlPage("/" + joined);
    if (staticPage) {
      const mime = staticPage.metadata?.["mime-type"] || "text/html";
      if (mime !== "text/html") {
        // Non-HTML that reached the page (no route handler) — show it raw.
        return (
          <pre className="whitespace-pre-wrap break-words p-4 text-14-inter-400">
            {staticPage.content}
          </pre>
        );
      }
      // About/Contact render as Quintype static pages here — attach their
      // AboutPage / ContactPage schema (null for any other static page).
      const staticSchema = await resolvePublisherPageSchema(slug ?? []);
      // `isolate` + `transform` makes the wrapper the containing block for any
      // `position:fixed` element in the CMS content (e.g. a page loader/overlay),
      // so it stays WITHIN the content area instead of covering the site chrome.
      const body = (
        <div className="static-page-wrap w-full px-4 py-6 sm:px-6 lg:px-[60px]">
          {staticSchema && <SchemaMarkup schema={staticSchema} />}
          <StaticPageRenderer content={staticPage.content ?? ""} />
        </div>
      );
      // metadata.header / metadata.footer decide the app chrome INDEPENDENTLY:
      // true → show that piece, false / null / missing → hide it. Both off → the
      // content renders bare (no header, no footer).
      const showHeader = staticPageShowHeader(staticPage);
      const showFooter = staticPageShowFooter(staticPage);
      return showHeader || showFooter ? (
        <SiteChrome
          pageType="sectionPage"
          showHeader={showHeader}
          showFooter={showFooter}
        >
          {body}
        </SiteChrome>
      ) : (
        body
      );
    }
    notFound();
  }

  // `hide_layout` pages render bare; everything else gets the site chrome.
  // Non-home builder URLs are section/category pages.
  if (result.hideLayout) return result.content;

  const urlSlug = slugFromParams(slug);
  const resolved = resolveRoute(urlSlug);
  const sectionMeta = resolved
    ? resolvePageMeta(resolved.page, urlSlug)
    : { title: siteConfig.name, description: siteConfig.description };
  // Author profiles (/author/*) and About/Contact hubs also flow through this
  // generic section branch — give them their specific schema when they match.
  const pageSchema =
    (await resolvePublisherPageSchema(slug ?? [])) ??
    generateSectionPageSchema(
      sectionMeta.title,
      urlSlug,
      sectionMeta.description,
    );

  return (
    <SiteChrome pageType="sectionPage">
      <SchemaMarkup schema={pageSchema} />
      {result.content}
    </SiteChrome>
  );
}
