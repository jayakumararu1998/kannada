import Link from "next/link";

import type { Story } from "@/lib/api/stories";
import type { ArticleTemplateConfig } from "@/lib/builder/types";
import type {
  Column,
  PageComponent,
  ResponsiveWidth,
  Row,
  Section,
} from "@/lib/builder/types";
import { HERO_SIZES, heroSrcSet, mediaThumb, toMediaUrl } from "@/lib/images";
import { SITE_URL } from "@/lib/constants";
import { getStore } from "@/lib/builder/store";
import {
  applyVuukleVars,
  extractVuukleConfig,
  injectVuukleConfig,
  resolveVuukleVars,
  vuukleWidgetId,
  type VuukleArticleContext,
} from "@/lib/builder/vuukle";
import {
  PaddingBox,
  PaddingStyle,
  hasPadding,
  paddingClass,
} from "@/lib/builder/padding";
import { cn } from "@/lib/utils";
import type { HeroField } from "@/lib/article/hero-fields";
import type { InArticleAdSlot } from "@/lib/article/inline-ads";
import ComponentRenderer from "@/components/builder/ComponentRenderer";
import TaboolaPlacement from "@/components/ads/TaboolaPlacement";
import ArticleHero from "./ArticleHero";
import ArticleBody from "./ArticleBody";
import VuukleComments from "./VuukleComments";
import ArticleLiveBlog from "./ArticleLiveBlog";
import LiveBlogKeyEvents from "./LiveBlogKeyEvents";
import ArticleTags from "./ArticleTags";
import RelatedStories from "./RelatedStories";

/**
 * Fully builder-driven article renderer — mirrors dinamani's
 * ArticleTemplateRenderer. Walks the synced template's
 * `pageJson.sections → rows → columns → components` (honoring `children_order`)
 * and dispatches the `Article*` marker component types to their renderers:
 *
 *  - ArticleHeroSection      → dynamic hero from the marker's `heroFields`
 *  - ArticleBreadcrumb       → Home › Section trail
 *  - ArticleAuthorBlock      → author byline
 *  - ArticleRelatedStories   → related rail
 *  - ArticleTags / …StoryTags→ tag chips
 *  - body markers (ArticleTextTemplate, ArticleListicleTemplate, …) → ArticleBody
 *    (the per-template look is already encoded in the story-elements; video
 *    markers additionally lead with the story-level video)
 *
 * Anything not recognised renders nothing (article templates aren't
 * collection-bound, so there's no item data for generic cards). The layout
 * (rows = 12-col grid, columns = responsive col-spans, `children_order`) is
 * reproduced from the builder tree, so the template is fully configurable.
 */

const BODY_MARKERS = new Set([
  "ArticleTextTemplate",
  "ArticleListicleTemplate",
  "ArticleVideoTemplate",
  "ArticleQuestionAnswerTemplate",
  "ArticleGumletVideoTemplate",
  "ArticleReviewTemplate",
  "ArticleSyndicatedTemplate",
  "ArticlePhotoTemplate",
  "ArticleInterviewTemplate",
  "ArticlePhotoVisualTemplate",
  "ArticleLiveBlogTemplate",
]);


interface Ctx {
  story: Story;
  relatedStories: Story[];
  heroImageUrl?: string;
  /** When set, the auto-appended tag chips are emitted inline just BEFORE the
   *  first comments (Vuukle) block instead of at the end of the article — so
   *  they read as "end of the article, before comments". Mutated once. */
  tagsBeforeComments?: { emitted: boolean };
}

function sectionHref(raw?: string): string {
  return (
    "/" + String(raw ?? "").replace(/^https?:\/\/[^/]+/, "").replace(/^\/+/, "")
  );
}

/** Per-article values the Vuukle `dynamicFields` sources resolve against. */
function vuukleContext(story: Story): VuukleArticleContext {
  const section = story?.sections?.[0] as
    | { slug?: string; "section-url"?: string }
    | undefined;
  return {
    canonicalUrl: `${SITE_URL.replace(/\/+$/, "")}/${story.slug ?? ""}`,
    id: String(story.id ?? ""),
    title: story.headline ?? "",
    imageUrl: story["hero-image-s3-key"]
      ? toMediaUrl(story["hero-image-s3-key"])
      : "",
    categorySlug: section?.slug ?? section?.["section-url"] ?? "",
  };
}

