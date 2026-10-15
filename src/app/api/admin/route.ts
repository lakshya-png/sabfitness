import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const ownerEmail = process.env.NEXT_PUBLIC_OWNER_ADMIN_EMAIL || "owner@sabfitness.app";

  return NextResponse.json({
    status: "ok",
    configuredOwner: ownerEmail,
    leastPrivilege: true,
    features: ["moderation", "audit_logs", "user_status", "system_health"],
    timestamp: new Date().toISOString(),
  });
}
