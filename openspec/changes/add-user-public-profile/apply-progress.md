# Apply Progress: Add User Public Profile

## Mode

- Apply mode: Standard
- Strict TDD: disabled by `openspec/config.yaml`
- Artifact store: OpenSpec
- Review strategy: stacked-to-main, PR 1 / Phase 1 complete; PR 2 / Phase 2 complete

## Completed Tasks

- [x] 1.1 Updated `docs/pocketbase-collections.json` with the `users.username` text field requirements, unique non-empty username index, owner update rule requirement, and single stored WebP `users.avatar` file field capped at 200 KB.
- [x] 1.2 Created `src/features/auth/public-profile.ts` with `UserPublicProfile`, `UpdatePublicProfileInput`, username normalization/validation, and a safe auth-record mapper that returns only `username` and `avatarUrl`.
- [x] 1.3 Added `src/features/auth/public-profile.test.ts` covering the allowed public fields and proving email, id, bio, display name, list-sharing data, auth metadata, and avatar file metadata are excluded.
- [x] 2.1 Created `src/features/auth/avatar-normalization.ts` with typed input validation that rejects unsupported avatar formats and original files over 5 MB before image decoding or storage preparation.
- [x] 2.2 Implemented browser-isolated center-crop avatar normalization to static `200x200` WebP output, retrying WebP quality within the 200 KB cap and returning typed failures without mutating existing avatar state.
- [x] 2.3 Added `src/features/auth/avatar-normalization.test.ts` covering accepted formats, rejected original size/type, output type/size/dimensions, animated GIF static WebP behavior, oversized normalized output, and unchanged-current-avatar failure handling.

## Verification

- Passed after the draw/canvas failure fix: `npx pnpm typecheck` (`tsc --noEmit` completed with no errors).
- Passed after the draw/canvas failure fix: `npx pnpm test` (Vitest: 28 test files passed, 230 tests passed, including `src/features/auth/avatar-normalization.test.ts`).
- Passed after the draw/canvas failure fix: `npx pnpm build` (Vite/Nitro production build completed successfully).
- Previous targeted evidence remains consistent with the full verification: `npx pnpm test src/features/auth/avatar-normalization.test.ts` covered 7 avatar-normalization tests before the final full run.
- Additional targeted evidence from the original slice remains valid: `npx pnpm test src/features/auth/public-profile.test.ts` and `node -e "JSON.parse(require('node:fs').readFileSync('docs/pocketbase-collections.json','utf8'))"` passed before the full verification follow-up.

### Verification Warnings

- `npx pnpm build` emitted Nitro's production-environment compatibility reminder: ensure the deployment environment matches the builder OS and architecture (`darwin-arm64`) to avoid native module issues.
- No verification failures were observed, and no code changes were required.

## Deviations

- None. PR 2 intentionally stops at avatar validation and normalization; provider update wiring, settings UI, i18n copy, and public routes remain out of scope.

## Next Slice

- PR 3 / Phase 3: wire profile updates into the auth provider and settings-only UI card while keeping public routes, bio, display name, and list sharing out of scope.

## Notes

- No previous apply progress existed for this change, so this artifact starts the cumulative apply history.
- The mapper accepts an optional avatar URL resolver but never exposes raw PocketBase auth records or file metadata through `UserPublicProfile`.
- Follow-up after commit-hook review failure: this artifact now records the repo-required full verification commands without changing the Phase 1 slice scope.
- Avatar normalization uses dependency-injected browser image/canvas seams so jsdom tests can exercise crop and conversion behavior deterministically without adding a runtime image dependency.
- Fresh gate-review blocker fixed: browser canvas/draw/output processing exceptions now return typed normalization failures that preserve the current avatar; focused avatar tests and typecheck passed after the fix.
