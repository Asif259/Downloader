import { NextResponse } from "next/server";
import { applyCors, corsPreflight } from "@/lib/cors";
import { classifyBackendError } from "@/lib/errors";
import { logRequest } from "@/lib/requestLog";
import { listTasks } from "@/lib/tasks";

export const runtime = "nodejs";

export function OPTIONS() {
  return corsPreflight();
}

export async function GET() {
  const startedAt = Date.now();
  try {
    const tasks = await listTasks();
    const response = applyCors(NextResponse.json(
      { tasks },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
    ));
    logRequest({ method: "GET", route: "/api/status", status: 200, durationMs: Date.now() - startedAt });
    return response;
  } catch (error) {
    const classified = classifyBackendError(error, "Failed to load status.");
    const response = applyCors(
      NextResponse.json(
        { error: classified.message, code: classified.code, userMessage: classified.userMessage },
        { status: classified.status },
      ),
    );
    logRequest({
      method: "GET",
      route: "/api/status",
      status: classified.status,
      durationMs: Date.now() - startedAt,
      errorCode: classified.code,
    });
    return response;
  }
}
