# Downloader Monorepo

High-performance video and audio downloader built with Next.js, orchestrated as a monorepo powered by **Turborepo** and **npm workspaces**.

## Architecture & Layout

```
Downloader/
├── apps/
│   ├── backend/        # Downlink API server (Next.js route handlers, yt-dlp, ffmpeg)
│   └── frontend/       # Downlink Web UI (Next.js, React 19)
├── packages/
│   └── shared/         # Shared utilities, URL detectors, and platform definitions
├── .github/
│   └── workflows/
│       └── ci.yml      # GitHub Actions CI for linting and building
├── package.json        # Root workspace configuration
├── turbo.json          # Turborepo task pipelines
└── render.yaml         # Blueprint specification for Render backend deployment
```

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Development Mode
Run both frontend and backend concurrently:
```bash
npm run dev
```

### 3. Build All Workspaces
Build all applications and packages with Turborepo caching:
```bash
npm run build
```

### 4. Lint
Run ESLint across all packages and apps:
```bash
npm run lint
```

## Deployment

- **Backend (Render / Docker)**: Configured in `render.yaml` with root directory set to `apps/backend`. Uses `apps/backend/Dockerfile`.
- **Frontend (Vercel)**: Point root directory to `apps/frontend` in Vercel project settings or deploy automatically via Next.js Vercel integration.
