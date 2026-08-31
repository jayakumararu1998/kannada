import { NextRequest, NextResponse } from "next/server";

/**
 * Same-origin forwarder for the "Advertise with us" form. The shared builder
 * backend (api.kannada.mo.vc) only allows the production origin via CORS, so
 * the client posts here and we forward server-side to /api/contact/send —
 * same pattern as the /api/public bookmark proxy.
 */

const CONTACT_API_BASE =
  process.env.SECTION_META_API_BASE_URL ||
  process.env.BUILDER_API_URL ||
  "https://api.kannada.mo.vc";

export async function POST(request: NextRequest) {
  let body: {
    name?: string;
    companyName?: string;
    contactNumber?: string;
    email?: string;
    remarks?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request body" },
      { status: 400 },
    );
  }

  if (!body.name?.trim() || !body.contactNumber?.trim() || !body.email?.trim()) {
    return NextResponse.json(
      { success: false, message: "Missing required fields" },
      { status: 400 },
    );
  }

  try {
    // Forward the client IP so the backend's per-IP rate limit doesn't lump
    // every visitor together under the origin server's address.
    const clientIp = request.headers.get("x-forwarded-for") ?? "";
    const upstream = await fetch(`${CONTACT_API_BASE}/api/contact/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(clientIp ? { "X-Forwarded-For": clientIp } : {}),
      },
      body: JSON.stringify({
        name: body.name.trim(),
        companyName: body.companyName?.trim() || undefined,
        contactNumber: body.contactNumber.trim(),
        email: body.email.trim(),
        remarks: body.remarks?.trim() || undefined,
      }),
      cache: "no-store",
    });

    const data = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      const message =
        data?.details?.[0]?.message ||
        data?.message ||
        data?.error ||
        "Failed to submit. Please try again.";
      return NextResponse.json(
        { success: false, message },
        { status: upstream.status },
      );
    }

    return NextResponse.json({
      success: true,
      message: data?.message || "Inquiry submitted successfully",
    });
  } catch (error) {
    console.error("[advertise-inquiry] forward failed:", error);
    return NextResponse.json(
      { success: false, message: "Failed to submit. Please try again." },
      { status: 502 },
    );
  }
}
