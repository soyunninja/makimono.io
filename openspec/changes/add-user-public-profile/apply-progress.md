# Apply Progress: Add User Public Profile

## Mode

- Apply mode: Standard
- Strict TDD: disabled by `openspec/config.yaml`
- Artifact store: OpenSpec
- Review strategy: stacked-to-main, PR 1 / Phase 1 only

## Completed Tasks

- [x] 1.1 Updated `docs/pocketbase-collections.json` with the `users.username` text field requirements, unique non-empty username index, owner update rule requirement, and single stored WebP `users.avatar` file field capped at 200 KB.
- [x] 1.2 Created `src/features/auth/public-profile.ts` with `UserPublicProfile`, `UpdatePublicProfileInput`, username normalization/validation, and a safe auth-record mapper that returns only `username` and `avatarUrl`.
- [x] 1.3 Added `src/features/auth/public-profile.test.ts` covering the allowed public fields and proving email, id, bio, display name, list-sharing data, auth metadata, and avatar file metadata are excluded.

## Verification

- Passed: `npx pnpm test src/features/auth/public-profile.test.ts`
- Passed: `npx pnpm typecheck`
- Passed: `node -e "JSON.parse(require('node:fs').readFileSync('docs/pocketbase-collections.json','utf8'))"`

## Deviations

- None. This slice intentionally stops at schema documentation and the public-profile boundary; avatar normalization, provider update wiring, settings UI, i18n copy, and public routes remain out of scope.

## Next Slice

- PR 2 / Phase 2: implement avatar input validation and static 200x200 WebP normalization with focused tests.

## Notes

- No previous apply progress existed for this change, so this artifact starts the cumulative apply history.
- The mapper accepts an optional avatar URL resolver but never exposes raw PocketBase auth records or file metadata through `UserPublicProfile`.
