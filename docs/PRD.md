# Product Requirements Document (PRD) — DownLink

**Project Name:** DownLink (Downloader Monorepo)  
**Version:** 1.0.0 (MVP) / 2.0.0 (Roadmap)  
**Document Status:** Approved Single Source of Truth  
**Target Release:** Production Web  

---

## 1. Product Overview and Vision

**DownLink** is a modern, high-speed, multi-platform media extraction web application. It enables content creators, researchers, archivists, and casual web users to effortlessly extract, transcode, and download high-definition video and audio from popular social and media platforms (YouTube, Instagram, TikTok, Facebook, X/Twitter, and direct media links) without intrusive advertisements, malware risks, or clunky browser extensions.

### Vision Statement
To provide the cleanest, fastest, and most privacy-focused media downloader on the web, bridging modern web interface design with enterprise-grade download and transcoding engine stability.

---

## 2. Problem Statement

Modern social media and video sharing platforms employ proprietary viewers and ephemeral content policies that make saving user-authorized media or personal archival copies difficult. Existing web downloaders suffer from severe drawbacks:
1. **Hostile User Experience:** Plagued with intrusive pop-up ads, deceptive download buttons, and malicious redirects.
2. **Fragile Extraction Engines:** Frequently break when platforms change their APIs, HTML structure, or bot protections.
3. **Opaque Progress:** Users submit a link and stare at a spinner without knowing if the download is processing, stalled, or failed.
4. **Poor Quality Selection:** Either force a single compressed file or fail to combine separated video and audio tracks (e.g., YouTube 1080p+ DASH streams).

---

## 3. Proposed Solution

DownLink solves this through an architectural separation of concerns:
- **A Sleek, Dark-First Web Client (`apps/frontend`):** Built with Next.js and React 19, featuring instant URL pattern detection, thumbnail/metadata previews, granular video/audio format pickers, real-time download progress tracking, and client-side history management.
- **A Resilient Extraction Service (`apps/backend`):** A headless containerized Next.js/Node.js service leveraging `yt-dlp` and `ffmpeg` with cookie authentication support, automatic stream merging, asynchronous task tracking, and direct binary streaming.
- **Unified Workspace:** Managed via Turborepo to ensure seamless shared validation, TypeScript/ESLint consistency, and rapid iteration.

---

## 4. Target Users and Personas

### Persona A: Sarah — Digital Content Creator & Video Editor
- **Profile:** 26, freelance social media editor.
- **Goal:** Quickly grab B-roll clips, trending TikTok audio, and Instagram Reels to re-edit into short-form client deliverables.
- **Pain Point:** Free downloader sites bombard her with ads, often download truncated files, and cap resolution at 720p.
- **Need in DownLink:** Reliable 1080p video extraction with audio merged, clear format pickers, and instant downloads.

### Persona B: David — Academic Researcher & Archivist
- **Profile:** 34, digital humanities researcher.
- **Goal:** Archive public political speeches, news reports, and community videos from YouTube and X before links are deleted.
- **Pain Point:** Browser extensions get banned from web stores or leak tracking telemetry; command-line tools are cumbersome for ad-hoc downloads.
- **Need in DownLink:** Privacy-first, transparent progress status, audio-only extraction (MP3/M4A), and zero tracking.

### Persona C: Alex — Mobile & Casual Media Consumer
- **Profile:** 21, student.
- **Goal:** Save study tutorials and music mixes to offline storage on mobile and laptop.
- **Pain Point:** Sites fail to open on mobile browsers or trigger suspicious pop-up tabs.
- **Need in DownLink:** Fast, responsive mobile web interface with automatic clipboard detection and one-tap download.

---

## 5. User Stories and Use Cases

### US-01: Auto-Detect Platform URL
- **As a** user,
- **I want to** paste any video link into the input field,
- **So that** DownLink automatically recognizes the host platform and validates the URL format before requesting extraction.

### US-02: Format and Resolution Selection
- **As a** user,
- **I want to** see available resolutions (1080p, 720p, 480p, etc.) and audio-only formats (MP3, M4A),
- **So that** I can pick the exact balance of visual fidelity and file size I need.

### US-03: Asynchronous Progress Monitoring
- **As a** user,
- **I want to** see live download progress percentage, transfer speed (e.g., `4.2 MB/s`), and estimated time remaining (ETA),
- **So that** I know the download is actively proceeding.

### US-04: Background Cancellation
- **As a** user,
- **I want to** cancel an ongoing download if I pasted the wrong link or chose the wrong resolution,
- **So that** server resources and bandwidth are immediately freed.

### US-05: Local Download History
- **As a** user,
- **I want to** retain a local record of my downloaded media within the browser,
- **So that** I can review past downloads, view timestamps, and re-download links without logging into an account.

---

