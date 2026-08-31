import { serviceWorkerResponse } from "@/lib/service-worker";

// /sw.js — the push-notification service worker registered by IZootoInit.
// Same script production kannadaprabha.com serves at /sw.js.
export function GET() {
  return serviceWorkerResponse();
}
