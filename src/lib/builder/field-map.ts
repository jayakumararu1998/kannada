/**
 * Pure field-mapping engine. Turns a fetched API item into the props a kannada
 * component expects, honouring that project's prop conventions:
 *   - "FieldConfig" props  → { hidden, value, customClass }
 *   - scalar props         → bare string (imageSrc on vertical cards, href, slug)
 * Which props are which is declared per-component in the registry `propShape`.
 *
 * No React, no I/O — safe to unit test in isolation.
 */

import { mediaThumb, toMediaUrl } from "@/lib/images";

import type {
  ComponentNavigation,
  DataConfig,
  FieldMapValue,
  FilterCondition,
  TransformedItem,
} from "./types";

/** Declares how a component's props should be shaped when mapped. */
export interface PropShape {
  /** Props that must be wrapped as { hidden, value, customClass }. */
  fieldProps?: string[];
  /** Prop that receives the image URL + whether it's a FieldConfig or a string. */
  imageProp?: { name: string; shape: "field" | "string" };
  /** Prop that receives the navigation href (default: "articleHref"). */
  hrefProp?: string;
}

export interface FieldConfig {
  hidden?: boolean;
  value?: string;
  customClass?: string;
}

/**
 * Resolve a dot/bracket path against an item, checking `_raw` (original API
 * response) first, then the flattened item. Supports "a.b", "arr[].x",
 * "arr[0].x" (empty [] means index 0).
 */
export function resolveFieldPath(
  item: TransformedItem,
  fieldPath: string,
): unknown {
  if (!fieldPath) return undefined;
  const fromRaw = item._raw ? dig(item._raw, fieldPath) : undefined;
  if (fromRaw !== undefined && fromRaw !== null) return fromRaw;
  return dig(item as Record<string, unknown>, fieldPath);
}

