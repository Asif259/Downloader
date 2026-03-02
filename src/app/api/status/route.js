import { NextResponse } from "next/server";
import { applyCors, corsPreflight } from "@/lib/cors";
import { listTasks } from "@/lib/tasks";

export const runtime = "nodejs";

export function OPTIONS() {
  return corsPreflight();
}

export async function GET() {
  const tasks = await listTasks();
  return applyCors(NextResponse.json(
    { tasks },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
  ));
}
