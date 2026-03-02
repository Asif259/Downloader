import { NextResponse } from "next/server";
import { applyCors, corsPreflight } from "@/lib/cors";
import { getTask } from "@/lib/tasks";

export const runtime = "nodejs";

export function OPTIONS() {
  return corsPreflight();
}

export async function GET(_request, context) {
  const { taskId } = await context.params;
  if (!taskId) {
    return applyCors(NextResponse.json({ error: "Task ID is required." }, { status: 400 }));
  }

  const task = await getTask(taskId);

  if (!task) {
    return applyCors(NextResponse.json({ error: "Task not found." }, { status: 404 }));
  }

  return applyCors(NextResponse.json(task));
}
