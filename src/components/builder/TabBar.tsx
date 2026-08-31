"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export interface TabMeta {
  id: string;
  label: string;
  /** When set, the tab is a navigational link to this section URL (its active
   *  state is driven by the current page URL) instead of a client panel switch. */
  href?: string;
}

interface Props {
  tabs: TabMeta[];
  /** Pre-rendered (server) panel content, index-aligned with `tabs`. */
  panels: ReactNode[];
  defaultActiveId?: string;
  position?: "top" | "bottom" | "left" | "right";
  sticky?: boolean;
  stickyTop?: string;
  styleVars?: {
    textColor?: string;
    activeTextColor?: string;
    activeBg?: string;
    inactiveBg?: string;
    activeBorder?: string;
    fontSize?: string;
  };
}

/**
 * Static tab bar. Content for every tab is rendered on the server and handed in
 * via `panels`; this client component only switches which panel is visible, so
 * there's no client-side data fetching.
 */
export default function TabBar({
  tabs,
  panels,
  defaultActiveId,
  position = "top",
  sticky,
  stickyTop,
  styleVars,
}: Props) {
  const initial = Math.max(
    0,
    tabs.findIndex((t) => t.id === defaultActiveId),
  );
  const [active, setActive] = useState(initial === -1 ? 0 : initial);

  const isSide = position === "left" || position === "right";

  const barStyle: CSSProperties = sticky
    ? { position: "sticky", top: stickyTop ?? "0", zIndex: 10 }
    : {};

  const buttons = (
    <div
      className={cn(
        "flex gap-2",
        isSide ? "flex-col" : "flex-row flex-wrap border-b border-[var(--color-D2D2D2)]",
      )}
      style={barStyle}
      role="tablist"
    >
      {tabs.map((tab, i) => {
        const on = i === active;
        const className = cn(
          "cursor-pointer whitespace-nowrap px-4 py-2 font-manrope font-semibold no-underline transition-colors",
          on ? "border-b-2" : "opacity-70 hover:opacity-100",
        );
        const style: CSSProperties = {
          color: on ? styleVars?.activeTextColor : styleVars?.textColor,
          background: on ? styleVars?.activeBg : styleVars?.inactiveBg,
          borderColor: on ? styleVars?.activeBorder : undefined,
          fontSize: styleVars?.fontSize,
        };
        // A tab bound to a section URL navigates (real routes, URL drives
        // active); an unbound tab switches the pre-rendered panel client-side.
        if (tab.href) {
          return (
            <Link
              key={tab.id}
              href={tab.href}
              role="tab"
              aria-selected={on}
              aria-current={on ? "page" : undefined}
              className={className}
              style={style}
            >
              {tab.label}
            </Link>
          );
        }
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={on}
            onClick={() => setActive(i)}
            className={className}
            style={style}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );

  const panel = (
    <div role="tabpanel" className="pt-4">
      {panels[active]}
    </div>
  );

  if (position === "bottom") {
    return (
      <div>
        {panel}
        {buttons}
      </div>
    );
  }
  if (isSide) {
    return (
      <div className={cn("flex gap-4", position === "right" && "flex-row-reverse")}>
        {buttons}
        <div className="flex-1">{panels[active]}</div>
      </div>
    );
  }
  return (
    <div>
      {buttons}
      {panel}
    </div>
  );
}
