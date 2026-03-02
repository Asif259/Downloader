import { NextResponse } from "next/server";
import { listTasks } from "@/lib/tasks";

export const runtime = "nodejs";

export async function GET() {
  const tasks = await listTasks();
  return NextResponse.json({ tasks });
}