/** Vuukle comments for the HTML page — resolves the builder config for THIS
 *  story and renders the substituted `nonAmp.html` in a resizable iframe.
 *  `disclaimer` is the builder-authored ArticleComments prop shown above the
 *  widget; unset renders nothing (same as dinamani). */
function VuukleCommentsBlock({
  story,
  disclaimer,
}: {
  story: Story;
  disclaimer?: string;
}) {
  const config = extractVuukleConfig(getStore().getVuukleSettings());
  if (!config?.enabled || !config.nonAmp?.enabled || !config.nonAmp.html) {
    return null;
  }
  const widgetId = vuukleWidgetId(String(story.id ?? ""));
  const ctx = vuukleContext(story);
  const vars = resolveVuukleVars(config, ctx, widgetId);
  // Tell Vuukle the real site (host/url/title/img/tags) so it keys comments off
  // the configured domain, not the srcdoc iframe's page origin.
  const srcDoc = injectVuukleConfig(applyVuukleVars(config.nonAmp.html, vars), {
    host: config.host ?? "",
    url: ctx.canonicalUrl ?? "",
    title: ctx.title ?? "",
    img: ctx.imageUrl ?? "",
    tags: ctx.categorySlug ?? "",
  });
  return (
    <div className="w-full py-4">
      {disclaimer?.trim() && (
        <p className="pb-3 text-12-balootamma2-400 leading-140 text-808080">
          {disclaimer}
        </p>
      )}
      <VuukleComments srcDoc={srcDoc} widgetId={widgetId} />
    </div>
  );
}

function Breadcrumb({ story }: { story: Story }) {
  const section = story?.sections?.[0];
  const href = section ? sectionHref(section["section-url"] ?? section.slug) : null;
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-1 pb-3 text-12-inter-500 text-808080"
    >
      <Link href="/" className="hover:text-009EF9">
        ಮುಖಪುಟ
      </Link>
      {section?.name && href && (
        <>
          <span aria-hidden>›</span>
          <Link href={href} className="hover:text-009EF9">
            {section.name}
          </Link>
        </>
      )}
    </nav>
  );
}

function AuthorBlock({ story }: { story: Story }) {
  const authors = (story?.authors ?? []).filter((a: any) => a?.name);
  if (authors.length === 0) return null;
  return (
    <div className="flex items-center gap-2 py-3">
      {authors[0]["avatar-s3-key"] && (
        <img
          src={toMediaUrl(authors[0]["avatar-s3-key"])}
          alt={authors[0].name}
          className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
          loading="lazy"
        />
      )}
      <p className="text-14-inter-600 text-333333">
        {authors.map((a: any, i: number) => (
          <span key={a.id || i}>
            {i > 0 && ", "}
            {a.slug ? (
              <Link href={`/author/${a.slug}`} className="hover:text-009EF9">
                {a.name}
              </Link>
            ) : (
              a.name
            )}
          </span>
        ))}
      </p>
    </div>
  );
}

