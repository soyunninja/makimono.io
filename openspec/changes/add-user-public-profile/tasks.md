# Tasks: Add User Public Profile

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 520-750 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: PocketBase docs + public-profile boundary → PR 2: avatar normalization → PR 3: settings UI + provider wiring |
| Delivery strategy | auto-forecast |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Define schema docs and safe public-profile types. | PR 1 | Base main; include mapper tests. |
| 2 | Add avatar validation and 200x200 WebP normalization. | PR 2 | Depends on PR 1; include unit tests. |
| 3 | Wire profile update and settings card. | PR 3 | Depends on PR 2; include provider/component tests. |

## Phase 1: Public Boundary and Schema

- [x] 1.1 Update `docs/pocketbase-collections.json` with `users.username` and single WebP `users.avatar` field/rule requirements.
- [x] 1.2 Create `src/features/auth/public-profile.ts` with `UserPublicProfile`, `UpdatePublicProfileInput`, username validation, and auth-record mapper.
- [x] 1.3 Add `src/features/auth/public-profile.test.ts` covering allowed fields only and excluding email, id, bio, display name, list-sharing data, and metadata.

## Phase 2: Avatar Validation and Normalization

- [ ] 2.1 Create `src/features/auth/avatar-normalization.ts` to reject unsupported formats and originals over 5 MB before storage.
- [ ] 2.2 Implement static center-crop `200x200` WebP output capped at 200 KB; animated GIF inputs must store as static WebP.
- [ ] 2.3 Add `src/features/auth/avatar-normalization.test.ts` for accepted formats, rejected size/type, output size/type/dimensions, and unchanged-current-avatar failure paths.

## Phase 3: Auth and Settings Integration

- [ ] 3.1 Modify `src/lib/pocketbase.ts` with narrowed auth typing, avatar file URL helper, and FormData update support without exposing file metadata.
- [ ] 3.2 Modify `src/features/auth/pocketbase-auth-provider.tsx` to expose `publicProfile` and `updatePublicProfile`, then refresh the derived profile after update.
- [ ] 3.3 Modify `src/features/settings/settings-screen.tsx` with a settings-only profile card: centered avatar, username underneath, fallback avatar, edit/upload controls.
- [ ] 3.4 Update `src/i18n/dictionaries.ts` with EN/ES labels and validation/error copy.

## Phase 4: Behavior Tests and Verification

- [ ] 4.1 Add provider tests proving FormData update, auth refresh, and no raw auth record/private-field exposure to settings UI.
- [ ] 4.2 Add settings screen tests for centered avatar/username layout, fallback avatar, localized errors, and no bio/display name/list sharing/dedicated route behavior.
- [ ] 4.3 Run `npx pnpm test`, `npx pnpm typecheck`, and `npx pnpm build`; document manual PocketBase schema/rule verification.

## Explicit Non-Goals

- No bio, extra display name, public list sharing, or dedicated public profile route in this slice.