function dig(obj: unknown, path: string): unknown {
  const parts = path
    .replace(/\[(\d*)\]/g, (_m, i) => `.${i === "" ? "0" : i}`)
    .split(".")
    .filter(Boolean);
  let cur: unknown = obj;
  for (const part of parts) {
    if (cur == null) return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

function toStr(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

/** Resolve a single field_map value to its string result. */
function resolveEntry(item: TransformedItem, entry: FieldMapValue): {
  value: string;
  hidden?: boolean;
  customClass?: string;
} {
  if (typeof entry === "string") {
    return { value: toStr(resolveFieldPath(item, entry)) };
  }
  const candidates = entry.apiFields ?? (entry.apiField ? [entry.apiField] : []);
  let resolved: unknown;
  for (const path of candidates) {
    const v = resolveFieldPath(item, path);
    if (v !== undefined && v !== null && v !== "") {
      resolved = v;
      break;
    }
  }
  if (resolved === undefined && entry.value !== undefined) resolved = entry.value;
  return {
    value: toStr(resolved),
    hidden: entry.hidden,
    customClass: entry.customClass,
  };
}

/**
 * Build the props object for a component from one item.
 * `defaults` are the component's static props (merged under mapped values).
 */
export function mapItemToProps(
  item: TransformedItem,
  dataConfig: DataConfig | undefined,
  shape: PropShape,
  navUrl: string | null,
  defaults?: Record<string, unknown>,
): Record<string, unknown> {
  // Deep clone so mutating nested FieldConfig objects doesn't leak across loop
  // iterations (defaults is the shared component.props object).
  const props: Record<string, unknown> = defaults
    ? (structuredClone(defaults) as Record<string, unknown>)
    : {};
  const fieldProps = new Set(shape.fieldProps ?? []);
  const imageName = shape.imageProp?.name ?? "imageSrc";
  const hrefName = shape.hrefProp ?? "articleHref";
  const fieldMap = dataConfig?.field_map;

  // Builder pages ship template props + data_binding (no field_map). Fill the
  // template's FieldConfig `.value` / `image.imageSrc` from the bound item by
  // convention (dinamani's "no field_map → standard fields" behaviour). Runs
  // BEFORE field_map so explicit field_map entries win.
  fillConventionalProps(props, item);

  if (fieldMap) {
    for (const [prop, entry] of Object.entries(fieldMap)) {
      const { value, hidden, customClass } = resolveEntry(item, entry);

      if (prop === imageName) {
        const img = value || (toStr(item.imageSrc) ?? "");
        props[imageName] =
          shape.imageProp?.shape === "field"
            ? cleanField({ value: img, hidden, customClass })
            : img;
        continue;
      }

      if (fieldProps.has(prop)) {
        props[prop] = cleanField({ value, hidden, customClass });
      } else {
        props[prop] = value;
      }
    }
  }

  // Ensure the image prop is populated even without an explicit field_map entry.
  if (props[imageName] === undefined && item.imageSrc) {
    props[imageName] =
      shape.imageProp?.shape === "field"
        ? { value: item.imageSrc }
        : item.imageSrc;
  }

  if (navUrl) {
    props[hrefName] = navUrl;
    if (props.slug === undefined && item.slug) props.slug = item.slug;
  }

  // Normalise the final image URL to MEDIA_BASE_URL (bound OR static/builder
  // value), so every component image loads from media.kannadaprabha.com —
  // sized via the CDN resize params (no-op when already sized).
  const img = props[imageName];
  if (img && typeof img === "object" && "value" in img) {
    const v = (img as FieldConfig).value;
    if (v) (img as FieldConfig).value = mediaThumb(v, 800, 70) ?? v;
  } else if (typeof img === "string" && img) {
    props[imageName] = mediaThumb(img, 800, 70) ?? img;
  }

  return props;
}

function cleanField(field: FieldConfig): FieldConfig {
  const out: FieldConfig = { value: field.value };
  if (field.hidden !== undefined) out.hidden = field.hidden;
  if (field.customClass) out.customClass = field.customClass;
  return out;
}

/** Which transformed-item field feeds each conventional prop name. */
const CONVENTION: Record<string, keyof TransformedItem> = {
  title: "title",
  heading: "category",
  category: "category",
  name: "category",
  description: "excerpt",
  summary: "excerpt",
  excerpt: "excerpt",
  timeAgo: "timeAgo",
  templatetype: "templatetype",
  isliveblog: "isliveblog",
};

/**
 * Fill a template's props from the bound item, in place. Handles the builder's
 * shapes: FieldConfig props ({value}), an `image` object ({imageSrc}), a bare
 * `imageSrc`, and `articleHref`. Only overwrites when the item has real data.
 */
function fillConventionalProps(
  props: Record<string, unknown>,
  item: TransformedItem,
): void {
  const hasItem = !!item && (item.title !== undefined || item._raw !== undefined);

  for (const [key, val] of Object.entries(props)) {
    if (key === "image" && val && typeof val === "object") {
      // Builder may ship `image: { imageSrc }`; mirror it to the standard
      // `imageSrc` FieldConfig the components now read.
      const o = val as Record<string, unknown>;
      const imgUrl = (hasItem && item.imageSrc) || (o.imageSrc as string);
      if (typeof imgUrl === "string" && imgUrl) {
        o.imageSrc = imgUrl;
        const cur = props.imageSrc;
        props.imageSrc =
          cur && typeof cur === "object"
            ? { ...(cur as object), value: imgUrl }
            : { value: imgUrl };
      }
    } else if (key === "imageSrc") {
      // Standard imageSrc is a FieldConfig — set its .value from the item.
      if (hasItem && item.imageSrc) {
        props.imageSrc =
          val && typeof val === "object"
            ? { ...(val as object), value: item.imageSrc }
            : { value: item.imageSrc };
      }
    } else if (val && typeof val === "object" && "value" in val) {
      if (hasItem) {
        const src = CONVENTION[key];
        const v = src ? item[src] : undefined;
        if (typeof v === "string" && v) (val as FieldConfig).value = v;
      }
    }
  }

  if (hasItem) {
    // Scalar standard fields.
    if (item.sectionUrl && !props.sectionUrl) props.sectionUrl = item.sectionUrl;
    if (item.slug && !props.slug) props.slug = item.slug;
    if ("articleHref" in props) {
      const href = item.navigateUrl || item.slug;
      if (href) {
        props.articleHref = href.startsWith("/")
          ? href
          : /^https?:\/\//i.test(href)
            ? new URL(href).pathname
            : `/${href}`;
      }
    }
  }
}

// ── Navigation ─────────────────────────────────────────────────────────────

/** Build a link href from a navigation config + item, normalised to a path. */
export function buildNavigationUrl(
  navigation: ComponentNavigation | undefined,
  item: TransformedItem,
): string | null {
  if (!navigation) return null;

  if (navigation.type === "dynamic") {
    const field = navigation.urlField ?? "navigateUrl";
    const raw =
      toStr(resolveFieldPath(item, field)) ||
      toStr(item.navigateUrl) ||
      toStr(item.slug);
    return raw ? normalizeUrl(raw) : null;
  }

  let url = navigation.urlTemplate ?? "";
  if (navigation.type === "template") {
    url = url.replace(/\{(\w+)\}/g, (_m, key) =>
      toStr(resolveFieldPath(item, key)),
    );
    if (navigation.params?.length) {
      const qs = navigation.params
        .map((p) => {
          const v = toStr(resolveFieldPath(item, p.fieldName));
          return v
            ? `${encodeURIComponent(p.paramName)}=${encodeURIComponent(v)}`
            : "";
        })
        .filter(Boolean)
        .join("&");
      if (qs) url += (url.includes("?") ? "&" : "?") + qs;
    }
  }
  return url ? normalizeUrl(url) : null;
}

function normalizeUrl(url: string): string {
  if (url.startsWith("/")) return url;
  if (/^https?:\/\//i.test(url)) {
    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  }
  return `/${url}`;
}

// ── Filtering ──────────────────────────────────────────────────────────────

/** Apply data_config filter conditions (AND/OR) to a list of items. */
export function filterItems(
  items: TransformedItem[],
  dataConfig?: DataConfig,
): TransformedItem[] {
  if (!dataConfig?.filter_enabled || !dataConfig.filter_conditions?.length) {
    return items;
  }
  const logic = dataConfig.filter_logic ?? "AND";
  return items.filter((item) => {
    const results = dataConfig.filter_conditions!.map((c) =>
      testCondition(item, c),
    );
    return logic === "AND" ? results.every(Boolean) : results.some(Boolean);
  });
}

function testCondition(item: TransformedItem, c: FilterCondition): boolean {
  const actual = toStr(resolveFieldPath(item, c.field)).toLowerCase();
  const expected = toStr(c.value).toLowerCase();
  switch (c.operator) {
    case "equals":
      return actual === expected;
    case "not_equals":
      return actual !== expected;
    case "contains":
      return actual.includes(expected);
    case "not_contains":
      return !actual.includes(expected);
    case "starts_with":
      return actual.startsWith(expected);
    case "ends_with":
      return actual.endsWith(expected);
    default:
      return true;
  }
}
