import { NextResponse } from "next/server";
import { applyCors, corsPreflight } from "@/lib/cors";
import { fetchFormats } from "@/lib/downloader";
import { normalizeUrl } from "@/lib/detector";

export const runtime = "nodejs";

export function OPTIONS() {
  return corsPreflight();
}

export async function POST(request) {
  try {
    const body = await request.json();
    const normalizedUrl = normalizeUrl(body?.url);

    if (!normalizedUrl) {
      return NextResponse.json({ error: "A valid URL is required." }, { status: 400 });
    }

    const data = await fetchFormats(normalizedUrl);

    return applyCors(NextResponse.json(data));
  } catch (error) {
    return applyCors(NextResponse.json({ error: error.message || "Failed to fetch formats." }, { status: 500 }));
  }
}