## 6. Functional Requirements

### 6.1 URL Ingestion & Detection
- **FR-01:** System must support URLs from YouTube (standard, Shorts, youtu.be), Instagram (Posts, Reels, TV), TikTok (videos), Facebook (Watch, public video posts), X / Twitter (status posts), and direct media file extensions (`.mp4`, `.mov`, `.webm`, `.mp3`).
- **FR-02:** System must sanitize, strip tracking query parameters (e.g., `utm_*`, `igsh`, `si`), and normalize incoming strings into compliant HTTP/HTTPS URLs.
- **FR-03:** Frontend must reflect recognized platform badges in real-time as the user types or pastes.

### 6.2 Format Extraction & Metadata
- **FR-04:** Backend must query the target media via `yt-dlp` using non-downloading extraction (`--dump-single-json` / `--simulate`).
- **FR-05:** Response must include title, duration in seconds, thumbnail URL, uploader/channel name, and a normalized array of available video and audio streams.
- **FR-06:** System must group video formats by standardized height increments (1080p, 720p, 480p, 360p) and prioritize MP4 container formats over WebM for broader device compatibility.

### 6.3 Task Execution & Queue Management
- **FR-07:** Downloading must operate asynchronously. The backend creates a task record with a unique `taskId` and returns `202 Accepted` or `200 OK` with initial state `pending`.
- **FR-08:** Download execution must spawn a background process handling streaming, transcode/muxing via `ffmpeg` where separate video and audio streams are selected.
- **FR-09:** Progress parser must capture standard output from `yt-dlp` (`[download] XX.X% of ~YY.YYMiB at ZZ.ZZMiB/s ETA MM:SS`) and update in-memory task status.
- **FR-10:** Clients must poll `GET /api/status/:taskId` at configurable intervals (1000ms default) to receive state updates (`pending`, `downloading`, `completed`, `failed`).

### 6.4 File Transfer & Direct Streaming
- **FR-11:** Upon completion, the task status must provide a valid download route: `/api/file/:taskId`.
- **FR-12:** The file delivery handler must stream the file directly with appropriate headers: `Content-Disposition: attachment; filename="<sanitized-title>.<ext>"`, `Content-Length`, and matching `Content-Type`.
- **FR-13:** System must purge temporary downloaded files from backend storage after a predefined time-to-live (TTL default: 30 minutes) or immediately following successful client streaming.

### 6.5 Session & Cancellation Control
- **FR-14:** Clients must generate a persistent `sessionId` stored in browser memory.
- **FR-15:** When a user reloads or navigates away, the client issues `POST /api/download/cancel-session` to terminate all active child processes linked to that `sessionId`.

---

## 7. Non-Functional Requirements

### 7.1 Performance
- **NFR-01 (Detection Latency):** URL format detection on the frontend must execute in `< 10ms` (client-side regex evaluation).
- **NFR-02 (Format Fetch Time):** Backend metadata extraction must complete within `2.5 seconds` on stable network connections.
- **NFR-03 (Streaming Throughput):** Download streaming must match the maximum available outbound network bandwidth of the host container without buffering entire multi-gigabyte files into server RAM.

### 7.2 Reliability & Availability
- **NFR-04 (Process Isolation):** Each download task must run as an isolated child process. Failure or crash of one download process must never destabilize the parent Node.js application or terminate neighboring tasks.
- **NFR-05 (Backend Cold-Start Notification):** If hosted on serverless or sleep-on-idle infrastructure (e.g., Render free tier), the frontend must detect `503/504` or connection dropouts and provide an informative "Backend waking up, retrying in 20-30s" hint instead of a generic error.

### 7.3 Security & Privacy
- **NFR-06 (No Arbitrary Command Injection):** User-supplied URLs and parameters must NEVER be concatenated directly into shell strings. All child processes must be invoked via `spawn` with arguments passed as discrete array elements.
- **NFR-07 (SSRF Defense):** Target URLs must be validated against private IP ranges (`127.0.0.1`, `10.0.0.0/8`, `192.168.0.0/16`, `169.254.169.254`, etc.) to prevent Server-Side Request Forgery.
- **NFR-08 (Cookie Isolation):** Authentication cookies (e.g., YouTube `cookies.txt`) must reside in restricted filesystem paths (`/etc/secrets/` or local `secrets/`) excluded from version control and never exposed to client-facing endpoints.
- **NFR-09 (Zero User Data Logging):** The system must not store user browsing history, IP addresses, or downloaded media permanently on the backend database. All history resides in client `localStorage`.

---

## 8. Feature Categorization & Priority (P0, P1, P2)

