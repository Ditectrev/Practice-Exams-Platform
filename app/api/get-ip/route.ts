import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Get IP from various headers (for different hosting providers)
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const cfConnectingIp = request.headers.get("cf-connecting-ip");

    let ip = forwarded?.split(",")[0] || realIp || cfConnectingIp;

    // If no IP found in headers, try to get from connection
    if (!ip) {
      ip = request.ip || "127.0.0.1";
    }

    // Clean up the IP (remove port if present)
    if (ip && ip.includes(":")) {
      ip = ip.split(":")[0];
    }

    return NextResponse.json({ ip });
  } catch (error) {
    console.error("Error getting IP:", error);
    return NextResponse.json({ error: "Failed to get IP" }, { status: 500 });
  }
}
