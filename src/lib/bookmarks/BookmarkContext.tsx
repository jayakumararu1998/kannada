"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

import publicApiClient, {
  bookmarksApi,
  type BookmarkInput,
} from "../api/public-client";
import { usePublicAuth } from "../auth/PublicAuthContext";

interface BookmarkContextType {
  /** O(1) check whether a slug is bookmarked. */
  isBookmarked: (slug: string) => boolean;
  /** Toggle a bookmark (optimistic). Returns the new bookmarked state. */
  toggleBookmark: (item: BookmarkInput) => Promise<boolean>;
  isLoading: boolean;
  refreshBookmarks: () => Promise<void>;
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(
  undefined,
);

export function BookmarkProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = usePublicAuth();
  const [bookmarkedSlugs, setBookmarkedSlugs] = useState<Set<string>>(
    new Set(),
  );
  const [isLoading, setIsLoading] = useState(false);

  const fetchBookmarks = useCallback(async () => {
    if (!isAuthenticated) {
      setBookmarkedSlugs(new Set());
      return;
    }
    setIsLoading(true);
    try {
      const res = await bookmarksApi.getBookmarks();
      setBookmarkedSlugs(new Set(res.bookmarks.map((b) => b.slug)));
    } catch {
      setBookmarkedSlugs(new Set());
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Load the user's bookmarks once they're authenticated.
  useEffect(() => {
    void fetchBookmarks();
  }, [fetchBookmarks]);

  const isBookmarked = useCallback(
    (slug: string) => bookmarkedSlugs.has(slug),
    [bookmarkedSlugs],
  );

  const toggleBookmark = useCallback(
    async (item: BookmarkInput): Promise<boolean> => {
      // Gate on the token, not the React `isAuthenticated` flag: right after
      // login `verifyOTP` stores the token synchronously but the auth state
      // hasn't re-rendered yet, so the auto-apply-after-login toggle would
      // otherwise no-op on this stale closure.
      if (!isAuthenticated && !publicApiClient.hasToken()) return false;
      const wasBookmarked = bookmarkedSlugs.has(item.slug);

      // Optimistic flip.
      setBookmarkedSlugs((prev) => {
        const next = new Set(prev);
        if (wasBookmarked) next.delete(item.slug);
        else next.add(item.slug);
        return next;
      });

      try {
        const res = await bookmarksApi.toggleBookmark(item);
        setBookmarkedSlugs((prev) => {
          const next = new Set(prev);
          if (res.bookmarked) next.add(item.slug);
          else next.delete(item.slug);
          return next;
        });
        return res.bookmarked;
      } catch (err) {
        // Revert on failure.
        setBookmarkedSlugs((prev) => {
          const next = new Set(prev);
          if (wasBookmarked) next.add(item.slug);
          else next.delete(item.slug);
          return next;
        });
        throw err;
      }
    },
    [isAuthenticated, bookmarkedSlugs],
  );

  return (
    <BookmarkContext.Provider
      value={{
        isBookmarked,
        toggleBookmark,
        isLoading,
        refreshBookmarks: fetchBookmarks,
      }}
    >
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmarks() {
  const ctx = useContext(BookmarkContext);
  if (!ctx)
    throw new Error("useBookmarks must be used within a BookmarkProvider");
  return ctx;
}

/** Non-throwing variant for components that may render outside the provider. */
export function useBookmarksSafe() {
  return useContext(BookmarkContext);
}
