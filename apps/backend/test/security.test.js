import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { validateHostDns, validateUrlDns } from "../src/lib/dnsValidator.js";
import { getAllowedOrigins, isOriginAllowed, applyCors } from "../src/lib/cors.js";
import { DOWNLOAD_DIR, isPathWithinDownloadDir } from "../src/lib/downloader.js";

test("DNS Validator - Blocks loopback, private ranges, and metadata targets", async () => {
  const blockedHosts = [
    "localhost",
    "127.0.0.1",
    "169.254.169.254",
    "10.0.0.1",
    "192.168.1.1",
    "172.16.0.1",
    "internal.service.local",
  ];

  for (const host of blockedHosts) {
    const res = await validateHostDns(host);
    assert.equal(res.safe, false, `Host should be blocked: ${host}`);
  }

  const blockedUrls = [
    "http://127.0.0.1:8080/secret",
    "http://localhost:3000",
    "http://169.254.169.254/latest/meta-data",
  ];

  for (const url of blockedUrls) {
    const res = await validateUrlDns(url);
    assert.equal(res.safe, false, `URL should be blocked: ${url}`);
  }
});

test("DNS Validator - Approves verified public hostnames", async () => {
  const publicUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
  const res = await validateUrlDns(publicUrl);
  assert.equal(res.safe, true, `Legitimate public URL should be approved: ${publicUrl}`);
  assert.ok(Array.isArray(res.addresses) && res.addresses.length > 0);
});

test("CORS Hardening - Multi-origin allowlist enforcement", () => {
  const allowed = getAllowedOrigins();
  assert.ok(allowed.includes("http://localhost:3000"));
  assert.ok(allowed.includes("http://127.0.0.1:3000"));

  // Check origin evaluation
  assert.equal(isOriginAllowed("http://localhost:3000"), true);
  assert.equal(isOriginAllowed("https://malicious-attacker.com"), false);
  assert.equal(isOriginAllowed(""), false);

  // Check applyCors with custom request
  const mockReq = {
    headers: new Headers([["origin", "http://localhost:3000"]]),
  };

  const mockRes = { headers: new Headers() };
  applyCors(mockRes, mockReq);
  assert.equal(mockRes.headers.get("Access-Control-Allow-Origin"), "http://localhost:3000");
  assert.equal(mockRes.headers.get("Vary"), "Origin");
});

test("Filesystem Confinement - Blocks path traversal outside DOWNLOAD_DIR", () => {
  const safeFile = path.join(DOWNLOAD_DIR, "video.mp4");
  assert.equal(isPathWithinDownloadDir(safeFile), true);

  const maliciousPaths = [
    "/etc/passwd",
    "../../etc/shadow",
    path.join(DOWNLOAD_DIR, "../../secret.txt"),
    "",
    null,
    undefined,
  ];

  for (const p of maliciousPaths) {
    assert.equal(isPathWithinDownloadDir(p), false, `Path should be blocked: ${p}`);
  }
});
