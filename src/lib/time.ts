/**
 * Human-readable time. Use this wherever a `timeAgo` value is rendered so a raw
 * timestamp / ISO date is never shown to a reader.
 *
 * Accepts an epoch (ms or seconds), an ISO/parseable date string, or an
 * already-human phrase (e.g. "2 hours ago", "just now", Kannada "… ಹಿಂದೆ") which
 * is passed through unchanged. Recent times render relative ("5 minutes ago",
 * "2 hours ago", "3 days ago"); anything older than a week renders as an
 * absolute, readable date-time ("12 Aug 2026, 8:09 PM").
 */
export function humanTime(input?: string | number | null): string {
  if (input == null) return "";

  if (typeof input === "string") {
    const s = input.trim();
    if (!s) return "";
    // Already a human phrase (relative words / Kannada "ago") → leave as-is.
    if (/\bago\b|just now|ಹಿಂದೆ|ಈಗ/i.test(s)) return s;
    // Pure numeric string → epoch.
    if (/^\d{10,}$/.test(s)) return fromEpoch(Number(s));
    const parsed = Date.parse(s);
    if (!Number.isNaN(parsed)) return fromEpoch(parsed);
    // Unparseable, non-numeric → assume it's already display text.
    return s;
  }

  if (Number.isFinite(input)) return fromEpoch(input);
  return "";
}

function fromEpoch(n: number): string {
  // Treat < 1e12 as seconds (Quintype uses ms; be defensive either way).
  const ms = n < 1e12 ? n * 1000 : n;
  const diff = Date.now() - ms;
  if (Number.isNaN(diff)) return "";
  if (diff < 0) return "just now"; // clock skew / future timestamp

  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;

  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;

  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} day${day === 1 ? "" : "s"} ago`;

  return absoluteDateTime(ms);
}

/** "12 Aug 2026, 8:09 PM" — readable absolute date-time. */
export function absoluteDateTime(ms: number): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(ms));
}
