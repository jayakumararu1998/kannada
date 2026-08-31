import "server-only";

/**
 * Periodic background pull. Started once per server process from
 * `src/instrumentation.ts`. Runs `runPull()` on an interval so routes/pages/
 * menus stay fresh without an external trigger. Disabled when
 * BUILDER_PULL_INTERVAL_MS is 0/unset (on-demand pull only).
 */

import { HEADER_FOOTER_POLL_MS, PULL_INTERVAL_MS } from "./config";
import { runHeaderFooterPull, runPull } from "./pull";

const GLOBAL_KEY = Symbol.for("kannada-prabha.builder.pullScheduler");
const HF_KEY = Symbol.for("kannada-prabha.builder.headerFooterPoll");
type G = typeof globalThis & {
  [GLOBAL_KEY]?: { timer: NodeJS.Timeout };
  [HF_KEY]?: { timer: NodeJS.Timeout };
};

export function startPeriodicPull(): void {
  if (PULL_INTERVAL_MS < 1000) return; // disabled or too aggressive

  const g = globalThis as G;
  if (g[GLOBAL_KEY]) return; // already running in this process

  const tick = async () => {
    try {
      const result = await runPull();
      console.log(
        `[builder] periodic pull: routes=${result.routes} pages=${result.pages} ` +
          `menus=${result.menus} sectionMetas=${result.sectionMetas}` +
          (result.errors.length ? ` (warn: ${result.errors.join(", ")})` : ""),
      );
    } catch (error) {
      console.error("[builder] periodic pull failed:", (error as Error).message);
    }
  };

  const timer = setInterval(tick, PULL_INTERVAL_MS);
  // Don't keep the event loop alive solely for this timer.
  timer.unref?.();
  g[GLOBAL_KEY] = { timer };

  // Kick off an initial pull shortly after boot (non-blocking).
  setTimeout(tick, 3000).unref?.();

  console.log(
    `[builder] periodic pull scheduled every ${Math.round(PULL_INTERVAL_MS / 1000)}s`,
  );
}

/**
 * Fast poll that refreshes ONLY the dynamic header/footer config, so builder
 * edits to the site chrome show up within HEADER_FOOTER_POLL_MS without a heavy
 * full pull. Disabled when HEADER_FOOTER_POLL_MS is 0/unset. Runs alongside (and
 * independent of) the full periodic pull and the instant push webhook.
 */
export function startHeaderFooterPoll(): void {
  if (HEADER_FOOTER_POLL_MS < 1000) return; // disabled or too aggressive

  const g = globalThis as G;
  if (g[HF_KEY]) return; // already running in this process

  const tick = async () => {
    try {
      await runHeaderFooterPull();
    } catch (error) {
      console.error(
        "[builder] header/footer poll failed:",
        (error as Error).message,
      );
    }
  };

  const timer = setInterval(tick, HEADER_FOOTER_POLL_MS);
  timer.unref?.();
  g[HF_KEY] = { timer };

  // Kick off an initial refresh shortly after boot (non-blocking).
  setTimeout(tick, 2000).unref?.();

  console.log(
    `[builder] header/footer poll scheduled every ${Math.round(
      HEADER_FOOTER_POLL_MS / 1000,
    )}s`,
  );
}
