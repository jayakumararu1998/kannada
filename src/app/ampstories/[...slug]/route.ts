import { AMP_BASE, serveAmpStory } from "@/lib/amp/serve-amp-story";

export const dynamic = "force-dynamic";

/**
 * Public Web Story URL — `/ampstories/<story-slug>` (e.g.
 * `/ampstories/web-stories/2026/Aug/02/…`), matching dinamani's ampstories
 * path. Renders the full-screen `<amp-story>` (Google Web Stories) for the
 * story. Unlike `/amp/story` (an AMP *alternate* whose canonical is the HTML
 * page), THIS url is the story's canonical public page — so canonical === ampUrl.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params;
  const slugPath = (slug ?? []).join("/");
  const url = `${AMP_BASE()}/ampstories/${slugPath}`;
  return serveAmpStory(slugPath, url, url);
}
