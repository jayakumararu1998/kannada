/**
 * Shared prop contract for all news card components (vertical / horizontal /
 * others). The builder + page renderer feed every card the same standard set,
 * so a component only reads the fields it needs.
 */

export type FieldConfig = {
  hidden?: boolean;
  value?: string;
  customClass?: string;
};

/** Standard news-item props every card accepts. */
export type StandardNewsProps = {
  /** Container-level field: its `customClass` is applied to the card's root
   *  element so a class/color can be set dynamically from the builder. */
  componentdiv?: FieldConfig;
  category?: FieldConfig;
  sectionUrl?: string;
  title?: FieldConfig;
  excerpt?: FieldConfig;
  timeAgo?: FieldConfig;
  imageSrc?: FieldConfig;
  slug?: string;
  templatetype?: FieldConfig;
  isliveblog?: FieldConfig;
  /** Common presentation props. */
  priority?: boolean;
  className?: string;
  articleHref?: string;
};

/** Safe string read from a FieldConfig. */
export function fieldValue(field?: FieldConfig): string {
  return typeof field?.value === "string" ? field.value.trim() : "";
}