| Feature ID | Feature Name | Description | Priority | Release Target |
|---|---|---|---|---|
| **FEAT-01** | Multi-Platform URL Detection | Auto-recognition for YT, IG, TikTok, FB, X, direct links | **P0** | MVP (v1.0) |
| **FEAT-02** | Metadata & Format Extractor | Fetches title, duration, thumbnail, available video/audio formats | **P0** | MVP (v1.0) |
| **FEAT-03** | Asynchronous Download Pipeline | Spawns `yt-dlp` child process, merges audio/video via `ffmpeg` | **P0** | MVP (v1.0) |
| **FEAT-04** | Live Progress Polling | Real-time progress %, ETA, and transfer speed updates | **P0** | MVP (v1.0) |
| **FEAT-05** | Stream File Delivery | Direct binary streaming with clean content disposition | **P0** | MVP (v1.0) |
| **FEAT-06** | Task & Session Cancellation | Aborts server process on demand or page reload | **P0** | MVP (v1.0) |
| **FEAT-07** | Client-Side History | Stored locally in `localStorage` with clear/delete options | **P0** | MVP (v1.0) |
| **FEAT-08** | Dark Aesthetic UI | Emerald/Carbon theme with responsive mobile layout | **P0** | MVP (v1.0) |
| **FEAT-09** | Batch URL Downloader | Queue multiple URLs at once to download sequentially | **P1** | Post-MVP (v1.1) |
| **FEAT-10** | Server-Sent Events (SSE) / WebSocket | Push progress updates instead of 1000ms HTTP polling | **P1** | Post-MVP (v1.1) |
| **FEAT-11** | Subtitle / Caption Extraction | Allow downloading `.vtt` / `.srt` subtitle tracks | **P1** | Post-MVP (v1.2) |
| **FEAT-12** | Cloud Storage Push | Export directly to Google Drive or Dropbox via OAuth | **P2** | Future (v2.0) |
| **FEAT-13** | User Accounts & Cloud Sync | Sync download history across devices via PostgreSQL | **P2** | Future (v2.0) |
| **FEAT-14** | Premium High-Speed Workers | Dedicated background worker cluster with no rate caps | **P2** | Future (v2.0) |

---

## 9. Version Separation: MVP (v1) vs Future (v2)

### Version 1.0 (MVP) — Current Scope
- 100% anonymous, frictionless web experience (no login, no credit cards).
- Single-link processing with rich format selection.
- Ephemeral in-memory task management on backend (`globalThis` Task Store).
- Client-side history storage via HTML5 `localStorage`.
- Monorepo architecture with Next.js frontend on Vercel and Dockerized Next.js backend on Render.
- Automatic disk cleanup of temporary media files.

### Version 2.0 — Extended Roadmap
- User authentication (Google OAuth, GitHub, Email magic links).
- Persistent PostgreSQL database via Prisma for cross-device history and saved collections.
- Distributed task queue powered by Redis / BullMQ for horizontal worker auto-scaling.
- Direct-to-Cloud uploads (Google Drive, Dropbox, Amazon S3).
- Premium subscriber tier with priority queues and unrestricted bandwidth.

---

## 10. Business Rules and Constraints

1. **Ephemeral File Storage:** The server is an intermediary transcoding pipe, not a media hosting provider. Files must be evicted automatically within 30 minutes of creation.
2. **Fair Use & Legal Conformance:** The platform operates strictly as a technical tool for format conversion and personal archival of publicly accessible media, adhering to standard fair use guidelines.
3. **No Intrusive Advertising:** No pop-ups, modal traps, or hidden link injectors shall ever be placed in the user interface.
4. **Bandwidth Protection:** Maximum concurrent downloads per client session is capped at 3 simultaneous tasks to protect server stability.

---

## 11. Success Metrics & Measurable Acceptance Criteria

1. **Extraction Success Rate:** $\ge 95\%$ of valid, publicly accessible URLs from supported platforms successfully return metadata within 3 seconds.
2. **Download Completion Rate:** $\ge 92\%$ of initiated downloads finish without unhandled process termination or timeout errors.
3. **Frontend Performance (Core Web Vitals):**
   - Largest Contentful Paint (LCP) $\le 1.8\text{s}$
   - First Input Delay (FID) / Interaction to Next Paint (INP) $\le 100\text{ms}$
   - Cumulative Layout Shift (CLS) $\le 0.05$
4. **Zero Command Injection Vulnerabilities:** $100\%$ pass rate on automated security scans with zero unsanitized shell inputs.
5. **Zero Data Leakage:** No user IP addresses or request histories persisted to disk logs.

---

## 12. Out-of-Scope Features for MVP

- In-browser video editing, trimming, or audio manipulation.
- Downloading DRM-protected content (e.g., Netflix, Spotify, Disney+, paid pay-per-view streams).
- Torrent, P2P, or magnet link downloads.
- User profile creation, avatar uploads, or social sharing feeds.
- Automated scheduling or recurring cron video archivers.
