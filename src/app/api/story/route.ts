import { NextResponse } from "next/server";

import { getStoryBySlug } from "@/lib/api/stories";

export const dynamic = "force-dynamic";

/**
 * Story refresh endpoint — used by the live-blog client poller to fetch the
 * latest story (fresh, no cache) and merge in new/updated cards. Returns
 * `{ story }` or 404. Kept server-side so the browser never talks to the
 * Quintype www host directly (avoids CORS + keeps the host detail internal).
 */
export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug") || "";
  if (!slug) return NextResponse.json({ story: null }, { status: 400 });
  const story = await getStoryBySlug(slug);
  if (!story) return NextResponse.json({ story: null }, { status: 404 });
  return NextResponse.json(
    { story },
    { headers: { "Cache-Control": "no-store" } },
  );
}
