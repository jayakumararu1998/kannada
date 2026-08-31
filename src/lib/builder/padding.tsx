import type { ReactNode } from "react";

import type { ResponsivePadding } from "./types";

/**
 * Responsive (mobile / tablet / desktop) padding for builder nodes.
 *
 * The builder emits `padding` as a plain string OR a per-breakpoint object
 * `{ mobile?, tablet?, desktop? }` (e.g. `{ tablet: "15px", desktop: "15px" }`).
 * A plain inline `style.padding = obj` silently breaks for the object form, and
 * Tailwind can't emit a dynamic arbitrary padding class at build time — so we
 * render a scoped `<style>` with real media queries (mobile = base, tablet =
 * `min-width:768px`, desktop = `min-width:1024px`), matching the builder's
 * per-breakpoint controls (each breakpoint applies only what's configured).
 */

/** Normalise a CSS length: bare numbers → px, blank → undefined, else passthrough. */
function cssLen(v?: string): string | undefined {
  if (v == null || `${v}`.trim() === "") return undefined;
  return /^\d+(\.\d+)?$/.test(`${v}`) ? `${v}px` : `${v}`;
}

/** True when the padding value has any usable breakpoint set. */
export function hasPadding(p?: string | ResponsivePadding): boolean {
  if (!p) return false;
  if (typeof p === "string") return !!cssLen(p);
  return !!(cssLen(p.mobile) || cssLen(p.tablet) || cssLen(p.desktop));
}

/** Stable class name for a node's padding rules. */
export function paddingClass(id: string): string {
  return `kp-pad-${id}`;
}

/** Build the CSS rule string for a padding value under `.cls`, or "". */
function paddingCss(cls: string, p: string | ResponsivePadding): string {
  const rules: string[] = [];
  if (typeof p === "string") {
    const v = cssLen(p);
    if (v) rules.push(`.${cls}{padding:${v};}`);
    return rules.join("");
  }
  const m = cssLen(p.mobile);
  const t = cssLen(p.tablet);
  const d = cssLen(p.desktop);
  if (m) rules.push(`.${cls}{padding:${m};}`);
  if (t) rules.push(`@media(min-width:768px){.${cls}{padding:${t};}}`);
  if (d) rules.push(`@media(min-width:1024px){.${cls}{padding:${d};}}`);
  return rules.join("");
}

/** Build responsive CSS rules for one property (padding/margin) under `.cls`. */
function spacingCss(
  cls: string,
  prop: "padding" | "margin",
  p: string | ResponsivePadding,
): string {
  const rules: string[] = [];
  if (typeof p === "string") {
    const v = cssLen(p);
    if (v) rules.push(`.${cls}{${prop}:${v};}`);
    return rules.join("");
  }
  const m = cssLen(p.mobile);
  const t = cssLen(p.tablet);
  const d = cssLen(p.desktop);
  if (m) rules.push(`.${cls}{${prop}:${m};}`);
  if (t) rules.push(`@media(min-width:768px){.${cls}{${prop}:${t};}}`);
  if (d) rules.push(`@media(min-width:1024px){.${cls}{${prop}:${d};}}`);
  return rules.join("");
}

/**
 * Scoped `<style>` for a node's responsive padding AND/OR margin, plus the class
 * to put on its root. Use for nodes (e.g. a column heading) that carry both
 * builder-configured padding and margin. Returns `{ className, style }`; either
 * may be empty when nothing is configured.
 */
export function spacingStyle(
  id: string,
  padding?: string | ResponsivePadding,
  margin?: string | ResponsivePadding,
): { className: string; style: ReactNode } {
  const cls = `kp-sp-${id}`;
  const css =
    (hasPadding(padding) ? spacingCss(cls, "padding", padding!) : "") +
    (hasPadding(margin) ? spacingCss(cls, "margin", margin!) : "");
  if (!css) return { className: "", style: null };
  return { className: cls, style: <style>{css}</style> };
}

/**
 * Scoped `<style>` for a node's responsive padding — render it INSIDE the node
 * whose root carries `paddingClass(id)`. Renders nothing when there's no
 * padding. Use for rows/columns that already have a styled root element.
 */
export function PaddingStyle({
  id,
  padding,
}: {
  id: string;
  padding?: string | ResponsivePadding;
}) {
  if (!hasPadding(padding)) return null;
  return <style>{paddingCss(paddingClass(id), padding!)}</style>;
}

/**
 * Wrap `children` in a div that carries responsive padding — use at a component
 * call-site where the child manages its own root (an extra wrapper is fine, it
 * becomes the flex/grid child). Returns children unwrapped when there's no
 * padding (no needless DOM).
 */
export function PaddingBox({
  id,
  padding,
  className,
  children,
}: {
  id: string;
  padding?: string | ResponsivePadding;
  className?: string;
  children: ReactNode;
}) {
  if (!hasPadding(padding)) {
    return className ? <div className={className}>{children}</div> : <>{children}</>;
  }
  const cls = paddingClass(id);
  return (
    <div className={className ? `${cls} ${className}` : cls}>
      <style>{paddingCss(cls, padding!)}</style>
      {children}
    </div>
  );
}
