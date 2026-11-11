import assert from "node:assert/strict";
import test from "node:test";
import { detectPlatform, isPrivateIp, isPrivateOrBlockedHost, normalizeUrl } from "../src/detector.js";

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
    "http://100.64.0.1", // CGNAT
    "http://[::1]",
    "http://[fe80::1]",
    "http://[fd00::1]",
    "http://[::ffff:127.0.0.1]",
    "http://[::ffff:169.254.169.254]",
  ];

  for (const url of dangerousUrls) {
    assert.equal(normalizeUrl(url), null, `Should block: ${url}`);
  }
});

test("SSRF Defense - isPrivateIp evaluates IPv4 and IPv6 ranges strictly", () => {
  assert.equal(isPrivateIp("127.0.0.1"), true);
  assert.equal(isPrivateIp("10.10.10.10"), true);
  assert.equal(isPrivateIp("172.24.0.1"), true);
  assert.equal(isPrivateIp("192.168.0.1"), true);
  assert.equal(isPrivateIp("169.254.169.254"), true);
  assert.equal(isPrivateIp("100.64.0.1"), true);
  assert.equal(isPrivateIp("::1"), true);
  assert.equal(isPrivateIp("::"), true);
  assert.equal(isPrivateIp("::ffff:127.0.0.1"), true);
  assert.equal(isPrivateIp("::ffff:192.168.1.1"), true);
  assert.equal(isPrivateIp("fe80::1234"), true);
  assert.equal(isPrivateIp("fd12:3456:789a::1"), true);

  // Public safe IPs
  assert.equal(isPrivateIp("8.8.8.8"), false);
  assert.equal(isPrivateIp("1.1.1.1"), false);
  assert.equal(isPrivateIp("142.250.190.46"), false);
  assert.equal(isPrivateIp("2606:4700:4700::1111"), false);
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
