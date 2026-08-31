"use client";

import { useState } from "react";

import BookmarkIcon from "@/components/ui/bookmarkicon";
import LoginPopup from "@/components/auth/LoginPopup";
import { usePublicAuthSafe } from "@/lib/auth/PublicAuthContext";
import { useBookmarksSafe } from "@/lib/bookmarks/BookmarkContext";
import type { BookmarkCategory } from "@/lib/api/public-client";

/**
 * Bookmark toggle for the article social-share row (dinamani parity). Signed-in
 * users toggle the bookmark via the shared backend (stored under its category —
 * video/news/gallery); signed-out users get the email+OTP login popup, then the
 * bookmark is applied. Icon fills when the article is bookmarked.
 */
export default function BookmarkButton({
  slug,
  category,
  title,
  thumbnailUrl,
  description,
  articleUrl,
}: {
  slug: string;
  category: BookmarkCategory;
  title?: string;
  thumbnailUrl?: string;
  description?: string;
  articleUrl?: string;
}) {
  const auth = usePublicAuthSafe();
  const bookmarks = useBookmarksSafe();
  const [loginOpen, setLoginOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const isAuthenticated = auth?.isAuthenticated ?? false;
  const isBookmarked = slug && bookmarks ? bookmarks.isBookmarked(slug) : false;

  const item = {
    slug,
    category,
    title,
    thumbnail_url: thumbnailUrl,
    description,
    article_url: articleUrl,
  };

  const toggle = async () => {
    if (!bookmarks || busy) return;
    setBusy(true);
    try {
      await bookmarks.toggleBookmark(item);
    } catch {
      /* optimistic update already reverted in the context */
    } finally {
      setBusy(false);
    }
  };

  const handleClick = () => {
    if (!slug) return;
    if (!isAuthenticated) {
      setLoginOpen(true);
      return;
    }
    void toggle();
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy || !slug}
        aria-pressed={isBookmarked}
        aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
        title={isBookmarked ? "Saved" : "Save"}
        className={`grid h-8 w-8 place-items-center rounded-full border transition-colors ${
          isBookmarked
            ? "border-[#2C39C6] bg-[#2C39C6] text-white"
            : "border-DFDFDF bg-FFFFFF text-1E1E1E hover:border-[#2C39C6] hover:text-[#2C39C6]"
        } ${busy ? "opacity-50" : ""}`}
      >
        <BookmarkIcon active={isBookmarked} className="h-[18px] w-[14px]" />
      </button>

      <LoginPopup
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={() => void toggle()}
      />
    </>
  );
}