function renderComponent(component: PageComponent, ctx: Ctx): React.ReactNode {
  // Some templates (e.g. the "photo" gallery) are stored as AMP templates, so
  // their markers carry an `Amp` prefix (`AmpArticlePhotoTemplate`,
  // `AmpArticleHeroSection`, …). On the HTML page those must render through the
  // same HTML renderers as their non-AMP twins, so we strip the prefix before
  // matching — otherwise the body falls through to the generic renderer and
  // shows the builder's placeholder content instead of the real story.
  const type = (component.component_type || "").replace(/^Amp/, "");
  const props = (component.props ?? {}) as Record<string, any>;

  if (BODY_MARKERS.has(type)) {
    // Live-blog body → the polling timeline; everything else → the standard body.
    if (
      type === "ArticleLiveBlogTemplate" ||
      ctx.story["is-live-blog"] === true ||
      ctx.story["story-template"] === "live-blog"
    ) {
      return (
        <ArticleLiveBlog story={ctx.story} heroImageUrl={ctx.heroImageUrl} />
      );
    }
    // Video templates play the lead video in the HERO (ArticleHeroSection),
    // so the body no longer leads with a separate StoryLevelVideo block.
    return (
      <ArticleBody
        story={ctx.story}
        heroImageUrl={ctx.heroImageUrl}
        inArticleAds={props.inArticleAds as InArticleAdSlot[] | undefined}
      />
    );
  }

  switch (type) {
    case "ArticleHeroSection":
      return (
        <ArticleHero
          story={ctx.story}
          heroImageUrl={ctx.heroImageUrl}
          heroFields={
            Array.isArray(props.heroFields) && props.heroFields.length > 0
              ? (props.heroFields as HeroField[])
              : undefined
          }
        />
      );
    case "ArticleLiveBlogKeyEvents":
      return <LiveBlogKeyEvents story={ctx.story} />;
    case "ArticleBreadcrumb":
      return <Breadcrumb story={ctx.story} />;
    case "ArticleAuthorBlock":
      return <AuthorBlock story={ctx.story} />;
    case "ArticleRelatedStories":
      return (
        <RelatedStories
          stories={ctx.relatedStories}
          category={ctx.story?.sections?.[0]?.name?.trim()}
        />
      );
    case "ArticleTags":
    case "ArticleStoryTags":
      return <ArticleTags story={ctx.story} />;
    case "ArticleComments":
    case "ArticleCommentsSection":
    case "AmpArticleComments": {
      // Emit the auto-appended tag chips right before the (first) comments block
      // so they sit at the end of the article, above Vuukle.
      const emitTags = ctx.tagsBeforeComments && !ctx.tagsBeforeComments.emitted;
      if (ctx.tagsBeforeComments) ctx.tagsBeforeComments.emitted = true;
      return (
        <>
          {emitTags && <ArticleTags story={ctx.story} />}
          <VuukleCommentsBlock
            story={ctx.story}
            disclaimer={
              typeof props.disclaimer === "string" ? props.disclaimer : undefined
            }
          />
        </>
      );
    }
    // Taboola placements on the article page — code comes from the pulled config
    // (`config.pages.article.<position>`), rendered by the lazy client slot.
    case "ArticleTaboolaBottom":
    case "AmpArticleTaboolaBottom":
      return <TaboolaPlacement pageType="article" position="bottomAd" />;
    case "ArticleTaboolaRightRail":
      return (
        <TaboolaPlacement pageType="article" position="rightRailAd" sticky />
      );
    case "ArticleTaboolaMid":
      return <TaboolaPlacement pageType="article" position="midAd" />;
    default:
      // Any non-Article component the template author drops in (include-section,
      // plain image/HTML widget, a news card, …) → the generic builder
      // ComponentRenderer, exactly like dinamani falls back to
      // MultiComponentRenderer. Article templates aren't collection-bound, so
      // items is empty (include-sections resolve their own default collection).
      if (component.component_type || component.widget_type) {
        return <ComponentRenderer component={component} items={[]} />;
      }
      return null;
  }
}

// Static col-span maps (Tailwind needs literal class strings).
const col: Record<number, string> = {
  1: "col-span-1", 2: "col-span-2", 3: "col-span-3", 4: "col-span-4",
  5: "col-span-5", 6: "col-span-6", 7: "col-span-7", 8: "col-span-8",
  9: "col-span-9", 10: "col-span-10", 11: "col-span-11", 12: "col-span-12",
};
const md: Record<number, string> = {
  1: "md:col-span-1", 2: "md:col-span-2", 3: "md:col-span-3", 4: "md:col-span-4",
  5: "md:col-span-5", 6: "md:col-span-6", 7: "md:col-span-7", 8: "md:col-span-8",
  9: "md:col-span-9", 10: "md:col-span-10", 11: "md:col-span-11", 12: "md:col-span-12",
};
const lg: Record<number, string> = {
  1: "lg:col-span-1", 2: "lg:col-span-2", 3: "lg:col-span-3", 4: "lg:col-span-4",
  5: "lg:col-span-5", 6: "lg:col-span-6", 7: "lg:col-span-7", 8: "lg:col-span-8",
  9: "lg:col-span-9", 10: "lg:col-span-10", 11: "lg:col-span-11", 12: "lg:col-span-12",
};

function widthClass(width?: ResponsiveWidth): string {
  return `${col[width?.mobile ?? 12] || "col-span-12"} ${md[width?.tablet ?? 12] || "md:col-span-12"} ${lg[width?.desktop ?? 12] || "lg:col-span-12"}`;
}

