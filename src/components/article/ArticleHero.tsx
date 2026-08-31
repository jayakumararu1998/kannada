import { Fragment } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import type { Story } from "@/lib/api/stories";
import { formatArticleDate } from "@/lib/api/stories";
import { stripTags } from "@/lib/api/article-html";
import { HERO_SIZES, heroSrcSet, mediaThumb, toMediaUrl } from "@/lib/images";
import { SITE_URL } from "@/lib/constants";
import {
  canonicalHeroFieldId,
  DEFAULT_HERO_FIELDS,
  findSlot,
  resolveAuthorCard,
  resolveSlotTimestamp,
  resolveSlotValue,
  type HeroField,
  type ResolvedAuthorCard,
} from "@/lib/article/hero-fields";
import { bookmarkCategoryForStory } from "@/lib/bookmarks/category";
import { resolveStoryVideo } from "@/lib/article/story-video";
import ShareButtons from "./elements/ShareButtons";
import BookmarkButton from "./BookmarkButton";
import YouTubeEmbed from "./elements/YouTubeEmbed";
import RawEmbed from "./elements/RawEmbed";

/**
 * Dynamic, field-driven article hero — renders a `HeroField[]` config in
 * `order`, honoring `hidden` and grouping `sameRowAsPrevious` fields into a
 * flex row (same mechanism as the builder's dynamic pages). Defaults to
 * `DEFAULT_HERO_FIELDS`; pass a builder-fed config to override.
 *
 * `showHeroImage=false` (video templates lead with their own media) hides only
 * the heroImage field.
 */
export default function ArticleHero({
  story,
  heroImageUrl,
  showHeroImage = true,
  heroFields = DEFAULT_HERO_FIELDS,
}: {
  story: Story;
  heroImageUrl?: string;
  showHeroImage?: boolean;
  heroFields?: HeroField[];
}) {
  const visible = heroFields
    .filter((f) => !f.hidden && !(f.id === "heroImage" && !showHeroImage))
    .sort((a, b) => a.order - b.order);

  // Group consecutive fields (a field flagged sameRowAsPrevious joins the row
  // of the field before it) into flex rows — e.g. authorBlock | socialShare.
  const rows: HeroField[][] = [];
  for (const f of visible) {
    if (f.sameRowAsPrevious && rows.length > 0) rows[rows.length - 1].push(f);
    else rows.push([f]);
  }

  const isByline = (f: HeroField) =>
    f.id === "authorBlock" || f.id === "dateMeta" || f.id === "socialShare";

  return (
    <header>
      {rows.map((rowFields, i) => {
        // The byline row (author/date + share) gets the bordered, spaced
        // treatment; every other single field renders on its own line.
        const bylineRow = rowFields.some(isByline);
        // Row alignment from whichever field in the row sets it. A byline row
        // (author/date sharing a row) defaults to "left" so it renders as the
        // standard "Author | Date" byline; an explicit center/right overrides.
        const rowAlign =
          rowFields.map((f) => f.align).find(Boolean) ??
          (bylineRow ? "left" : undefined);

        if (rowFields.length > 1 || bylineRow) {
          // "left" packs the fields together (left) with a `|` between them;
          // "center"/"right" just justify the row; unset → default space-between.
          const justify =
            rowAlign === "left"
              ? "justify-start"
              : rowAlign === "center"
                ? "justify-center"
                : rowAlign === "right"
                  ? "justify-end"
                  : "justify-between";
          const withPipe = rowAlign === "left" && rowFields.length > 1;

          return (
            <div
              key={i}
              className={cn(
                "flex flex-wrap items-center gap-3",
                justify,
                bylineRow && "mt-3 py-3",
              )}
            >
              {rowFields.map((f, idx) => {
                const isShare = f.id === "socialShare";
                const prevShare =
                  idx > 0 && rowFields[idx - 1].id === "socialShare";
                // Pipe between adjacent NON-share fields only; share icons are
                // pushed to the right (ml-auto) so "Author | Date … [share]".
                const showPipe = withPipe && idx > 0 && !isShare && !prevShare;
                const field = (
                  <FieldRenderer
                    field={f}
                    story={story}
                    heroImageUrl={heroImageUrl}
                  />
                );
                return (
                  <Fragment key={f.id}>
                    {showPipe && (
                      <span
                        aria-hidden="true"
                        className="select-none text-808080"
                      >
                        |
                      </span>
                    )}
                    {isShare && withPipe ? (
                      <span className="ml-auto inline-flex items-center">
                        {field}
                      </span>
                    ) : (
                      field
                    )}
                  </Fragment>
                );
              })}
            </div>
          );
        }

        // Single field — honour alignment when set (else render inline as-is).
        const single = (
          <FieldRenderer
            field={rowFields[0]}
            story={story}
            heroImageUrl={heroImageUrl}
          />
        );
        if (!rowAlign) return <Fragment key={i}>{single}</Fragment>;
        return (
          <div
            key={i}
            className={cn(
              "flex",
              rowAlign === "center"
                ? "justify-center"
                : rowAlign === "right"
                  ? "justify-end"
                  : "justify-start",
            )}
          >
            {single}
          </div>
        );
      })}
    </header>
  );
}

