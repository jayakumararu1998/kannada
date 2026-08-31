/**
 * Env-driven constants. All values fall back to Kannada Prabha placeholders
 * so the skeleton runs without a populated `.env.local`.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.kannadaprabha.com";

export const API_BASE_URL =
  process.env.QUINTYPE_API_BASE_URL || "https://api.kannadaprabha.com";

export const MEDIA_BASE_URL =
  process.env.MEDIA_BASE_URL || "https://media.kannadaprabha.com";

export const API_EXTERNAL_URL =
  process.env.API_EXTERNAL_URL || "https://www.kannadaprabha.com";
