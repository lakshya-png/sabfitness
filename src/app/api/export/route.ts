import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // In production, verify authorization token header
  const authHeader = request.headers.get("Authorization");

  return NextResponse.json({
    status: "success",
    message: "SabFitness Data Portability Export API",
    note: "Client-side export is directly available in Settings → Export Data.",
    timestamp: new Date().toISOString(),
  });
}
