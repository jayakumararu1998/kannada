"use client";

import { ThemeProvider } from "next-themes";

import { PublicAuthProvider } from "@/lib/auth/PublicAuthContext";
import { BookmarkProvider } from "@/lib/bookmarks/BookmarkContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      enableColorScheme
      disableTransitionOnChange
      storageKey="kannadaprabha-theme"
    >
      {/* Public email+OTP auth + per-user bookmarks (shared backend). Both are
          inert until a token exists / the user signs in, so they add no network
          cost to anonymous page loads. */}
      <PublicAuthProvider>
        <BookmarkProvider>{children}</BookmarkProvider>
      </PublicAuthProvider>
    </ThemeProvider>
  );
}
