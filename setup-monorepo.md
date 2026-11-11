# Setup Monorepo Structure

## Goal
Transform the Downloader project into a high-performance Turborepo monorepo with npm workspaces, structured under `apps/*` and `packages/*`, with GitHub Actions CI.

## Tasks
- [x] Task 1: Reorganize apps directory (`backend` -> `apps/backend`, `frontend` -> `apps/frontend`) and create `packages/` directory → Verify: `ls apps/backend apps/frontend packages`
- [x] Task 2: Configure root `package.json` with npm workspaces (`apps/*`, `packages/*`) and Turbo scripts → Verify: `npm run` shows dev, build, lint
- [x] Task 3: Create `turbo.json` with pipeline definitions for `build`, `lint`, and `dev` → Verify: Turbo config valid syntax
- [x] Task 4: Add shared packages (`packages/eslint-config` or `packages/shared`) for common standards → Verify: directory and `package.json` created in packages
- [x] Task 5: Update `.gitignore` for monorepo roots, `.turbo`, and app directories → Verify: git status ignores `.turbo` and nested build caches
- [x] Task 6: Update `apps/backend/render.yaml` rootDir to `apps/backend` → Verify: render.yaml contains `rootDir: apps/backend`
- [x] Task 7: Set up `.github/workflows/ci.yml` for pull request & push verification → Verify: GitHub Actions workflow file exists and is valid YAML
- [x] Task 8: Run root dependency install and verify Turbo build/lint → Verify: `npm run lint` and `npm run build` pass cleanly
- [x] Task 9: Stage changes and create a clean git commit → Verify: `git status` clean and ready

## Done When
- [x] Turborepo manages `apps/backend` and `apps/frontend` with npm workspaces
- [x] Root `npm run lint` and `npm run build` run successfully across all workspaces
- [x] GitHub Actions CI workflow is configured under `.github/workflows/ci.yml`
