import type { Metadata } from "next";

import SiteChrome from "@/components/layout/SiteChrome";
import BookmarkTabs from "@/components/bookmarks/BookmarkTabs";

// Reads the in-memory builder store (via SiteChrome) — render on demand.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ನನ್ನ ಬುಕ್‌ಮಾರ್ಕ್‌ಗಳು",
  description: "ನೀವು ಉಳಿಸಿದ ಸುದ್ದಿ, ಗ್ಯಾಲರಿ ಮತ್ತು ವಿಡಿಯೋಗಳು.",
  // Personal saved-articles page — never index.
  robots: { index: false, follow: false },
};

export default function BookmarkPage() {
  return (
    <SiteChrome pageType="sectionPage">
      <div className="mx-auto w-full max-w-[1000px] px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-center text-20-balootamma2-700 font-bold uppercase text-183354 md:text-24-balootamma2-700">
          ನನ್ನ ಬುಕ್‌ಮಾರ್ಕ್‌ಗಳು
        </h1>
        <BookmarkTabs />
      </div>
    </SiteChrome>
  );
}
