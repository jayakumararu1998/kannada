/**
 * Push-notification service worker (dinamani port, Kannada Prabha key).
 *
 * Mirrors production kannadaprabha.com's /sw.js: the iZooto push worker plus
 * Taboola web-push, behind skipWaiting so updates activate immediately. Served
 * from a route (not /public) so the Service-Worker-Allowed + no-store headers
 * are guaranteed — a stale cached worker would keep an old iZooto build alive.
 */
const SERVICE_WORKER_SCRIPT = `// By pass waiting state of service work lifecycle, this can have issues
self.skipWaiting();

var izCacheVer = "1";
importScripts("https://cdn.izooto.com/scripts/workers/4544b1fe65252edb254cdabaab34496289d121e2.js");

importScripts("https://cdn.taboola.com/webpush/tsw.js");
`;

export function serviceWorkerResponse(): Response {
  return new Response(SERVICE_WORKER_SCRIPT, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Service-Worker-Allowed": "/",
    },
  });
}
