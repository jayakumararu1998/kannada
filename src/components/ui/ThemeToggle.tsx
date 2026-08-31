"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { FiMoon, FiSun } from "react-icons/fi";

import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
};

export default function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        // Plain icon (no border/box) — uniform with the other header icons.
        "flex h-9 w-9 shrink-0 items-center justify-center text-111111 transition-colors hover:text-009EF9 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-009EF9)]",
        className,
      )}
    >
      {isDark ? (
        <FiSun aria-hidden="true" className="h-5 w-5" />
      ) : (
        <FiMoon aria-hidden="true" className="h-5 w-5" />
      )}
    </button>
  );
}
