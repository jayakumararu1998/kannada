import { serveStaticFile } from "@/lib/api/static-pages";

// /.well-known/* (apple-app-site-association, assetlinks.json, …) — served with
// their configured mime-type (usually application/json) from custom-urls.
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  return serveStaticFile(`/.well-known/${file}`);
}
