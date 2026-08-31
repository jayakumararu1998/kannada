"use client";

import { useCallback, type ComponentProps } from "react";
import NextLink from "next/link";

import { usePrefetch } from "@/hooks/usePrefetch";

type PrefetchLinkProps = ComponentProps<typeof NextLink> & {
  /** Prefetch the target on hover/focus (default: true). */
  prefetchOnHover?: boolean;
};

/**
 * next/link with the default viewport prefetch turned OFF (news pages have 50+
 * links → default prefetch floods the origin with _rsc requests) and a
 * hover/focus prefetch that warms only the link the user is pointing at.
 *
 * A client component, but safe to render from server components — the wrapped
 * card markup is passed through as `children`.
 */
export default function PrefetchLink({
  href,
  children,
  prefetchOnHover = true,
  prefetch = false,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  ...props
}: PrefetchLinkProps) {
  const { prefetchDebounced, cancelPrefetch } = usePrefetch();
  const target = typeof href === "string" ? href : href.pathname ?? "";

  const handleEnter = useCallback<React.MouseEventHandler<HTMLAnchorElement>>(
    (e) => {
      if (prefetchOnHover && target) prefetchDebounced(target);
      onMouseEnter?.(e);
    },
    [prefetchOnHover, target, prefetchDebounced, onMouseEnter],
  );

  const handleLeave = useCallback<React.MouseEventHandler<HTMLAnchorElement>>(
    (e) => {
      cancelPrefetch();
      onMouseLeave?.(e);
    },
    [cancelPrefetch, onMouseLeave],
  );

  const handleFocus = useCallback<React.FocusEventHandler<HTMLAnchorElement>>(
    (e) => {
      if (prefetchOnHover && target) prefetchDebounced(target);
      onFocus?.(e);
    },
    [prefetchOnHover, target, prefetchDebounced, onFocus],
  );

  return (
    <NextLink
      href={href}
      prefetch={prefetch}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleFocus}
      {...props}
    >
      {children}
    </NextLink>
  );
}
