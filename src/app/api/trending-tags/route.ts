import { NextResponse } from "next/server";

import { SITE_URL } from "@/lib/constants";

/**
 * Trending tags proxy (ported from dinamani's `/api/trending-tags`).
 *
 * The browser cannot hit Quintype's `/api/v1/trending/tags` directly — only
 * `/api/public/*` is rewritten same-origin (see next.config), and the Quintype
 * host does not send CORS headers. So this route fetches server-side and hands
 * the tag list back to the client `TrendingTags` chips.
 *
 * Host: the Quintype API host (`QUINTYPE_API_BASE_URL`, e.g.
 * kannadaprabha.quintype.io) serves `/api/v1/*`; `api.kannadaprabha.com` does
 * not resolve, so we mirror `stories.ts` and fall back to the www origin.
 */
const QUINTYPE_HOST = (process.env.QUINTYPE_API_BASE_URL || SITE_URL).replace(
  /\/+$/,
  "",
);

// Reads request.url (query params), so the route must render per-request —
// without this, `next build` tries to prerender it statically, `request.url`
// throws DYNAMIC_SERVER_USAGE, and the catch below bakes a 500 into the build.
// Freshness comes from the fetch-level revalidate instead.
export const dynamic = "force-dynamic";

const REVALIDATE_SECONDS = 300; // 5 min — trending shifts slowly

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "day";
    const limit = searchParams.get("limit") || "8";

    const apiUrl = `${QUINTYPE_HOST}/api/v1/trending/tags?period=${encodeURIComponent(
      period,
    )}&limit=${encodeURIComponent(limit)}`;

    const response = await fetch(apiUrl, {
      next: { revalidate: REVALIDATE_SECONDS },
      headers: { accept: "application/json" },
    });

    if (!response.ok) {
      return NextResponse.json(
        { tags: [], error: true, status: response.status },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in trending-tags API:", error);
    return NextResponse.json(
      { tags: [], error: true, status: 500 },
      { status: 500 },
    );
  }
}
