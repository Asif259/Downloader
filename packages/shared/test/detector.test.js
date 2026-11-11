import assert from "node:assert/strict";
import test from "node:test";
import { detectPlatform, isPrivateOrBlockedHost, normalizeUrl } from "../src/detector.js";

test("SSRF Defense - blocks loopback and private subnets", () => {
  const dangerousUrls = [
    "http://localhost:8080",
    "http://127.0.0.1:3000",
    "http://169.254.169.254/latest/meta-data",
    "http://192.168.1.1/admin",
    "http://10.0.0.1",
    "http://172.16.0.1",
    "http://test.local",
    "http://internal.service.internal",
  ];

  for (const url of dangerousUrls) {
    assert.equal(normalizeUrl(url), null, `Should block: ${url}`);
  }
});

test("Platform Detection - accurately detects supported media links", () => {
  const expectations = [
    { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", platform: "youtube" },
    { url: "https://youtu.be/dQw4w9WgXcQ", platform: "youtube" },
    { url: "https://www.instagram.com/reel/C3b4c5d/", platform: "instagram" },
    { url: "https://www.tiktok.com/@creator/video/1234567890", platform: "tiktok" },
    { url: "https://x.com/creator/status/1234567890", platform: "x" },
    { url: "https://twitter.com/creator/status/1234567890", platform: "x" },
    { url: "https://www.facebook.com/watch/?v=1234567890", platform: "facebook" },
    { url: "https://cdn.example.com/media/clip.mp4", platform: "direct" },
  ];

  for (const item of expectations) {
    const normalized = normalizeUrl(item.url);
    assert.ok(normalized, `Normalized should not be null for ${item.url}`);
    assert.equal(detectPlatform(normalized), item.platform, `Platform match for ${item.url}`);
  }
});
