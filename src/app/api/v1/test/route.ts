import { NextResponse } from "next/server";

/**
 * GET /api/v1/test
 *
 * Test route — blocked in production.
 * Returns 404 when NODE_ENV === "production" to prevent
 * any test endpoints from being exposed on the live server.
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, env: process.env.NODE_ENV });
}

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