function FieldRenderer({
  field,
  story,
  heroImageUrl,
}: {
  field: HeroField;
  story: Story;
  heroImageUrl?: string;
}) {
  switch (canonicalHeroFieldId(field)) {
    case "breadcrumb":
      return <BreadcrumbField story={story} />;
    case "categoryBadge":
      return <CategoryBadgeField field={field} story={story} />;
    case "title":
      return <TitleField field={field} story={story} />;
    case "description":
      return <DescriptionField field={field} story={story} />;
    case "heroImage":
      return (
        <HeroImageField field={field} story={story} heroImageUrl={heroImageUrl} />
      );
    case "authorBlock":
      return <AuthorBlockField field={field} story={story} />;
    case "dateMeta":
      return <DateMetaField field={field} story={story} />;
    case "socialShare":
      return <SocialShareField story={story} />;
    default:
      return null;
  }
}

function DateMetaField({ field, story }: { field: HeroField; story: Story }) {
  // Each date text field carries its own builder hide/show toggle (`hidden` on
  // the slot). A hidden `createdAt`/`updatedAt` drops that whole date; a hidden
  // `createdLabel`/`updatedLabel` drops just the "Published :"/"Updated :" label.
  const createdSlot = findSlot(field, "createdAt");
  const updatedSlot = findSlot(field, "updatedAt");
  const createdLabelSlot = findSlot(field, "createdLabel");
  const updatedLabelSlot = findSlot(field, "updatedLabel");

  const createdTs =
    resolveSlotTimestamp(story, createdSlot) ?? story["published-at"];
  const updatedTs =
    resolveSlotTimestamp(story, updatedSlot) ??
    story["updated-at"] ??
    story["last-published-at"];
  const rows = [
    !createdSlot?.hidden &&
      createdTs && {
        showLabel: !createdLabelSlot?.hidden,
        label:
          resolveSlotValue(story, createdLabelSlot ?? { key: "" }) ||
          "Published",
        value: formatArticleDate(createdTs),
      },
    !updatedSlot?.hidden &&
      updatedTs && {
        showLabel: !updatedLabelSlot?.hidden,
        label:
          resolveSlotValue(story, updatedLabelSlot ?? { key: "" }) || "Updated",
        value: formatArticleDate(updatedTs),
      },
  ].filter(Boolean) as Array<{
    showLabel: boolean;
    label: string;
    value: string;
  }>;
  if (rows.length === 0) return null;
  return (
    <div className="flex items-center gap-6">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-1">
          {r.showLabel && (
            <span className="text-12-inter-400 text-808080">{r.label} :</span>
          )}
          <span className="text-12-inter-500 text-333333">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

function sectionHref(raw?: string): string {
  return (
    "/" + String(raw ?? "").replace(/^https?:\/\/[^/]+/, "").replace(/^\/+/, "")
  );
}

function BreadcrumbField({ story }: { story: Story }) {
  const section = story?.sections?.[0];
  const href = section
    ? sectionHref(section["section-url"] ?? section.slug)
    : null;
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

function CategoryBadgeField({ field, story }: { field: HeroField; story: Story }) {
  const label = resolveSlotValue(story, findSlot(field, "sectionLabel") ?? {
    key: "sectionLabel",
  });
  if (!label) return null;
  const url = resolveSlotValue(story, findSlot(field, "sectionUrl") ?? {
    key: "sectionUrl",
  });
  return (
    <Link
      href={url ? sectionHref(url) : "#"}
      className="text-12-balootamma2-600 uppercase tracking-wide text-3742B8"
    >
      {label}
    </Link>
  );
}

function TitleField({ field, story }: { field: HeroField; story: Story }) {
  const value =
    resolveSlotValue(story, findSlot(field, "title") ?? { key: "title" }) ||
    story?.headline;
  if (!value) return null;
  const isLive =
    story?.["is-live-blog"] && !story?.metadata?.["is-closed"];
  return (
    <div className="mt-2 flex items-start gap-3">
      {isLive && (
        <span className="live-dot mt-2 inline-flex h-4 w-4 flex-shrink-0 rounded-full bg-red-600" />
      )}
      <h1 className="text-32-balootamma2-700 leading-[1.2] text-1E1E1E">
        {value}
      </h1>
    </div>
  );
}

function DescriptionField({ field, story }: { field: HeroField; story: Story }) {
  const value = resolveSlotValue(
    story,
    findSlot(field, "description") ?? { key: "description" },
  );
  if (!value) return null;
  return (
    <p className="mt-3 text-18-inter-400 leading-[1.5] text-4F4F4F">
      {stripTags(value)}
    </p>
  );
}

function HeroCaption({ story }: { story: Story }) {
  const caption = story["hero-image-caption"];
  const attribution = story["hero-image-attribution"];
  if (!caption && !attribution) return null;
  return (
    <figcaption className="mt-2 text-12-inter-400 text-6D6D6D">
      {caption && <span className="text-333333">{stripTags(caption)}</span>}
      {caption && attribution ? " — " : ""}
      {attribution}
    </figcaption>
  );
}

/** Intrinsic hero-image dimensions from `story["hero-image-metadata"]` — set as
 *  the img's width/height so the browser reserves the correct aspect ratio and
 *  the page doesn't shift while the image loads (CLS). */
function heroImageSize(story: Story): { width?: number; height?: number } {
  const meta = story["hero-image-metadata"];
  if (!meta || typeof meta !== "object") return {};
  const w = Number((meta as Record<string, unknown>).width);
  const h = Number((meta as Record<string, unknown>).height);
  return {
    width: Number.isFinite(w) && w > 0 ? w : undefined,
    height: Number.isFinite(h) && h > 0 ? h : undefined,
  };
}

/**
 * The hero media field — resolves the media MODE like dinamani's
 * HeroImageField: `video`/`gumlet-video` (field.mediaMode or story-template) →
 * story-level video (YouTube facade / raw embed); `photoGallery` or a `photo`
 * template → a swipeable carousel of every story image; otherwise the hero
 * image. So one field renders the right media per template, configurably.
 */
function HeroImageField({
  field,
  story,
  heroImageUrl,
}: {
  field: HeroField;
  story: Story;
  heroImageUrl?: string;
}) {
  const template = story["story-template"];
  const mode =
    field.mediaMode ??
    (template === "video" || template === "gumlet-video"
      ? "video"
      : undefined);

  // Video mode → play the story's lead video in the hero slot. Falls back to the
  // first youtube-video/video body element when there's no story-level embed, so
  // the body video renders IN THE HERO (and the body skips it).
  if (mode === "video" || mode === "gumletVideo") {
    const video = resolveStoryVideo(story);
    if (video.embedUrl) {
      return (
        <figure className="mt-4">
          <YouTubeEmbed
            embedUrl={video.embedUrl}
            thumbnailUrl={heroImageUrl}
            title={story.headline}
          />
          <HeroCaption story={story} />
        </figure>
      );
    }
    if (video.embedJs) {
      return (
        <figure className="mt-4">
          <RawEmbed embedJs={video.embedJs} />
          <HeroCaption story={story} />
        </figure>
      );
    }
    // No embeddable video → fall through to the hero image below.
  }

  // Photo gallery → a SINGLE static image in the hero (no carousel / arrows).
  // Prefer the hero image (rendered by the default block below); if the story
  // has no hero image, show the first gallery image as a plain figure.
  if (mode === "photoGallery" || template === "photo") {
    if (!heroImageUrl) {
      const firstCardImage = (story.cards ?? [])
        .flatMap((card: any) => card["story-elements"] ?? [])
        .find((el: any) => el?.["image-s3-key"]);
      if (firstCardImage) {
        return (
          <figure className="mt-4">
            <div className="relative w-full overflow-hidden rounded bg-gray-100 dark:bg-white/5">
              <img
                src={mediaThumb(firstCardImage["image-s3-key"], 1200, 75)}
                alt={firstCardImage.title || story.headline || "Story image"}
                className="max-h-[470px] w-full object-contain"
                fetchPriority="high"
              />
            </div>
            {(firstCardImage.title || firstCardImage["image-attribution"]) && (
              <figcaption className="mt-2 px-1 text-12-inter-400 text-6D6D6D">
                {firstCardImage.title && (
                  <span className="text-333333">
                    {stripTags(firstCardImage.title)}
                  </span>
                )}
                {firstCardImage.title && firstCardImage["image-attribution"]
                  ? " — "
                  : ""}
                {firstCardImage["image-attribution"]}
              </figcaption>
            )}
          </figure>
        );
      }
    }
    // Hero image exists → fall through to the default static hero image below.
  }

  // Default: image. Shown at its NATURAL size (never upscaled past the intrinsic
  // width from hero-image-metadata); when the source is smaller than the column,
  // a blurred copy of the same image fills the surrounding space so the hero
  // still spans full-width without stretching the actual photo.
  if (!heroImageUrl) return null;
  const { width, height } = heroImageSize(story);
  // Older imported stories carry no `hero-image-metadata`, so the <img> went
  // out with no width/height and the wrapper reserved ZERO height until the
  // bytes landed — the hero then popped in and pushed the byline, caption and
  // body down by its full height (0.066 CLS, the article page's whole mobile
  // CLS failure). With metadata the <img>'s own attributes already reserve the
  // box, so only the metadata-less case gets a ratio here and every other
  // story's layout is untouched.
  const reserveRatio = width && height ? undefined : "16 / 9";
  return (
    <figure className="mt-4">
      <div
        className="relative w-full overflow-hidden rounded bg-gray-100 dark:bg-white/5"
        style={
          reserveRatio ? { aspectRatio: reserveRatio, maxHeight: 520 } : undefined
        }
      >
        {/* Blurred backdrop — same image at thumbnail size (it's blurred
            anyway, so a tiny variant avoids fetching the original twice). */}
        <img
          src={mediaThumb(heroImageUrl, 64, 30)}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover blur-xl"
        />
        {/* Foreground — capped at the image's true width, centered, sharp.
            srcset lets phones fetch the 480/800px variant instead of w=1200
            (mobile LCP); keep in sync with the preload in the renderers. */}
        <img
          src={mediaThumb(heroImageUrl, 1200, 75)}
          srcSet={heroSrcSet(heroImageUrl)}
          sizes={HERO_SIZES}
          alt={story.headline || "Story image"}
          width={width}
          height={height}
          style={{ maxWidth: width ? `${width}px` : undefined }}
          className={cn(
            "relative z-10 mx-auto block max-h-[520px] w-full object-contain",
            reserveRatio && "h-full",
          )}
          fetchPriority="high"
        />
      </div>
      <HeroCaption story={story} />
    </figure>
  );
}

/** Colored social-icon chips on an author card (Twitter/FB/etc.). */
function AuthorSocialIcons({
  links,
}: {
  links: ResolvedAuthorCard["socialLinks"];
}) {
  if (!links || links.length === 0) return null;
  return (
    <span className="flex items-center gap-1">
      {links.map((link) => (
        <a
          key={link.id}
          href={link.url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.label}
          title={link.label}
          className="flex h-5 w-5 flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-[10px] text-white"
          style={{
            backgroundColor:
              link.iconType === "image" ? "transparent" : link.color || "#64748b",
          }}
        >
          {link.iconType === "image" && link.iconImageUrl ? (
            <img
              src={link.iconImageUrl}
              alt={link.label || ""}
              className="h-full w-full object-cover"
            />
          ) : (
            <span>{link.icon || (link.label || "•").slice(0, 1)}</span>
          )}
        </a>
      ))}
    </span>
  );
}

/** One resolved author card: prefix label + avatar + linked name + social. */
function AuthorCard({
  card,
  profileShape,
  cardLayout,
}: {
  card: ResolvedAuthorCard;
  profileShape?: "circle" | "square";
  cardLayout?: "row" | "stacked";
}) {
  const shapeClass = profileShape === "square" ? "rounded-none" : "rounded-full";
  const layoutClass =
    cardLayout === "stacked" ? "flex-col items-start gap-1" : "items-center gap-2";
  const initial = (card.label || "K").slice(0, 1);
  return (
    <div className={`flex ${layoutClass}`}>
      {card.prefixLabel && (
        <span
          className="text-13-inter-400 text-808080"
          style={{
            color: card.labelStyle?.color,
            fontSize: card.labelStyle?.fontSize,
            fontWeight: card.labelStyle?.fontWeight,
            textAlign: card.labelStyle?.align,
          }}
        >
          {card.prefixLabel}
        </span>
      )}
      {card.showProfile &&
        (card.profileImage ? (
          <img
            src={card.profileImage}
            alt={card.label || "Author"}
            className={`h-8 w-8 flex-shrink-0 object-cover ${shapeClass}`}
            loading="lazy"
          />
        ) : (
          <span
            className={`grid h-8 w-8 flex-shrink-0 place-items-center bg-E8E8E8 text-12-inter-600 text-6D6D6D ${shapeClass}`}
          >
            {initial}
          </span>
        ))}
      <span className="flex flex-wrap items-center gap-2">
        {card.showName &&
          (card.url ? (
            <Link
              href={card.url}
              className="text-14-inter-600 text-333333 hover:text-009EF9"
              style={{
                color: card.nameStyle?.color,
                fontSize: card.nameStyle?.fontSize,
                fontWeight: card.nameStyle?.fontWeight,
                textAlign: card.nameStyle?.align,
              }}
            >
              {card.label}
            </Link>
          ) : (
            <span
              className="text-14-inter-600 text-333333"
              style={{
                color: card.nameStyle?.color,
                fontSize: card.nameStyle?.fontSize,
                fontWeight: card.nameStyle?.fontWeight,
                textAlign: card.nameStyle?.align,
              }}
            >
              {card.label}
            </span>
          ))}
        {card.showSocial && <AuthorSocialIcons links={card.socialLinks} />}
      </span>
    </div>
  );
}

/**
 * Author block for the hero. Two modes, mirroring dinamani's AuthorTrail:
 *  - Rich card (`field.author` set): primary + optional guest author, each with
 *    avatar/name/social, resolved dynamically from the story. `authorLayout`
 *    lays the cards row/stacked.
 *  - Legacy slot mode (no `field.author`, e.g. DEFAULT_HERO_FIELDS): the simple
 *    avatar + linked name (+ inline date) from name/slug/avatar slots.
 */
function AuthorBlockField({ field, story }: { field: HeroField; story: Story }) {
  if (field.author) {
    const author = resolveAuthorCard(field.author, story);
    const guest = field.guestAuthorEnabled
      ? resolveAuthorCard(field.guestAuthor, story)
      : null;
    if (!author && !guest) return null;
    const layoutClass =
      field.authorLayout === "stacked"
        ? "flex-col items-start gap-3"
        : "flex-row flex-wrap items-center gap-4";
    return (
      <div className={`flex ${layoutClass}`}>
        {author && (
          <AuthorCard
            card={author}
            profileShape={field.profileShape}
            cardLayout={field.cardLayout}
          />
        )}
        {guest && (
          <AuthorCard
            card={guest}
            profileShape={field.profileShape}
            cardLayout={field.cardLayout}
          />
        )}
      </div>
    );
  }

  // Legacy slot mode.
  const name = resolveSlotValue(story, findSlot(field, "authorName") ?? {
    key: "authorName",
  });
  const slug = resolveSlotValue(story, findSlot(field, "authorSlug") ?? {
    key: "authorSlug",
  });
  const avatar = resolveSlotValue(story, findSlot(field, "authorAvatar") ?? {
    key: "authorAvatar",
  });
  const updatedTs = resolveSlotTimestamp(story, findSlot(field, "updatedAt"));
  const publishedTs = resolveSlotTimestamp(story, findSlot(field, "publishedAt"));
  const dateText = updatedTs
    ? `Updated On ${formatArticleDate(updatedTs)}`
    : publishedTs
      ? `Published ${formatArticleDate(publishedTs)}`
      : "";

  if (!name && !avatar && !dateText) return null;

  return (
    <div className="flex items-center gap-2">
      {avatar ? (
        <img
          src={toMediaUrl(avatar)}
          alt={name || "Author"}
          className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
          loading="lazy"
        />
      ) : (
        <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-E8E8E8 text-12-inter-600 text-6D6D6D">
          {(name || "K").slice(0, 1)}
        </span>
      )}
      <p className="text-13-inter-400 text-6D6D6D">
        {name && (
          <span className="text-14-inter-600 text-333333">
            {slug ? (
              <Link href={`/author/${slug}`} className="hover:text-009EF9">
                {name}
              </Link>
            ) : (
              name
            )}
          </span>
        )}
        {name && dateText && <span className="mx-2 text-D1D1D1">|</span>}
        {dateText}
      </p>
    </div>
  );
}

function SocialShareField({ story }: { story: Story }) {
  const canonical = `${SITE_URL.replace(/\/+$/, "")}/${story.slug}`;
  const heroImg = story["hero-image-s3-key"];
  return (
    <div className="flex items-center gap-2">
      <ShareButtons url={canonical} title={story.headline || ""} />
      <BookmarkButton
        slug={story.slug}
        category={bookmarkCategoryForStory(story)}
        title={story.headline || ""}
        thumbnailUrl={heroImg ? toMediaUrl(heroImg) : undefined}
        description={story.subheadline || story.summary}
        articleUrl={story.slug ? `/${story.slug}` : undefined}
      />
    </div>
  );
}
