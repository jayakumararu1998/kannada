/**
 * Dynamic, field-driven article hero — the same concept as the builder's
 * dynamic pages: the hero is a `HeroField[]` config rendered in `order`,
 * honoring `hidden` and `sameRowAsPrevious`, with each field's values resolved
 * from the story via bindable slots (`apiField` path into the story object).
 * Ported/trimmed from dinamani's articleTemplate + articleTemplateFields.
 *
 * `DEFAULT_HERO_FIELDS` is the built-in config (kannada has no builder-synced
 * article templates yet); a builder-fed `heroFields` array can replace it later
 * with zero renderer changes.
 */

import type { Story } from "@/lib/api/stories";
import { toMediaUrl } from "@/lib/images";

export type HeroFieldId =
  | "breadcrumb"
  | "categoryBadge"
  | "title"
  | "description"
  | "heroImage"
  | "dateMeta"
  | "socialShare"
  | "authorBlock";

/** All valid canonical hero-field ids, for O(1) membership checks. */
const HERO_FIELD_IDS: ReadonlySet<string> = new Set<HeroFieldId>([
  "breadcrumb",
  "categoryBadge",
  "title",
  "description",
  "heroImage",
  "dateMeta",
  "socialShare",
  "authorBlock",
]);

/** Normalised builder label ("Hero Image" → "heroimage") → canonical id. */
const HERO_LABEL_TO_ID: Readonly<Record<string, HeroFieldId>> = {
  breadcrumb: "breadcrumb",
  categorybadge: "categoryBadge",
  category: "categoryBadge",
  section: "categoryBadge",
  title: "title",
  headline: "title",
  description: "description",
  subheadline: "description",
  summary: "description",
  heroimage: "heroImage",
  image: "heroImage",
  media: "heroImage",
  featuredimage: "heroImage",
  datemeta: "dateMeta",
  date: "dateMeta",
  datetime: "dateMeta",
  publisheddate: "dateMeta",
  socialshare: "socialShare",
  social: "socialShare",
  share: "socialShare",
  authorblock: "authorBlock",
  author: "authorBlock",
  byline: "authorBlock",
};

/**
 * The canonical hero-field id for a builder field. Most templates already key a
 * field by its semantic id ("heroImage"), but some (e.g. `storylisticle`) key it
 * by a UUID and carry the type only in `label` ("Hero Image"). This resolves
 * both shapes to the canonical id so the HTML and AMP hero renderers — which
 * switch on the id — render dynamic values in either case. Returns `null` when
 * the field can't be classified.
 */
