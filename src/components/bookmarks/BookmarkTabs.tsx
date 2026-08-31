"use client";

import { useCallback, useEffect, useState } from "react";

import Link from "@/components/ui/PrefetchLink";
import LoginPopup from "@/components/auth/LoginPopup";
import { usePublicAuthSafe } from "@/lib/auth/PublicAuthContext";
import {
  bookmarksApi,
  BOOKMARK_CATEGORIES,
  type Bookmark,
  type BookmarkCategory,
} from "@/lib/api/public-client";
import { DEFAULT_THUMBNAIL_IMAGE } from "@/lib/images";
import { humanTime } from "@/lib/time";

interface Tab {
  id: string;
  label: string;
  category: BookmarkCategory;
}

// Category keys are shared with the bookmark backend (see bookmarkCategoryForStory);
// only the labels are Kannada.
const TABS: Tab[] = [
  { id: "news", label: "ಸುದ್ದಿ", category: BOOKMARK_CATEGORIES.NEWS },
  { id: "photos", label: "ಗ್ಯಾಲರಿ", category: BOOKMARK_CATEGORIES.PHOTOS },
  { id: "videos", label: "ವಿಡಿಯೋ", category: BOOKMARK_CATEGORIES.VIDEOS },
];

function BookmarkGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
      />
    </svg>
  );
}

/**
 * "My bookmarks" tabs (dinamani /bookmark port) — the saved stories the
 * signed-in user bookmarked from article pages, bucketed news / gallery /
 * video by the shared backend. Signed-out visitors get a login prompt.
 */
export default function BookmarkTabs() {
  const auth = usePublicAuthSafe();
  const isAuthenticated = auth?.isAuthenticated ?? false;

  const [activeTab, setActiveTab] = useState<string>("news");
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [counts, setCounts] = useState<{ category: string; count: number }[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const activeTabData = TABS.find((t) => t.id === activeTab);

  const loadCounts = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { categories } = await bookmarksApi.getCategories();
      setCounts(categories);
    } catch {
      // Counts are decorative — ignore failures.
    }
  }, [isAuthenticated]);

  const loadBookmarks = useCallback(async () => {
    if (!isAuthenticated || !activeTabData) return;
    setLoading(true);
    try {
      const { bookmarks: data } = await bookmarksApi.getBookmarks({
        category: activeTabData.category,
        limit: 50,
      });
      setBookmarks(data);
    } catch {
      setBookmarks([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, activeTabData]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  const removeBookmark = async (slug: string) => {
    try {
      await bookmarksApi.removeBookmark(slug);
      setBookmarks((prev) => prev.filter((b) => b.slug !== slug));
      loadCounts();
    } catch {
      // Leave the item in place if the delete failed.
    }
  };

  const countFor = (category: string): number =>
    counts.find((c) => c.category === category)?.count ?? 0;

  if (!auth || !isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg bg-F9F9F9 px-4 py-16">
        <div className="mb-4 h-14 w-14 text-D2D2D2">
          <BookmarkGlyph />
        </div>
        <p className="text-center text-16-balootamma2-600 text-333333">
          ಬುಕ್‌ಮಾರ್ಕ್‌ಗಳನ್ನು ನೋಡಲು ಲಾಗಿನ್ ಮಾಡಿ
        </p>
        <p className="mt-1 text-center text-14-inter-400 text-808080">
          ನೀವು ಉಳಿಸಿದ ಸುದ್ದಿಗಳನ್ನು ನೋಡಲು ಲಾಗಿನ್ ಆಗಿ.
        </p>
        <button
          type="button"
          onClick={() => setLoginOpen(true)}
          className="mt-5 rounded-[6px] bg-3046EB px-6 py-2.5 font-balootamma2 text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
        >
          ಲಾಗಿನ್
        </button>
        <LoginPopup open={loginOpen} onClose={() => setLoginOpen(false)} />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="flex border-b border-DFDFDF">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex-1 px-4 py-3 text-center text-15-balootamma2-600 transition-colors ${
              activeTab === tab.id
                ? "text-009EF9"
                : "text-333333 hover:text-009EF9"
            }`}
          >
            <span>{tab.label}</span>
            {countFor(tab.category) > 0 && (
              <span className="ml-1 text-13-inter-500 text-808080">
                ({countFor(tab.category)})
              </span>
            )}
            {activeTab === tab.id && (
              <span className="absolute inset-x-0 bottom-0 h-[3px] bg-009EF9" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[320px] pt-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-009EF9" />
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg bg-F9F9F9 px-4 py-16">
            <div className="mb-4 h-14 w-14 text-D2D2D2">
              <BookmarkGlyph />
            </div>
            <p className="text-center text-16-balootamma2-600 text-333333">
              ನೀವು ಇನ್ನೂ ಯಾವುದನ್ನೂ ಬುಕ್‌ಮಾರ್ಕ್ ಮಾಡಿಲ್ಲ
            </p>
            <p className="mt-1 text-center text-14-inter-400 text-808080">
              ಲೇಖನದ ಬುಕ್‌ಮಾರ್ಕ್ ಐಕಾನ್ ಒತ್ತಿ ಉಳಿಸಿ.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
            {bookmarks.map((bookmark) => (
              <div key={bookmark.id} className="group relative">
                <Link
                  href={`/${(bookmark.slug || "").replace(/^\/+/, "")}`}
                  className="flex min-w-0 gap-3 no-underline"
                >
                  <div className="aspect-[4/3] w-[110px] shrink-0 overflow-hidden sm:w-[130px]">
                    <img
                      src={bookmark.thumbnail_url || DEFAULT_THUMBNAIL_IMAGE}
                      alt={bookmark.title || ""}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <h3 className="line-clamp-3 break-words text-15-balootamma2-600 leading-[1.4] text-111111 group-hover:text-009EF9">
                      {bookmark.title || bookmark.slug}
                    </h3>
                    <span className="text-13-inter-500 text-808080">
                      {humanTime(bookmark.created_at)}
                    </span>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => removeBookmark(bookmark.slug)}
                  aria-label="Remove bookmark"
                  className="absolute right-0 top-0 rounded-full bg-FFFFFF p-1.5 text-808080 opacity-0 shadow transition-opacity hover:text-[#EF4444] focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
