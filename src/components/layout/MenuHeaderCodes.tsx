"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  getActiveMenuHeaderBanners,
  type ActiveMenuHeaderBanner,
} from "@/lib/builder/menu-header-codes";
import type {
  MenuHeaderCodeConfig,
  MenuHeaderPosition,
} from "@/lib/builder/types";

/**
 * CMS-driven Menu Header Code banners (image or HTML), rendered either ABOVE the
 * header (`above_header`) or BELOW the breaking-news bar (`below_breaking_news`).
 * dinamani parity. Client component so it re-resolves on SPA navigation
 * (`usePathname`) and swaps the desktop/mobile slot at the lg breakpoint. The
 * active codes are embedded by SiteChrome (server) so first paint is correct.
 */

/** Re-execute <script> tags inside an HTML slot (innerHTML never runs them). */
function HtmlSlot({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    for (const old of Array.from(container.querySelectorAll("script"))) {
      const s = document.createElement("script");
      for (const attr of Array.from(old.attributes)) s.setAttribute(attr.name, attr.value);
      if (old.textContent) s.textContent = old.textContent;
      old.parentNode?.replaceChild(s, old);
    }
  }, [html]);
  return <div ref={ref} dangerouslySetInnerHTML={{ __html: html }} />;
}

function Banner({ banner }: { banner: ActiveMenuHeaderBanner }) {
  const { slot } = banner;
  const isImage = slot.imageUrl && slot.type !== "html";

  if (isImage) {
    const img = (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={slot.imageUrl}
        alt={slot.imageAlt || ""}
        style={{ width: "100%", height: "auto", display: "block" }}
        loading="lazy"
      />
    );
    return (
      <div className="mx-auto w-full">
        {slot.imageLink ? (
          <a href={slot.imageLink} target="_blank" rel="noopener noreferrer">
            {img}
          </a>
        ) : (
          img
        )}
      </div>
    );
  }

  if (slot.html) {
    return (
      <div className="mx-auto w-full">
        <HtmlSlot html={slot.html} />
      </div>
    );
  }
  return null;
}

export default function MenuHeaderCodes({
  codes,
  position,
}: {
  codes: Record<string, MenuHeaderCodeConfig>;
  position: MenuHeaderPosition;
}) {
  const pathname = usePathname() || "/";
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const banners = useMemo(
    () => getActiveMenuHeaderBanners(codes, pathname, isMobile, position),
    [codes, pathname, isMobile, position],
  );

  if (banners.length === 0) return null;
  return (
    <div className="w-full" data-menu-header-position={position}>
      {banners.map((banner) => (
        <Banner key={banner.slug} banner={banner} />
      ))}
    </div>
  );
}
