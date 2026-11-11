# DownLink Monorepo

## Apps
- `frontend/`: Next.js UI (deploy to Vercel)
- `backend/`: Next.js API-only downloader service (deploy to Render Docker)

## Local Development
- Frontend: `npm run dev:frontend`
- Backend: `npm run dev:backend`

## Build
- `npm run build`

## Deploy
- Frontend env: `NEXT_PUBLIC_API_BASE_URL`
- Backend env: `CORS_ALLOW_ORIGIN`, `DOWNLOAD_DIR`
- Backend cookie file (Render Secret File): `/etc/secrets/youtube.cookies.txt`
