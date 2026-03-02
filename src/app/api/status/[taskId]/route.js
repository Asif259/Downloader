import { NextResponse } from "next/server";
import { getTask } from "@/lib/tasks";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  const task = await getTask(params.taskId);

  if (!task) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  return NextResponse.json(task);
}
