"use client";

import { useEffect, useRef, useState } from "react";

import Link from "@/components/ui/PrefetchLink";
import LoginPopup from "@/components/auth/LoginPopup";
import { usePublicAuthSafe } from "@/lib/auth/PublicAuthContext";

function UserIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      <path
        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20c1.2-3.5 3.6-5.3 7-5.3s5.8 1.8 7 5.3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Header account control (client). Replaces the old account <Link> that
 * navigated to a page. Behaviour:
 *   - Signed out → clicking opens the email+OTP LoginPopup (same shared auth
 *     backend as the article bookmark flow).
 *   - Signed in  → clicking opens a small dropdown popup anchored to the button
 *     showing the account and a Logout action; no navigation to an account page.
 * Falls back to the plain label when rendered outside the auth provider.
 */
export default function AccountButton({
  label,
  showIcon = true,
}: {
  label: string;
  showIcon?: boolean;
}) {
  const auth = usePublicAuthSafe();
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const user = auth?.user ?? null;

  const [loginOpen, setLoginOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close the dropdown on outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // If the user signs out elsewhere, make sure the dropdown isn't left open.
  useEffect(() => {
    if (!isAuthenticated) setMenuOpen(false);
  }, [isAuthenticated]);

  const handleClick = () => {
    if (isAuthenticated) setMenuOpen((v) => !v);
    else setLoginOpen(true);
  };

  const handleLogout = async () => {
    if (!auth || busy) return;
    setBusy(true);
    try {
      await auth.logout();
    } finally {
      setBusy(false);
      setMenuOpen(false);
    }
  };

  // The signed-in label shows the user's name if set, else the configured
  // label — never the email address.
  const signedInLabel = user?.name || label;

  return (
    <div ref={wrapRef} className="relative inline-flex">
      {/* Phones: plain centered icon (no border), matching the other header
          icons. sm+: outlined pill — the Subscribe CTA's shape, bordered
          instead of filled. */}
      <button
        type="button"
        onClick={handleClick}
        aria-label={isAuthenticated ? String(signedInLabel) : label}
        aria-haspopup={isAuthenticated ? "menu" : "dialog"}
        aria-expanded={isAuthenticated ? menuOpen : loginOpen}
        className="flex h-8 w-8 shrink-0 items-center justify-center gap-2 whitespace-nowrap font-balootamma2 text-[13px] font-semibold leading-none text-111111 transition-colors sm:h-[34px] sm:w-auto sm:rounded-[6px] sm:border sm:border-[#3046EB] sm:px-[14px] sm:text-[15px] sm:text-[#3046EB] sm:hover:bg-[#3046EB] sm:hover:text-white sm:dark:border-[#7c8cf5] sm:dark:text-[#7c8cf5] sm:dark:hover:bg-[#3046EB] sm:dark:hover:text-white"
      >
        {showIcon && <UserIcon />}
        {/* Phones show just the profile icon; the label appears from lg up. */}
        <span className="hidden max-w-[140px] truncate lg:inline">
          {isAuthenticated ? signedInLabel : label}
        </span>
      </button>

      {isAuthenticated && menuOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-[80] mt-2 w-[240px] overflow-hidden rounded-[6px] border border-DFDFDF bg-FFFFFF shadow-[0_12px_32px_rgba(0,0,0,0.16)]"
        >
          {/* Name only — the email address is intentionally not shown. */}
          {user?.name && (
            <div className="border-b border-EEEEEE px-4 py-3">
              <p className="truncate font-balootamma2 text-[15px] font-semibold text-1E1E1E">
                {user.name}
              </p>
            </div>
          )}
          <Link
            href="/bookmark"
            role="menuitem"
            onClick={() => setMenuOpen(false)}
            className="flex w-full items-center gap-2 border-b border-EEEEEE px-4 py-3 text-left font-balootamma2 text-[15px] font-medium text-1E1E1E no-underline transition-colors hover:bg-F9F9F9"
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none">
              <path
                d="M17.6 3.3c1.1.13 1.9 1.08 1.9 2.19V21L12 17.25 4.5 21V5.5c0-1.11.8-2.06 1.9-2.19a48.5 48.5 0 0 1 11.2 0Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            ನನ್ನ ಬುಕ್‌ಮಾರ್ಕ್‌ಗಳು
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            disabled={busy}
            className="flex w-full items-center gap-2 px-4 py-3 text-left font-balootamma2 text-[15px] font-medium text-1E1E1E transition-colors hover:bg-F9F9F9 disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none">
              <path
                d="M16 17l5-5-5-5M21 12H9M12 19H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {busy ? "ಲಾಗ್ ಔಟ್ ಆಗುತ್ತಿದೆ…" : "ಲಾಗ್ ಔಟ್"}
          </button>
        </div>
      )}

      {!isAuthenticated && (
        <LoginPopup open={loginOpen} onClose={() => setLoginOpen(false)} />
      )}
    </div>
  );
}
