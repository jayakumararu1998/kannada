import { serveStaticFile } from "@/lib/api/static-pages";

// /izooto.html — a raw HTML file served from custom-urls (push-notification SDK).
export const dynamic = "force-dynamic";

export function GET() {
  return serveStaticFile("/izooto.html");
}
