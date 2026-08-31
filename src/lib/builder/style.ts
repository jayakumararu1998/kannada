/**
 * Pure style helpers shared by the layout renderers. Builder styling values are
 * arbitrary strings (px, hex, etc.), so they're applied as inline CSS rather
 * than Tailwind classes (which can't be generated dynamically).
 */

import type { CSSProperties } from "react";

import type { BorderConfig } from "./types";

/** Hexes that exist as flip tokens in globals.css (`--color-XXXXXX`, redefined
 *  under `.dark`). A CMS color matching one of these renders as the var so it
 *  follows the theme. */
const FLIP_TOKEN_HEXES = new Set([
  "000000", "009EF9", "111111", "1E1E1E", "276AAA", "3046EB", "333333",
  "3742B8", "4A4A4A", "4F4F4F", "6D6D6D", "6F6F6F", "757575", "808080",
  "8B95A5", "D1D1D1", "D2D2D2", "DFDFDF", "E8E8E8", "F3F4F6", "F4F1F6",
  "F7F1DE", "F9F9F9", "FCF8F8", "FFF6DE", "FBEFEF", "F2F7FF", "FACC15",
  "FFFFFF", "0D156C", "183354",
]);

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h, s, l };
}

function hslToHex(h: number, s: number, l: number): string {
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const c = l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Make a builder/CMS color theme-aware. Inline hexes from the builder JSON
 * don't respond to `.dark`, which leaves light panels behind dark-flipped text
 * (unreadable). Known token hexes become their `var(--color-…)` so they flip
 * exactly like hand-written classes; unknown hexes get a generated dark
 * counterpart via `light-dark()` mirroring the token design — light surfaces
 * darken keeping their hue, dark text lightens, mid-tone accents pass through.
 * Non-hex values (rgb(), gradients, keywords) are returned untouched.
 */
export function themeColor(value?: string): string | undefined {
  if (!value) return undefined;
  const v = value.trim();
  const m = v.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!m) return v;
  let hex = m[1];
  if (hex.length === 3) hex = hex.replace(/./g, (c) => c + c);
  const key = hex.toUpperCase();
  if (FLIP_TOKEN_HEXES.has(key)) return `var(--color-${key})`;
  const { h, s, l } = hexToHsl(key);
  if (l >= 0.6) return `light-dark(${v}, ${hslToHex(h, Math.min(s, 0.45), 0.13)})`;
  if (l <= 0.4) return `light-dark(${v}, ${hslToHex(h, Math.min(s, 0.6), 0.88)})`;
  return v;
}

/**
 * Resolve a column background. Only changes in dark mode when the builder
 * supplies an explicit dark color (the "Dark Mode Background Color" field) —
 * then it emits `light-dark(light, dark)` for the editor's exact dark tone
 * (e.g. #2A271F). With only a light color, the background is returned as-is and
 * stays the same in both modes (NO auto-flip).
 */
export function themeBackground(
  light?: string,
  dark?: string,
): string | undefined {
  if (!light) return undefined;
  const l = light.trim();
  const d = dark?.trim();
  if (d) return `light-dark(${l}, ${d})`;
  return l;
}

/** Convert a BorderConfig into inline CSS (respects per-side toggles). */
export function borderStyle(border?: BorderConfig): CSSProperties {
  if (!border?.enabled) return {};
  const line = `${border.width ?? "1px"} ${border.style ?? "solid"} ${
    themeColor(border.color) ?? "var(--color-D2D2D2)"
  }`;
  const s = border.sides;
  const style: CSSProperties = {};
  if (!s) {
    style.border = line;
  } else {
    if (s.top) style.borderTop = line;
    if (s.right) style.borderRight = line;
    if (s.bottom) style.borderBottom = line;
    if (s.left) style.borderLeft = line;
  }
  if (border.radius) style.borderRadius = border.radius;
  return style;
}

/** Heading font-weight keyword → CSS weight. */
export function fontWeight(
  weight?: "normal" | "medium" | "semibold" | "bold",
): number | undefined {
  switch (weight) {
    case "medium":
      return 500;
    case "semibold":
      return 600;
    case "bold":
      return 700;
    case "normal":
      return 400;
    default:
      return undefined;
  }
}

const TEXT_ALIGN: Record<string, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export function alignClass(align?: string): string {
  return TEXT_ALIGN[align ?? "left"] ?? "text-left";
}
