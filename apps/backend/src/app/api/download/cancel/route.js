import { NextResponse } from "next/server";
import { applyCors, corsPreflight } from "@/lib/cors";
import { classifyBackendError } from "@/lib/errors";
import { logRequest } from "@/lib/requestLog";
import { cancelTaskById } from "@/lib/tasks";

export const runtime = "nodejs";

export function OPTIONS(request) {
  return corsPreflight(request);
}

export async function POST(request) {
  const startedAt = Date.now();
  try {
    const body = await request.json().catch(() => ({}));
    const taskId = typeof body?.taskId === "string" ? body.taskId : "";
    if (!taskId) {
      const response = applyCors(
        NextResponse.json({ error: "taskId is required.", code: "INVALID_TASK_ID" }, { status: 400 }),
        request,
      );
      logRequest({ method: "POST", route: "/api/download/cancel", status: 400, durationMs: Date.now() - startedAt, errorCode: "INVALID_TASK_ID" });
      return response;
    }

    const canceled = await cancelTaskById(taskId);
    const response = applyCors(NextResponse.json({ ok: true, canceled }), request);
    logRequest({ method: "POST", route: "/api/download/cancel", status: 200, durationMs: Date.now() - startedAt });
    return response;
  } catch (error) {
    const classified = classifyBackendError(error, "Failed to cancel task.");
    const response = applyCors(
      NextResponse.json(
        { error: classified.message, code: classified.code, userMessage: classified.userMessage },
        { status: classified.status },
      ),
      request,
    );
    logRequest({
      method: "POST",
      route: "/api/download/cancel",
      status: classified.status,
      durationMs: Date.now() - startedAt,
      errorCode: classified.code,
    });
    return response;
  }
}
