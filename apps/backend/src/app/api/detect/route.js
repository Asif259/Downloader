import { NextResponse } from "next/server";
import { applyCors, corsPreflight } from "@/lib/cors";
import { detectPlatform, normalizeUrl } from "@/lib/detector";
import { validateUrlDns } from "@/lib/dnsValidator";
import { fetchMetadata } from "@/lib/downloader";
import { classifyBackendError } from "@/lib/errors";
import { logRequest } from "@/lib/requestLog";

export const runtime = "nodejs";

export function OPTIONS(request) {
  return corsPreflight(request);
}

export async function POST(request) {
  const startedAt = Date.now();
  try {
    const body = await request.json().catch(() => null);
    if (body === null) {
      const response = applyCors(
        NextResponse.json({ error: "Invalid JSON body.", code: "INVALID_JSON" }, { status: 400 }),
        request,
      );
      logRequest({
        method: "POST",
        route: "/api/detect",
        status: 400,
        durationMs: Date.now() - startedAt,
        errorCode: "INVALID_JSON",
      });
      return response;
    }

    const normalizedUrl = normalizeUrl(body?.url);

    if (!normalizedUrl) {
      const response = applyCors(
        NextResponse.json({ error: "A valid URL is required.", code: "INVALID_URL" }, { status: 400 }),
        request,
      );
      logRequest({ method: "POST", route: "/api/detect", status: 400, durationMs: Date.now() - startedAt, errorCode: "INVALID_URL" });
      return response;
    }

    const dnsCheck = await validateUrlDns(normalizedUrl);
    if (!dnsCheck.safe) {
      const response = applyCors(
        NextResponse.json(
          { error: "The provided URL resolves to a private or inaccessible network address.", code: "SSRF_BLOCKED" },
          { status: 400 },
        ),
        request,
      );
      logRequest({ method: "POST", route: "/api/detect", status: 400, durationMs: Date.now() - startedAt, errorCode: "SSRF_BLOCKED" });
      return response;
    }

    const platform = detectPlatform(normalizedUrl);
    const metadata = await fetchMetadata(normalizedUrl);

    const response = applyCors(
      NextResponse.json({
        url: normalizedUrl,
        platform,
        title: metadata.title,
        duration: metadata.duration,
        thumbnail: metadata.thumbnail,
        uploader: metadata.uploader,
        extractor: metadata.extractor,
        webpageUrl: metadata.webpage_url || normalizedUrl,
      }),
      request,
    );
    logRequest({ method: "POST", route: "/api/detect", status: 200, durationMs: Date.now() - startedAt });
    return response;
  } catch (error) {
    const classified = classifyBackendError(error, "Failed to detect media.");
    const response = applyCors(
      NextResponse.json(
        { error: classified.message, code: classified.code, userMessage: classified.userMessage },
        { status: classified.status },
      ),
      request,
    );
    logRequest({
      method: "POST",
      route: "/api/detect",
      status: classified.status,
      durationMs: Date.now() - startedAt,
      errorCode: classified.code,
    });
    return response;
  }
}
