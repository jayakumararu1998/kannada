import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Hosts allowed to reach the dev server's /_next/* resources — including the
  // HMR websocket at /_next/webpack-hmr. `next dev` is served through the proxy
  // at kannadaprabha.mo.vc, so the upgrade arrives cross-origin; without this
  // list Next answers 403, the dev client retries 12x and then calls
  // window.location.reload() — the page appearing to refresh itself every ~2
  // minutes. No effect on `next build` / `next start`.
  allowedDevOrigins: ["kannadaprabha.mo.vc", "*.mo.vc"],
  reactStrictMode: false,
  compress: true,
  poweredByHeader: false,
  turbopack: {
    root: process.cwd(),
  },
  images: {
    // No Next.js image optimizer (no /_next/image RSC route). Images load
    // directly from their src — every image URL is normalised to MEDIA_BASE_URL
    // (media.kannadaprabha.com) via toMediaUrl(), so no remotePatterns needed.
    unoptimized: true,
  },
  env: {
    MEDIA_BASE_URL: process.env.MEDIA_BASE_URL || "https://media.kannadaprabha.com",
    QUINTYPE_API_BASE_URL:
      process.env.QUINTYPE_API_BASE_URL || "https://kannadaprabha.quintype.io",
    API_EXTERNAL_URL:
      process.env.API_EXTERNAL_URL || "https://www.kannadaprabha.com",
  },
  // Disable the client-side Router Cache for dynamic pages so a client
  // navigation always fetches fresh content after a builder sync (all our pages
  // are `force-dynamic`, so `dynamic: 0` is the value that matters). Paired with
  // hover-based prefetch — the default viewport prefetch is turned off in the
  // Link wrapper to avoid firing an _rsc request for every one of the 50+ links
  // on a news page. (`static` must be >= 30 in Next 16; left at its default.)
  experimental: {
    staleTimes: {
      dynamic: 0,
    },
  },
  // Proxy the public bookmark/auth API through this origin so the browser calls
  // it same-origin (no CORS — the upstream at api.kannada.mo.vc does not send
  // Access-Control-Allow-Origin). The client uses NEXT_PUBLIC_API_BASE_URL=
  // "/api/public"; Next forwards server-side to the upstream below.
  async rewrites() {
    const target =
      process.env.PUBLIC_API_PROXY_TARGET ||
      "https://api.kannada.mo.vc/api/public";
    return [
      { source: "/api/public/:path*", destination: `${target}/:path*` },
      // Quintype CMS API — on a stock Quintype site /api/v1 lives on the same
      // host; static-page widgets (t20worldcup etc.) fetch it same-origin.
      // Proxy it so those widgets work on any host (mo.vc, previews).
      {
        source: "/api/v1/:path*",
        destination: `${process.env.QUINTYPE_API_BASE_URL || "https://kannadaprabha.quintype.io"}/api/v1/:path*`,
      },
    ];
  },
  // Long-lived cache headers for public static assets. (Next already serves
  // /_next/static as immutable, so no rule is needed there.) Page-level HTML
  // cache headers (home/section/article) are set per page type in `src/proxy.ts`.
  async headers() {
    return [
      {
        // Bundled fonts never change for a given URL → cache forever.
        source: "/fonts/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Static image assets (thumbnails, icons) — 30-day edge cache.
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000, stale-while-revalidate=86400",
          },
          { key: "CDN-Cache-Control", value: "public, max-age=2592000" },
        ],
      },
    ];
  },
};

export default nextConfig;
