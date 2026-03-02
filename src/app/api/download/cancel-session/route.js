import { NextResponse } from "next/server";
import { applyCors, corsPreflight } from "@/lib/cors";
import { cancelTasksBySession } from "@/lib/tasks";

export const runtime = "nodejs";

export function OPTIONS() {
  return corsPreflight();
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
    if (!sessionId) {
      return applyCors(NextResponse.json({ error: "sessionId is required." }, { status: 400 }));
    }

    const canceled = await cancelTasksBySession(sessionId);
    return applyCors(NextResponse.json({ ok: true, canceled }));
  } catch (error) {
    return applyCors(NextResponse.json({ error: error.message || "Failed to cancel session downloads." }, { status: 500 }));
  }
}
