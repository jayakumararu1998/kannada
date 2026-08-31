import { serveStaticFile } from "@/lib/api/static-pages";

// /app-ads.txt — served as text/plain from the Quintype custom-urls API.
export const dynamic = "force-dynamic";

export function GET() {
  return serveStaticFile("/app-ads.txt");
}
