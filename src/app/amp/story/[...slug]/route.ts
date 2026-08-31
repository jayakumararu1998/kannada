import { AMP_BASE, serveAmpStory } from "@/lib/amp/serve-amp-story";

export const dynamic = "force-dynamic";

/**
 * AMP article page — `/amp/story/<slug>`. The AMP alternate of an HTML article
 * (canonical points back to the HTML URL); web/visual stories render as a
 * full-screen amp-story. Shared logic lives in `serveAmpStory`.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params;
  const slugPath = (slug ?? []).join("/");
  const base = AMP_BASE();
  return serveAmpStory(
    slugPath,
    `${base}/amp/story/${slugPath}`,
    `${base}/${slugPath}`,
  );
}