export function canonicalHeroFieldId(field: HeroField): HeroFieldId | null {
  if (field?.id && HERO_FIELD_IDS.has(field.id)) return field.id;
  const key = (field?.label ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return key ? HERO_LABEL_TO_ID[key] ?? null : null;
}

export type HeroImageMediaMode =
  | "image"
  | "video"
  | "gumletVideo"
  | "photoGallery";

export interface HeroFieldSlot {
  key: string;
  /** Dot/bracket path into `{ story }` (e.g. `story.headline`,
   *  `story.sections[].name`). `[]` means "first item". */
  apiField?: string;
  apiFieldFallback?: string;
  /** Static text used only when no apiField is configured. */
  static?: string;
  hidden?: boolean;
  /** Marks the slot value as an epoch timestamp to be date-formatted. */
  dateFormat?: boolean;
}

/** Inline text style the builder emits for an author card's label/name. */
export interface AuthorTextStyle {
  color?: string;
  fontSize?: string;
  fontWeight?: string;
  align?: "left" | "center" | "right";
}

/** One social icon on an author card. */
export interface AuthorSocialLink {
  id: string;
  url?: string;
  label?: string;
  icon?: string;
  iconType?: "image" | "icon";
  iconImageUrl?: string;
  color?: string;
  reactIconKey?: string;
  hidden?: boolean;
}

/**
 * A rich author card (dinamani's AuthorCardItem). `apiField` binds the visible
 * name, `urlApiField` the link, `profileApiField` the avatar — each a path into
 * the story. Toggles decide which pieces render.
 */
export interface AuthorCardItem {
  id: string;
  apiField?: string;
  urlApiField?: string;
  profileApiField?: string;
  label?: string;
  url?: string;
  prefixLabel?: string;
  profileImage?: string;
  showProfile?: boolean;
  showName?: boolean;
  showSocial?: boolean;
  socialLinks?: AuthorSocialLink[];
  hidden?: boolean;
  labelStyle?: AuthorTextStyle;
  nameStyle?: AuthorTextStyle;
}

export interface HeroField {
  id: HeroFieldId;
  /** Builder display label (e.g. "Hero Image"). Some templates key a field by a
   *  UUID `id` and carry its semantic type only here — see `canonicalHeroFieldId`. */
  label?: string;
  order: number;
  hidden?: boolean;
  sameRowAsPrevious?: boolean;
  /** Row alignment for fields sharing a row (builder option). "left" packs the
   *  fields together left-aligned, joined by a `|` pipe; "center"/"right" just
   *  justify the row with no pipe. When unset, the row keeps its default
   *  (space-between) layout. */
  align?: "left" | "center" | "right";
  slots?: HeroFieldSlot[];
  mediaMode?: HeroImageMediaMode;
  /** dateMeta only — order of the two label/value pairs. */
  pairOrder?: string[];
  // authorBlock (rich card mode) — the builder's author data model.
  author?: AuthorCardItem;
  guestAuthor?: AuthorCardItem;
  guestAuthorEnabled?: boolean;
  authorLayout?: "row" | "stacked";
  cardLayout?: "row" | "stacked";
  profileShape?: "circle" | "square";
}

/** A fully-resolved author card ready to render. */
export interface ResolvedAuthorCard {
  id: string;
  prefixLabel?: string;
  label: string;
  url: string;
  profileImage?: string;
  showProfile: boolean;
  showName: boolean;
  showSocial: boolean;
  socialLinks: AuthorSocialLink[];
  labelStyle?: AuthorTextStyle;
  nameStyle?: AuthorTextStyle;
}

/**
 * Resolve one author card against a story (dinamani's resolveAuthorCard):
 *  - `label` from `apiField` (else static `label`)
 *  - `url` from `urlApiField`; a bare slug → `/author/{slug}`; if unset and the
 *    name field ends `.name`, derive the sibling `.slug`
 *  - avatar from `profileApiField` (else static `profileImage`)
 * Returns null when hidden or there's nothing to show.
 */
export function resolveAuthorCard(
  card: AuthorCardItem | undefined,
  story: Story | null | undefined,
): ResolvedAuthorCard | null {
  if (!card || card.hidden) return null;

  let label: string;
  let url: string;

  // The author name lives at a `.name` field and the link at a `.slug` field.
  // The builder can map either to `apiField`/`urlApiField` (they're sometimes
  // swapped), so bind by the field SUFFIX, not the prop, to stay correct either
  // way: name → label, slug → `/author/{slug}`.
  const bound = [card.apiField, card.urlApiField].filter(Boolean) as string[];
  const nameField = bound.find((f) => f.endsWith(".name"));
  const slugField = bound.find((f) => f.endsWith(".slug"));

  if (nameField || slugField) {
    label = nameField ? String(resolveStoryField(story, nameField) ?? "") : "";
    const slug = slugField
      ? String(resolveStoryField(story, slugField) ?? "")
      : "";
    // Only a slug was bound → fall back to its sibling name for the label.
    if (!label && slugField) {
      label = String(
        resolveStoryField(story, slugField.replace(/\.slug$/, ".name")) ?? "",
      );
    }
    if (!label) label = card.label ?? "";
    url = slug ? `/author/${slug}` : card.url ?? "";
  } else {
    // Generic mapping (custom apiField/urlApiField, not name/slug).
    label = card.apiField
      ? String(resolveStoryField(story, card.apiField) ?? "")
      : card.label ?? "";
    url = card.urlApiField
      ? String(resolveStoryField(story, card.urlApiField) ?? "")
      : "";
    if (url && !url.startsWith("/") && !/^[a-z][a-z0-9+.-]*:/i.test(url)) {
      url = `/author/${url}`;
    }
    if (!url) url = card.url ?? "";
  }

  const profileRaw = card.profileApiField
    ? resolveStoryField(story, card.profileApiField)
    : card.profileImage;
  const profileImage =
    typeof profileRaw === "string" && profileRaw ? toMediaUrl(profileRaw) : "";

  if (!label && !profileImage) return null;

  return {
    id: card.id,
    prefixLabel: card.prefixLabel,
    label,
    url,
    profileImage,
    showProfile: card.showProfile !== false,
    showName: card.showName !== false && !!label,
    showSocial: !!card.showSocial,
    socialLinks: (card.socialLinks ?? []).filter((s) => !s.hidden),
    labelStyle: card.labelStyle,
    nameStyle: card.nameStyle,
  };
}

/** Resolve a dotted/bracketed apiField path against `{ story }`. */
export function resolveStoryField(
  story: Story | null | undefined,
  apiField?: string | null,
): unknown {
  if (!story || !apiField) return undefined;
  const normalized = apiField.replace(/\[\]/g, "[0]");
  const parts = normalized.replace(/\[(\d+)\]/g, ".$1").split(".");
  let value: unknown = { story };
  for (const part of parts) {
    if (value == null) return undefined;
    if (Array.isArray(value) && !/^\d+$/.test(part)) {
      value = value[0];
      if (value == null) return undefined;
    }
    value = (value as Record<string, unknown>)?.[part];
  }
  return value;
}

/** Resolve a slot to display text (apiField → fallback → static). */
export function resolveSlotValue(
  story: Story | null | undefined,
  slot: HeroFieldSlot,
): string {
  if (slot.apiField) {
    const v = resolveStoryField(story, slot.apiField);
    if (v !== undefined && v !== null && v !== "") return String(v);
    if (slot.apiFieldFallback) {
      const f = resolveStoryField(story, slot.apiFieldFallback);
      if (f !== undefined && f !== null && f !== "") return String(f);
    }
    return "";
  }
  return slot.static ?? "";
}

export function findSlot(field: HeroField, key: string): HeroFieldSlot | undefined {
  return field.slots?.find((s) => s.key === key);
}

/** Raw timestamp from a slot (for date-formatting in the renderer). */
export function resolveSlotTimestamp(
  story: Story | null | undefined,
  slot?: HeroFieldSlot,
): number | string | undefined {
  if (!slot) return undefined;
  const v = resolveStoryField(story, slot.apiField);
  if (v == null || v === "") {
    const f = resolveStoryField(story, slot.apiFieldFallback);
    return f as number | string | undefined;
  }
  return v as number | string;
}

/**
 * The built-in hero layout. Order reproduces the approved design:
 * breadcrumb → category → title → description → hero image → (author + date | share).
 */
export const DEFAULT_HERO_FIELDS: HeroField[] = [
  { id: "breadcrumb", order: 0 },
  {
    id: "categoryBadge",
    order: 1,
    slots: [
      { key: "sectionLabel", apiField: "story.sections[].name" },
      { key: "sectionUrl", apiField: "story.sections[].section-url" },
    ],
  },
  {
    id: "title",
    order: 2,
    slots: [{ key: "title", apiField: "story.headline" }],
  },
  {
    id: "description",
    order: 3,
    slots: [
      {
        key: "description",
        apiField: "story.subheadline",
        apiFieldFallback: "story.summary",
      },
    ],
  },
  { id: "heroImage", order: 4 },
  {
    id: "authorBlock",
    order: 5,
    slots: [
      { key: "authorName", apiField: "story.authors[].name" },
      { key: "authorSlug", apiField: "story.authors[].slug" },
      { key: "authorAvatar", apiField: "story.authors[].avatar-s3-key" },
      {
        key: "updatedAt",
        apiField: "story.updated-at",
        apiFieldFallback: "story.last-published-at",
        dateFormat: true,
      },
      { key: "publishedAt", apiField: "story.published-at", dateFormat: true },
    ],
  },
  { id: "socialShare", order: 6, sameRowAsPrevious: true },
];
