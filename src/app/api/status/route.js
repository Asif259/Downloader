import { NextResponse } from "next/server";
import { listTasks } from "@/lib/tasks";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ tasks: listTasks() });
}
