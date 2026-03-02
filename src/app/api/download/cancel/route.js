import { NextResponse } from "next/server";
import { applyCors, corsPreflight } from "@/lib/cors";
import { cancelTaskById } from "@/lib/tasks";

export const runtime = "nodejs";

export function OPTIONS() {
  return corsPreflight();
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const taskId = typeof body?.taskId === "string" ? body.taskId : "";
    if (!taskId) {
      return applyCors(NextResponse.json({ error: "taskId is required." }, { status: 400 }));
    }

    const canceled = await cancelTaskById(taskId);
    return applyCors(NextResponse.json({ ok: true, canceled }));
  } catch (error) {
    return applyCors(NextResponse.json({ error: error.message || "Failed to cancel task." }, { status: 500 }));
  }
}
