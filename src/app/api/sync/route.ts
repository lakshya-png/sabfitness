import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items } = body;

    return NextResponse.json({
      status: "synced",
      receivedCount: Array.isArray(items) ? items.length : 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Invalid payload or sync processing error", details: err?.message },
      { status: 400 }
    );
  }
}
