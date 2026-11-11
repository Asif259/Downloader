import { NextResponse } from "next/server";
import { applyCors, corsPreflight } from "@/lib/cors";
import { classifyBackendError } from "@/lib/errors";
import { logRequest } from "@/lib/requestLog";
import { cancelTasksBySession } from "@/lib/tasks";

export const runtime = "nodejs";

export function OPTIONS(request) {
  return corsPreflight(request);
}

export async function POST(request) {
  const startedAt = Date.now();
  try {
    const body = await request.json().catch(() => ({}));
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
    if (!sessionId) {
      const response = applyCors(
        NextResponse.json({ error: "sessionId is required.", code: "INVALID_SESSION_ID" }, { status: 400 }),
        request,
      );
      logRequest({ method: "POST", route: "/api/download/cancel-session", status: 400, durationMs: Date.now() - startedAt, errorCode: "INVALID_SESSION_ID" });
      return response;
    }

    const canceled = await cancelTasksBySession(sessionId);
    const response = applyCors(NextResponse.json({ ok: true, canceled }), request);
    logRequest({ method: "POST", route: "/api/download/cancel-session", status: 200, durationMs: Date.now() - startedAt });
    return response;
  } catch (error) {
    const classified = classifyBackendError(error, "Failed to cancel session downloads.");
    const response = applyCors(
      NextResponse.json(
        { error: classified.message, code: classified.code, userMessage: classified.userMessage },
        { status: classified.status },
      ),
      request,
    );
    logRequest({
      method: "POST",
      route: "/api/download/cancel-session",
      status: classified.status,
      durationMs: Date.now() - startedAt,
      errorCode: classified.code,
    });
    return response;
  }
}
