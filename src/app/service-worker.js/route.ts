import { serviceWorkerResponse } from "@/lib/service-worker";

// /service-worker.js — production kannadaprabha.com serves the same worker at
// both /sw.js and /service-worker.js (legacy registrations); keep parity.
export function GET() {
  return serviceWorkerResponse();
}
