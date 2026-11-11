import { NextResponse } from "next/server";
import { applyCors, corsPreflight } from "@/lib/cors";
import { classifyBackendError } from "@/lib/errors";
import { logRequest } from "@/lib/requestLog";
import { getTask } from "@/lib/tasks";

export const runtime = "nodejs";

export function OPTIONS(request) {
  return corsPreflight(request);
}

export async function GET(request, context) {
  const startedAt = Date.now();
  try {
    const { taskId } = await context.params;
    if (!taskId) {
      const response = applyCors(
        NextResponse.json({ error: "Task ID is required.", code: "INVALID_TASK_ID" }, { status: 400 }),
        request,
      );
      logRequest({ method: "GET", route: "/api/status/[taskId]", status: 400, durationMs: Date.now() - startedAt, errorCode: "INVALID_TASK_ID" });
      return response;
    }

    const task = await getTask(taskId);

    if (!task) {
      const response = applyCors(
        NextResponse.json({ error: "Task not found.", code: "TASK_NOT_FOUND" }, { status: 404 }),
        request,
      );
      logRequest({ method: "GET", route: "/api/status/[taskId]", status: 404, durationMs: Date.now() - startedAt, errorCode: "TASK_NOT_FOUND" });
      return response;
    }

    const response = applyCors(NextResponse.json(task), request);
    logRequest({ method: "GET", route: "/api/status/[taskId]", status: 200, durationMs: Date.now() - startedAt });
    return response;
  } catch (error) {
    const classified = classifyBackendError(error, "Failed to load task status.");
    const response = applyCors(
      NextResponse.json(
        { error: classified.message, code: classified.code, userMessage: classified.userMessage },
        { status: classified.status },
      ),
      request,
    );
    logRequest({
      method: "GET",
      route: "/api/status/[taskId]",
      status: classified.status,
      durationMs: Date.now() - startedAt,
      errorCode: classified.code,
    });
    return response;
  }
}
