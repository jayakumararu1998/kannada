import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names, resolving conflicts (last wins).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a date for display in Kannada locale.
 * Stub — extend with relative-time / custom formats as needed.
 */
export function formatDate(
  date: Date | string | number,
  locale = "kn-IN",
): string {
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}
