"use client";

import { useEffect, useRef } from "react";

/**
 * One Taboola placement, loaded LAZILY for fast pages.
 *
 * Fast-loading strategy:
 *  - The placement `<div>` is server-rendered (`dangerouslySetInnerHTML`), so
 *    its box exists in the initial HTML — no layout shift, no hydration flash.
 *  - Taboola's heavy third-party JS (loader.js + the per-widget push) is kept
 *    OFF the critical path: nothing runs until the slot scrolls within
 *    `rootMargin` of the viewport (IntersectionObserver). Above-the-fold slots
 *    fire almost immediately; far-down slots never cost anything until needed.
 *  - `loader.js` is injected once (the config's loader snippet self-guards on
 *    its script id); each slot's push runs when it activates, and a single
 *    debounced `{flush:true}` renders the whole burst — matching Taboola's
 *    onboarding sequence.
 *  - Scripts embedded in the config HTML are inert when injected via innerHTML,
 *    so we re-materialise them into live <script> elements on activation.
 *  - SPA navigation: this is a client app, so module state survives route
 *    changes. On each new page we push `{notify:'newPageLoad'}` and re-run the
 *    header's page-type declaration (`_taboola.push({article:'auto'})`) before
 *    the new placements — without this, Taboola thinks it is still the previous
 *    page and renders nothing until a full refresh.
 */

// ── Module-level state (shared across every slot on the page) ────────────────

/** Page key (path+query) the header/declaration last ran for. `null` until the
 *  first page. Changes on client-side navigation → triggers a newPageLoad. */
let currentPageKey: string | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
/** The page-type's configured flush code, captured from whichever slot armed
 *  the debounce (all slots on one page share a page type → same flush code). */
let pendingFlushCode: string | null = null;

interface TaboolaWindow extends Window {
  _taboola?: unknown[];
}

function taboolaQueue(): unknown[] {
  const w = window as TaboolaWindow;
  w._taboola = w._taboola || [];
  return w._taboola;
}

/** Materialise inert `<script>` nodes (parsed from a code string) into live,
 *  executing ones. `root` is a detached container; appends run them in `dest`. */
function runScripts(root: ParentNode, dest: Node): void {
  for (const old of Array.from(root.querySelectorAll("script"))) {
    const s = document.createElement("script");
    for (const attr of Array.from(old.attributes)) {
      s.setAttribute(attr.name, attr.value);
    }
    s.text = old.textContent || "";
    dest.appendChild(s);
  }
}

/** Re-run the (inert, innerHTML-injected) scripts already inside an element. */
function runScriptsInPlace(el: HTMLElement): void {
  for (const old of Array.from(el.querySelectorAll("script"))) {
    if ((old as HTMLScriptElement).dataset?.tblRan) continue;
    const s = document.createElement("script");
    for (const attr of Array.from(old.attributes)) {
      s.setAttribute(attr.name, attr.value);
    }
    s.text = old.textContent || "";
    (old as HTMLScriptElement).dataset.tblRan = "1";
    old.replaceWith(s);
  }
}

/**
 * Start Taboola for the current page. Runs at most once per page (the first
 * slot to activate wins; later slots on the same page no-op). On a client-side
 * navigation to a different page it fires `{notify:'newPageLoad'}` first, then
 * re-runs the header so the page-type declaration re-executes — the loader
 * snippet inside self-guards on its script id, so loader.js is not re-fetched.
 * Empty header → just ensure the queue exists ("option only" no-op).
 */
function beginPage(headerCode: string): void {
  const key = window.location.pathname + window.location.search;
  if (currentPageKey === key) return; // header already ran for this page
  const isNavigation = currentPageKey !== null;
  currentPageKey = key;
  const queue = taboolaQueue();
  if (isNavigation) {
    // SPA route change: tell Taboola a new page loaded before re-declaring it.
    queue.push({ notify: "newPageLoad" });
  }
  const code = headerCode.trim();
  if (!code) return;
  const tmp = document.createElement("div");
  tmp.innerHTML = code;
  runScripts(tmp, document.head || document.documentElement);
}

/**
 * Debounced flush so a burst of slots renders together. Runs the page-type's
 * configured `flushCode` verbatim when present; falls back to a plain
 * `{flush:true}` push when the builder left it empty ("option only").
 */
function scheduleFlush(flushCode: string): void {
  if (flushCode.trim()) pendingFlushCode = flushCode.trim();
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushTimer = null;
    const code = pendingFlushCode;
    pendingFlushCode = null;
    if (code) {
      const tmp = document.createElement("div");
      tmp.innerHTML = code;
      runScripts(tmp, document.body || document.documentElement);
    } else {
      taboolaQueue().push({ flush: true });
    }
  }, 120);
}

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  /** Placement body code: the `<div id>` + inline `_taboola.push({…})`. */
  html: string;
  /** Loader bootstrap for this page type (injected once per page). */
  headerCode?: string;
  /** Page-type flush code (`_taboola.push({flush:true})`), run once per burst. */
  flushCode?: string;
  /** Extra wrapper classes (device visibility from the builder). */
  className?: string;
}

export default function TaboolaSlot({
  html,
  headerCode = "",
  flushCode = "",
  className,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const activatedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !html) return;

    const activate = () => {
      if (activatedRef.current) return;
      activatedRef.current = true;
      beginPage(headerCode); // loader + page declaration (+ newPageLoad on SPA nav)
      runScriptsInPlace(el); // execute this placement's push
      scheduleFlush(flushCode); // page-type flush, debounced across the burst
    };

    // If IntersectionObserver is unavailable, activate on idle as a fallback.
    if (typeof IntersectionObserver === "undefined") {
      const id = window.setTimeout(activate, 0);
      return () => window.clearTimeout(id);
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          activate();
          io.disconnect();
        }
      },
      // Warm up ~600px before the slot reaches the viewport.
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [html, headerCode, flushCode]);

  return (
    <div
      ref={ref}
      className={className}
      // Reserve a little height so the box is visible before Taboola fills it.
      style={{ minHeight: 90 }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
