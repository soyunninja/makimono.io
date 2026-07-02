# Apply Progress: Add User Public Profile

## Mode

- Apply mode: Standard
- Strict TDD: disabled by `openspec/config.yaml`
- Artifact store: OpenSpec
- Review strategy: stacked-to-main, PR 1 / Phase 1 complete; PR 2 / Phase 2 complete; PR 3 / Phase 3 complete

## Completed Tasks

- [x] 1.1 Updated `docs/pocketbase-collections.json` with the `users.username` text field requirements, unique non-empty username index, owner update rule requirement, and single stored WebP `users.avatar` file field capped at 200 KB.
- [x] 1.2 Created `src/features/auth/public-profile.ts` with `UserPublicProfile`, `UpdatePublicProfileInput`, username normalization/validation, and a safe auth-record mapper that returns only `username` and `avatarUrl`.
- [x] 1.3 Added `src/features/auth/public-profile.test.ts` covering the allowed public fields and proving email, id, bio, display name, list-sharing data, auth metadata, and avatar file metadata are excluded.
- [x] 2.1 Created `src/features/auth/avatar-normalization.ts` with typed input validation that rejects unsupported avatar formats and original files over 5 MB before image decoding or storage preparation.
- [x] 2.2 Implemented browser-isolated center-crop avatar normalization to static `200x200` WebP output, retrying WebP quality within the 200 KB cap and returning typed failures without mutating existing avatar state.
- [x] 2.3 Added `src/features/auth/avatar-normalization.test.ts` covering accepted formats, rejected original size/type, output type/size/dimensions, animated GIF static WebP behavior, oversized normalized output, and unchanged-current-avatar failure handling.
- [x] 3.1 Modified `src/lib/pocketbase.ts` with narrowed profile-aware auth record fields, a public PocketBase file URL helper, FormData update support, and JSON content-type preservation only for JSON bodies.
- [x] 3.2 Modified `src/features/auth/pocketbase-auth-provider.tsx` to expose `publicProfile` and `updatePublicProfile`, send username/avatar updates as FormData, save the returned auth record, and refresh the derived public profile.
- [x] 3.3 Modified `src/features/settings/settings-screen.tsx` with an authenticated settings-only public profile card showing a centered avatar or deterministic fallback with the username underneath plus username edit and avatar upload controls.
- [x] 3.4 Updated `src/i18n/dictionaries.ts` with EN/ES profile labels, avatar upload guidance, username validation messages, avatar-processing failures, and generic save failure copy.

## Verification

- Passed for PR 3 targeted coverage: `npx pnpm test src/lib/pocketbase.test.ts src/features/auth/pocketbase-auth-provider.test.tsx src/features/settings/settings-screen.test.tsx` (3 test files, 20 tests before later full-suite verification).
- Passed for PR 3 full type safety: `npx pnpm typecheck` (`tsc --noEmit` completed with no errors).
- Passed for PR 3 full test suite: `npx pnpm test` (Vitest: 28 test files passed, 232 tests passed).
- Passed for PR 3 production build: `npx pnpm build` (Vite/Nitro production build completed successfully).
- Previous PR 2 evidence remains valid: `npx pnpm typecheck`, `npx pnpm test`, and `npx pnpm build` passed after the draw/canvas failure fix, including `src/features/auth/avatar-normalization.test.ts`.
- Previous targeted PR 1/PR 2 evidence remains valid: `npx pnpm test src/features/auth/public-profile.test.ts`, `npx pnpm test src/features/auth/avatar-normalization.test.ts`, and JSON parsing of `docs/pocketbase-collections.json` passed before the full verification follow-up.

### Verification Warnings

- `npx pnpm build` emitted Nitro's production-environment compatibility reminder: ensure the deployment environment matches the builder OS and architecture (`darwin-arm64`) to avoid native module issues.
- Manual PocketBase schema/rule verification remains a separate follow-up because this slice changed app code and tests only.

## Deviations

- None. PR 3 intentionally stays in the authenticated settings/account area and does not add public routes, bio, display name, list sharing, or additional public fields.

## Next Slice

- Phase 4 verification tasks remain unchecked in `tasks.md` because this apply batch was assigned only Phase 3 tasks. The next phase should run the dedicated verification/reporting pass, including manual PocketBase schema/rule verification if available.

## Notes

- Prior slice evidence is preserved above; PR 3 provider/settings tests cover FormData refresh, privacy boundaries, fallback avatar, localized errors, and unchanged-avatar failure handling.
