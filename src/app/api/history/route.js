import { NextResponse } from "next/server";
import { clearHistoryRecords, deleteHistoryRecord, listHistoryRecords } from "@/lib/historyStore";

export const runtime = "nodejs";

export async function GET() {
  try {
    const items = await listHistoryRecords(100);

    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to load history." }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const id = new URL(request.url).searchParams.get("id");

    if (id) {
      await deleteHistoryRecord(id);
      return NextResponse.json({ ok: true });
    }

    await clearHistoryRecords();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to delete history." }, { status: 500 });
  }
}
