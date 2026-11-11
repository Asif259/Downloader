import { NextResponse } from "next/server";
import { applyCors, corsPreflight } from "@/lib/cors";
import { fetchFormats } from "@/lib/downloader";
import { normalizeUrl } from "@/lib/detector";
import { classifyBackendError } from "@/lib/errors";
import { logRequest } from "@/lib/requestLog";

export const runtime = "nodejs";

export function OPTIONS() {
  return corsPreflight();
}

export async function POST(request) {
  const startedAt = Date.now();
  try {
    const body = await request.json().catch(() => null);
    if (body === null) {
      const response = applyCors(
        NextResponse.json({ error: "Invalid JSON body.", code: "INVALID_JSON" }, { status: 400 }),
      );
      logRequest({
        method: "POST",
        route: "/api/formats",
        status: 400,
        durationMs: Date.now() - startedAt,
        errorCode: "INVALID_JSON",
      });
      return response;
    }

    const normalizedUrl = normalizeUrl(body?.url);

    if (!normalizedUrl) {
      const response = applyCors(NextResponse.json({ error: "A valid URL is required.", code: "INVALID_URL" }, { status: 400 }));
      logRequest({ method: "POST", route: "/api/formats", status: 400, durationMs: Date.now() - startedAt, errorCode: "INVALID_URL" });
      return response;
    }

    const data = await fetchFormats(normalizedUrl);

    const response = applyCors(NextResponse.json(data));
    logRequest({ method: "POST", route: "/api/formats", status: 200, durationMs: Date.now() - startedAt });
    return response;
  } catch (error) {
    const classified = classifyBackendError(error, "Failed to fetch formats.");
    const response = applyCors(
      NextResponse.json(
        { error: classified.message, code: classified.code, userMessage: classified.userMessage },
        { status: classified.status },
      ),
    );
    logRequest({
      method: "POST",
      route: "/api/formats",
      status: classified.status,
      durationMs: Date.now() - startedAt,
      errorCode: classified.code,
    });
    return response;
  }
}
