# Tasks: Add PocketBase auth repository

## Phase 1: Client and auth

- [x] Add the `pocketbase` dependency and type the `VITE_POCKETBASE_URL` environment variable.
- [x] Add a PocketBase client helper plus auth provider/context with login, register, logout, and persisted session tracking.
- [x] Add a localized auth gate for dashboard/archive routes when PocketBase is enabled.

## Phase 2: Repository integration

- [x] Implement a PocketBase `InterestRepository` with record mapping, create/update/status, and soft delete/restore behavior.
- [x] Add route-level repository selection so authenticated dashboard, archive, add, and edit flows share the PocketBase repository while local fallback behavior stays intact.

## Phase 3: Verification and docs

- [x] Add unit tests for the PocketBase repository and auth gate without regressing local repository tests.
- [x] Commit `docs/pocketbase-collections.json` and update `README.md` with setup and fallback notes.
- [x] Verify with `npx pnpm typecheck`, `npx pnpm test`, and `npx pnpm build`.
