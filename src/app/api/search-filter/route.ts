import { NextResponse } from "next/server";

import { SITE_URL } from "@/lib/constants";

/**
 * Filtered-search proxy (ported from dinamani's `/api/search-filter`).
 *
 * The browser cannot hit Quintype's `/api/v1/advanced-search` directly (only
 * `/api/public/*` is same-origin; the Quintype host sends no CORS headers), so
 * the client `SearchFilters` panel calls this route and we forward every query
 * param (`q`, `section-name`, `author`, `story-template`, `published-after/
 * before`, `limit`, `offset`) straight through.
 */
// Live filtered-search proxy: forward per-request, never cache the route (the
// fetch below is already `no-store`; this makes it explicit and consistent with
// every other API route).
export const dynamic = "force-dynamic";

const QUINTYPE_HOST = (process.env.QUINTYPE_API_BASE_URL || SITE_URL).replace(
  /\/+$/,
  "",
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const apiUrl = `${QUINTYPE_HOST}/api/v1/advanced-search?${searchParams.toString()}`;

    const response = await fetch(apiUrl, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `External API error: ${response.status}`, items: [], total: 0 },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Server error: ${message}`, items: [], total: 0 },
      { status: 500 },
    );
  }
}
