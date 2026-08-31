import { isKeyConfigured } from "@/lib/builder/api-key";
import { getStore } from "@/lib/builder/store";

import { json, preflight } from "../_shared";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return preflight();
}

/** Lightweight health/diagnostics: store counts, last sync, and whether a key is set. */
export async function GET() {
  return json({
    success: true,
    keyConfigured: isKeyConfigured(),
    store: getStore().stats(),
  });
}
