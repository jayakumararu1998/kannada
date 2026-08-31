/**
 * Next.js instrumentation hook — runs once when the server process boots.
 * We use it to start the periodic builder pull (Node runtime only).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startPeriodicPull, startHeaderFooterPoll } = await import(
      "@/lib/builder/scheduler"
    );
    startPeriodicPull();
    // Fast backstop poll for the dynamic header/footer (near-real-time chrome).
    startHeaderFooterPoll();
  }
}
