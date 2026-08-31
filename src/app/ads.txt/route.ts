import { serveStaticFile } from "@/lib/api/static-pages";

// /ads.txt — served as text/plain from the Quintype custom-urls API.
export const dynamic = "force-dynamic";

export function GET() {
  return serveStaticFile("/ads.txt");
}
