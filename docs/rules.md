# AI Development Rules & Coding Guidelines — DownLink

**Project:** DownLink Monorepo  
**Audience:** All AI Coding Assistants, LLMs, and Human Developers  
**Status:** Mandatory Binding Rules  

---

## 1. Project Rules (Single Source of Truth)

Every AI coding assistant working on DownLink MUST follow these rules before executing any change:

1. **Read Before Writing:** You MUST read the relevant documentation in `docs/` before implementing any feature, fixing a bug, or modifying code.
2. **Consult the Tracker:** Always check `docs/tracker.md` to verify task dependencies, current phase, and active priorities.
3. **Follow the Architecture:** Never deviate from the architecture and technology stack defined in `docs/TRD.md`.
4. **Adhere to the Data Model:** Never invent new database entities, local storage schemas, or task fields without checking `docs/schema.md`.
5. **Honor the Design System:** Strictly apply the colors, tokens, fonts, and component rules defined in `docs/design.md`. Never use unapproved colors (e.g., violet/purple).
6. **Respect User Journeys:** Maintain navigation flow, edge case banners, and states specified in `docs/USER_JOURNEY.md`.

---

## 2. Coding Conventions & Code Standards

### 2.1 File & Directory Placement
- **Frontend Code:** Lives exclusively inside `apps/frontend/src/` (`components/`, `hooks/`, `lib/`, `app/`).
- **Backend Code:** Lives exclusively inside `apps/backend/src/` (`app/api/`, `lib/`).
- **Shared Code:** Reusable constants, regexes, and validation utilities belong in `packages/shared/src/`.
- **Never create loose code files** at the root of the repository or outside the designated workspaces.

### 2.2 Component Standards
- **Component Purity:** Keep visual UI components presentation-focused. Extract complex asynchronous state or polling workflows into custom hooks (e.g., `useDownload`, `useHistory`).
- **State Completeness:** Every interactive component MUST handle all standard states:
  - `Default / Empty`
  - `Loading / Skeleton`
  - `Success / Completed`
  - `Error / Retry`
  - `Disabled`
- **Clean Code Discipline:**
  - Concise, direct implementations without over-engineering.
  - Self-documenting variable and function names (e.g., `isLikelyMediaFile`, `cancelTasksBySession`).
  - No redundant, obvious comments (e.g., `// This function returns a number`).

---

## 3. AI Behavior & Operational Guardrails

1. **Zero Unsolicited Refactoring:** Do NOT rewrite or re-architect existing working files unless specifically instructed. Fix the bug or add the feature with surgical precision.
2. **No Invented APIs or Fields:** Do NOT invent API endpoints, task parameters, or query formats that are not defined in `docs/TRD.md` and `docs/schema.md`.
3. **Inspect Before Modifying:** Always read existing code before generating modifications. Never assume the implementation details of a function or component.
4. **Dependency Caution:** Do NOT introduce new third-party npm packages without explaining the technical necessity and confirming approval. Prefer Node.js native standard libraries (`node:fs`, `node:path`, `node:child_process`) and modern React/Next.js built-ins.
5. **Pre-Change Disclosure:** Before executing multi-file edits, clearly disclose which files will be created or modified.
6. **Update the Progress Tracker:** Immediately update `docs/tracker.md` upon completing or altering the status of any task.
7. **Transparent Failure Reporting:** If a task cannot be completed, if tests fail, or if an edge case is unhandled, report it honestly. Never claim completion without verification evidence.

---

## 4. Security Rules & Threat Defenses

### 4.1 Safe Process Execution (Command Injection Defense)
- **STRICT FORBIDDEN:** `child_process.exec("yt-dlp " + userUrl)`
- **MANDATORY PATTERN:** Always use `child_process.spawn()` with arguments passed as discrete elements in an array:
  ```javascript
  // CORRECT
  const child = spawn("yt-dlp", ["--dump-single-json", sanitizedUrl], { ...options });
  ```

### 4.2 SSRF & URL Sanitization
- User URLs must be verified through `normalizeUrl()` from `@downloader/shared`.
- Target URLs must have protocol restricted to `http:` or `https:`.
- Requests resolving to private network IPs (`127.0.0.1`, `10.0.0.0/8`, `169.254.169.254`, etc.) must be rejected.

### 4.3 Secret & Cookie Protection
- Never hardcode cookies, tokens, or credentials in source code.
- Authentication cookies (e.g., `youtube.cookies.txt`) must strictly be read from:
  - `/etc/secrets/youtube.cookies.txt` (Render secret mount)
  - `secrets/youtube.cookies.txt` (local file ignored by git)
  - Environment variable fallback (`YTDLP_COOKIES_BASE64`)
- Never expose cookie file paths or contents to any client-facing API endpoint or client-side bundle.

### 4.4 Path Traversal Defense
- All filesystem operations in `apps/backend` writing or reading media files MUST verify that the target path resolves strictly inside `DOWNLOAD_DIR`:
  ```javascript
  const targetPath = path.resolve(DOWNLOAD_DIR, fileName);
  if (!targetPath.startsWith(path.resolve(DOWNLOAD_DIR))) {
    throw new Error("Access denied: Path traversal detected");
  }
  ```

### 4.5 CORS Security
- `apps/backend` must strictly enforce CORS using the `CORS_ALLOW_ORIGIN` environment variable. Never configure `Access-Control-Allow-Origin: *` in production when handling authenticated sessions.

