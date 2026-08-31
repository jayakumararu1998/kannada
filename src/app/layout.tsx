import type { Metadata } from "next";
import {
  Baloo_Tamma_2,
  Inter,
  Manrope,
  Noto_Sans_Kannada,
  Roboto,
} from "next/font/google";
import { siteConfig } from "@/config/site";
import CommonSchema from "@/components/seo/CommonSchema";
import CustomSchemaScripts from "@/components/seo/CustomSchemaScripts";
import Ga4Script from "@/components/seo/Ga4Script";
import IZootoInit from "@/components/IZootoInit";

import { Providers } from "./providers";
import "./globals.css";

const notoSansKannada = Noto_Sans_Kannada({
  variable: "--font-kannada",
  subsets: ["kannada"],
  weight: ["400", "600", "700"],
  display: "optional",
  preload: true,
  adjustFontFallback: true,
  fallback: ["system-ui", "Arial", "sans-serif"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "optional",
  preload: false,
  adjustFontFallback: true,
  fallback: ["system-ui", "Arial", "sans-serif"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "optional",
  preload: false,
  adjustFontFallback: true,
  fallback: ["system-ui", "Arial", "sans-serif"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "optional",
  preload: false,
  adjustFontFallback: true,
  fallback: ["system-ui", "Arial", "sans-serif"],
});

const balooTamma2 = Baloo_Tamma_2({
  variable: "--font-baloo-tamma-2",
  subsets: ["kannada"],
  weight: ["400", "500", "600", "700"],
  display: "optional",
  // Keep the preload. Dropping it does NOT just move 75 KB off the critical
  // path — with `display: "optional"` the face is discovered only when text
  // using it is first laid out, and its block period starts there, so first
  // paint waited on it instead. Measured: home observed FCP 0.30 s -> 1.31 s.
  preload: true,
  adjustFontFallback: true,
  fallback: ["system-ui", "Arial", "sans-serif"],
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Chrome (Header/Footer) lives in <SiteChrome>, opted into per page, so that
  // `hide_layout` pages can render bare and the static home stays cacheable.
  return (
    <html lang="kn" suppressHydrationWarning>
      <head>
        {/* Every article thumbnail, hero and the logo come from the media CDN,
            so open that connection before the parser reaches the first <img>:
            it saves the DNS + TCP + TLS round trips from the LCP image's own
            request. `dns-prefetch` is the fallback for browsers that cap
            preconnects. */}
        <link rel="preconnect" href="https://media.kannadaprabha.com" />
        <link rel="dns-prefetch" href="https://media.kannadaprabha.com" />
        {/* Google Publisher Tag (GPT) CDN — in-article ad slots
            (contentType:"ad") define/display their GPT slots against this. The
            cmd stub lets ad codes queue on `googletag.cmd` before gpt.js loads. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "window.googletag = window.googletag || { cmd: [] };" +
              // Collapse ad slots that don't fill, so an empty/undelivered ad
              // never leaves reserved white space on the page.
              "window.googletag.cmd.push(function(){try{window.googletag.pubads().collapseEmptyDivs();}catch(e){}});",
          }}
        />
        <script
          async
          src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"
          crossOrigin="anonymous"
        />
        {/* GA4 (builder-synced kp_ga4_script website-setting). */}
        <Ga4Script />
      </head>
      <body
        suppressHydrationWarning
        className={`${notoSansKannada.variable} ${roboto.variable} ${manrope.variable} ${inter.variable} ${balooTamma2.variable} font-kannada antialiased min-h-screen overflow-x-clip`}
      >
        {/* Site-wide structured data + builder-authored custom JSON-LD. */}
        <CommonSchema />
        <CustomSchemaScripts />
        {/* iZooto push notifications — deferred (10s or first interaction),
            Lighthouse-gated client-side so this layout stays static. */}
        <IZootoInit />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
