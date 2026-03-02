import { NextResponse } from "next/server";
import { getTask } from "@/lib/tasks";

export const runtime = "nodejs";

export async function GET(_request, context) {
  const { taskId } = await context.params;
  if (!taskId) {
    return NextResponse.json({ error: "Task ID is required." }, { status: 400 });
  }

  const task = await getTask(taskId);

  if (!task) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  return NextResponse.json(task);
}
