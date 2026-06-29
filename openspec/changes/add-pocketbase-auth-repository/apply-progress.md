# Apply progress: Add PocketBase auth repository

## Completed

- Added the `pocketbase` dependency plus `VITE_POCKETBASE_URL` typing.
- Added a shared PocketBase client/error helper, auth provider, and localized auth gate.
- Added a PocketBase-backed `InterestRepository` with user-scoped create/list/update/status/soft-delete/restore behavior.
- Injected the resolved repository into dashboard, archive, add, and edit route flows while keeping local defaults for direct component tests.
- Added unit tests for the auth gate and PocketBase repository.
- Updated `README.md` and committed `docs/pocketbase-collections.json` for the required backend setup.

## Verification

- `npx pnpm typecheck`
- `npx pnpm test`
- `npx pnpm build`