function renderColumnChildren(column: Column, ctx: Ctx): React.ReactNode[] {
  if (column.children_order && column.children_order.length > 0) {
    return column.children_order.map((child, i) => {
      if (child.type === "component") {
        const c = column.components?.find((x) => x.id === child.id);
        return c ? (
          <PaddingBox key={c.id} id={c.id} padding={c.padding}>
            {renderComponent(c, ctx)}
          </PaddingBox>
        ) : null;
      }
      if (child.type === "nested-column") {
        const nc = column.columns?.find((x) => x.id === child.id);
        return nc ? renderColumn(nc, ctx) : null;
      }
      if (child.type === "nested-row") {
        const nr = column.rows?.find((x) => x.id === child.id);
        return nr ? renderRow(nr, ctx, `nr-${i}`) : null;
      }
      return null;
    });
  }
  return [
    ...(column.components ?? []).map((c) => (
      <PaddingBox key={c.id} id={c.id} padding={c.padding}>
        {renderComponent(c, ctx)}
      </PaddingBox>
    )),
    ...(column.columns ?? []).map((c) => renderColumn(c, ctx)),
    ...(column.rows ?? []).map((r, i) => renderRow(r, ctx, `nr-${i}`)),
  ];
}

function renderColumn(column: Column, ctx: Ctx): React.ReactNode {
  if (column.hidden) return null;
  return (
    <div
      key={column.id}
      className={cn(
        widthClass(column.width),
        "flex flex-col",
        hasPadding(column.padding) && paddingClass(column.id),
      )}
    >
      <PaddingStyle id={column.id} padding={column.padding} />
      {renderColumnChildren(column, ctx)}
    </div>
  );
}

function renderRow(row: Row, ctx: Ctx, key?: string): React.ReactNode {
  if (row.hidden) return null;
  return (
    <div
      key={key ?? row.id}
      className={cn(
        "grid grid-cols-12 gap-8",
        hasPadding(row.padding) && paddingClass(row.id),
      )}
    >
      <PaddingStyle id={row.id} padding={row.padding} />
      {(row.columns ?? []).map((c) => renderColumn(c, ctx))}
    </div>
  );
}

/** Tag marker component types the template may place explicitly. */
const TAG_MARKERS = new Set(["ArticleTags", "ArticleStoryTags"]);

/** Comments (Vuukle) marker component types. */
const COMMENT_MARKERS = new Set([
  "ArticleComments",
  "ArticleCommentsSection",
  "AmpArticleComments",
]);

/** Does the template tree already place a tags component anywhere? */
function templateHasComponent(node: unknown, markers: Set<string>): boolean {
  if (!node) return false;
  if (Array.isArray(node)) return node.some((n) => templateHasComponent(n, markers));
  if (typeof node === "object") {
    const obj = node as Record<string, unknown>;
    if (markers.has(String(obj.component_type ?? ""))) return true;
    return Object.values(obj).some(
      (v) => v && typeof v === "object" && templateHasComponent(v, markers),
    );
  }
  return false;
}

export default function ArticleTemplateRenderer({
  story,
  template,
  relatedStories = [],
}: {
  story: Story;
  template: ArticleTemplateConfig;
  relatedStories?: Story[];
}) {
  const sections: Section[] =
    (template.pageJson?.sections as Section[]) ?? template.sections ?? [];
  const ctx: Ctx = {
    story,
    relatedStories,
    heroImageUrl: story["hero-image-s3-key"]
      ? toMediaUrl(story["hero-image-s3-key"])
      : undefined,
  };

  // The builder templates don't place a tags marker, so tags would never show.
  // Append them (styled chip list) when the story has tags and the template
  // doesn't already render them itself. Position: at the END of the article but
  // BEFORE the Vuukle comments block — so when the template has a comments
  // marker we emit the chips inline right before it; otherwise we append them
  // after the sections.
  const hasTags = (story?.tags?.length ?? 0) > 0;
  const appendTags = hasTags && !templateHasComponent(sections, TAG_MARKERS);
  const hasComments = templateHasComponent(sections, COMMENT_MARKERS);
  if (appendTags && hasComments) ctx.tagsBeforeComments = { emitted: false };

  return (
    <article className="w-full px-4 py-6 sm:px-6 lg:px-[60px]">
      {ctx.heroImageUrl && (
        <link
          rel="preload"
          as="image"
          href={mediaThumb(ctx.heroImageUrl, 1200, 75)}
          imageSrcSet={heroSrcSet(ctx.heroImageUrl)}
          imageSizes={HERO_SIZES}
          fetchPriority="high"
        />
      )}
      {sections.map((section, si) => (
        <div key={section.id ?? si} className="flex flex-col gap-6">
          {(section.rows ?? []).map((row, ri) => renderRow(row, ctx, `s${si}-r${ri}`))}
        </div>
      ))}
      {/* Fallback: no comments block in the template → append at the very end. */}
      {appendTags && !hasComments && <ArticleTags story={story} />}
    </article>
  );
}
