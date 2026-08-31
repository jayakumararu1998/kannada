import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";

import { validateApiKey } from "@/lib/builder/api-key";
import { runPull } from "@/lib/builder/pull";
import { getStore } from "@/lib/builder/store";

import { json, preflight, unauthorized } from "../_shared";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return preflight();
}

/**
 * On-demand pull: fetch routes/pages/section-metas from the builder and the main
 * menu from Quintype, merge into the local store, and revalidate. The periodic
 * background pull (see instrumentation) runs the same `runPull()`.
 */
export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorized(request);

  const result = await runPull();
  revalidatePath("/", "layout");

  return json({ success: true, ...result, store: getStore().stats() });
}
