import { NextResponse } from "next/server";
import { detectPlatform, normalizeUrl } from "@/lib/detector";
import { fetchMetadata } from "@/lib/downloader";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    const normalizedUrl = normalizeUrl(body?.url);

    if (!normalizedUrl) {
      return NextResponse.json({ error: "A valid URL is required." }, { status: 400 });
    }

    const platform = detectPlatform(normalizedUrl);
    const metadata = await fetchMetadata(normalizedUrl);

    return NextResponse.json({
      url: normalizedUrl,
      platform,
      title: metadata.title,
      duration: metadata.duration,
      thumbnail: metadata.thumbnail,
      uploader: metadata.uploader,
      extractor: metadata.extractor,
      webpageUrl: metadata.webpage_url || normalizedUrl,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to detect media." }, { status: 500 });
  }
}
