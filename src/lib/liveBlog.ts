export function isLiveBlogValue(value?: string | boolean): boolean {
  if (typeof value === "boolean") return value;
  if (!value) return false;

  const compact = value.trim().toLowerCase().replace(/[\s_-]+/g, "");
  return (
    compact === "true" ||
    compact === "1" ||
    compact === "yes" ||
    compact === "liveblog" ||
    compact === "articleliveblogtemplate"
  );
}
