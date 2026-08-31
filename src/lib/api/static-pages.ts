import { NextResponse } from "next/server";

import { SITE_URL } from "@/lib/constants";

/**
 * Static / custom-URL pages (dinamani parity). Content is authored in Quintype
 * and served on-demand from the www host — NOT the builder. Two endpoints:
 *
 *   - `/api/v1/static-pages/{id}`        → `{ "static-page": { title, content, metadata } }`
 *   - `/api/v1/custom-urls/{enc(path)}`  → `{ page: { title, content, metadata, status-code }, status-code }`
 *
 * `custom-urls` is the universal one: it resolves ANY configured URL (about-us,
 * ads.txt, /.well-known/*, /androidappdownload, /t20worldcup, …) and its
 * `metadata.mime-type` says how to serve it (text/html | text/plain |
 * application/json) and whether to show the site header/footer.
 */

const WWW = SITE_URL.replace(/\/+$/, "");

export interface StaticPageMeta {
  header?: boolean;
  footer?: boolean;
  "mime-type"?: string;
  seo?: {
    "meta-title"?: string;
    "meta-description"?: string;
    "meta-keywords"?: string;
  } | null;
}

export interface CustomUrlPage {
  id?: number;
  title?: string;
  content?: string;
  metadata?: StaticPageMeta;
  type?: string;
  "status-code"?: number;
}

async function fetchJson<T>(url: string, revalidate: number): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate },
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Ensure a leading slash and no origin (custom-urls keys are site-relative paths). */
function normalizePath(path: string): string {
  const p = String(path ?? "").replace(/^https?:\/\/[^/]+/, "");
  return "/" + p.replace(/^\/+/, "");
}

/**
 * Resolve a URL path to its custom-URL page (about-us, ads.txt, /.well-known/*,
 * section landing pages, …). Returns null when the API has no 200 page for it.
 */
export async function getCustomUrlPage(
  path: string,
  revalidate = 300,
): Promise<CustomUrlPage | null> {
  const encoded = encodeURIComponent(normalizePath(path));
  const data = await fetchJson<{ page?: CustomUrlPage | null; "status-code"?: number }>(
    `${WWW}/api/v1/custom-urls/${encoded}`,
    revalidate,
  );
  const page = data?.page;
  if (!page || page["status-code"] !== 200) return null;
  return page;
}

/** Fetch a static page by its Quintype id/slug (about-us, terms-of-use, …). */
export async function getStaticPage(
  pageId: string,
  revalidate = 300,
): Promise<CustomUrlPage | null> {
  const data = await fetchJson<{ "static-page"?: CustomUrlPage }>(
    `${WWW}/api/v1/static-pages/${encodeURIComponent(pageId)}`,
    revalidate,
  );
  return data?.["static-page"] ?? null;
}

/**
 * Route-handler helper: fetch a custom-URL page and return it as a raw HTTP
 * response with the correct Content-Type (or 404). Used by the file-like routes
 * (ads.txt, app-ads.txt, /.well-known/*, izooto.html).
 */
export async function serveStaticFile(path: string): Promise<NextResponse> {
  const page = await getCustomUrlPage(path);
  if (!page) return new NextResponse("Not found", { status: 404 });
  return staticPageResponse(page);
}

/** A metadata flag is "on" ONLY when explicitly true (boolean true / "true" / 1).
 *  Anything else — false, null, missing ("no data") — is off. */
function flagOn(v: unknown): boolean {
  return v === true || v === "true" || v === 1;
}

/** Whether to show the app header for this static page (metadata.header). */
export function staticPageShowHeader(page: CustomUrlPage): boolean {
  return flagOn(page.metadata?.header);
}

/** Whether to show the app footer for this static page (metadata.footer). */
export function staticPageShowFooter(page: CustomUrlPage): boolean {
  return flagOn(page.metadata?.footer);
}

/** True when EITHER header or footer should show (i.e. wrap in the site chrome). */
export function staticPageWantsChrome(page: CustomUrlPage): boolean {
  return staticPageShowHeader(page) || staticPageShowFooter(page);
}

/**
 * Serve a custom-URL page as a raw HTTP response with the correct Content-Type —
 * for a Route Handler (ads.txt → text/plain, /.well-known/* → application/json,
 * file-like .html → a full text/html document). HTML content pages that belong
 * inside the app layout should render via the React page instead.
 */
export function staticPageResponse(page: CustomUrlPage): NextResponse {
  const mime = page.metadata?.["mime-type"] || "text/html";
  const content = page.content ?? "";
  const cache = "public, max-age=300, s-maxage=7200, stale-while-revalidate=14400";

  if (mime === "text/plain") {
    return new NextResponse(content, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": cache },
    });
  }
  if (mime === "application/json") {
    return new NextResponse(content, {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": cache },
    });
  }
  // text/html (or anything else) → a full document.
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${page.title ?? ""}</title>
</head>
<body>
${content}
</body>
</html>`;
  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": cache },
  });
}
