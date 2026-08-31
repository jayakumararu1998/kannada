import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";

import { validateApiKey } from "@/lib/builder/api-key";
import { getStore } from "@/lib/builder/store";

import { json, preflight, unauthorized } from "../_shared";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return preflight();
}

/** Current global ad-code config. */
export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorized(request);
  const adCodes = getStore().getAdCodes();
  return json({ success: true, count: Object.keys(adCodes).length, adCodes });
}

/**
 * Sync the global positional ad codes (top/lhs/rhs/sticky/anchor). Accepts the
 * config under `adCodes`, `data`, `config`, or the bare body. `merge:true` keeps
 * existing positions and overlays the incoming ones; otherwise the config is
 * replaced wholesale.
 */
export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorized(request);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ success: false, error: "Invalid JSON body" }, 400);
  }

  const incoming = (body.adCodes ??
    body.data ??
    body.config ??
    // Bare config: everything except control flags.
    Object.fromEntries(
      Object.entries(body).filter(([k]) => k !== "merge" && k !== "clearExisting"),
    )) as unknown;

  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
    return json(
      {
        success: false,
        error:
          "No ad codes found. Send { adCodes: { topAdDesktop, topAdMobile, lhsAdDesktop, … } } (positions: top, lhs, rhs, sticky, anchor).",
      },
      400,
    );
  }

  const store = getStore();
  store.beginSync();
  store.setAdCodes(incoming as Record<string, unknown>, body.merge === true);
  const persist = store.persist();
  store.endSync();

  revalidatePath("/", "layout");
  return json({
    success: true,
    keys: Object.keys(incoming as Record<string, unknown>),
    persist,
    store: store.stats(),
  });
}
