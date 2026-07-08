# Apply Progress: Rich Public List Composer

## PR Boundaries

### PR 1 / Slice 1

- Work unit: Composer extraction + mapper foundation
- Chain strategy: stacked-to-main
- Scope: reusable rich composer values, public-list mapping helpers, and focused tests only
- Out of scope: public-list editor rich snapshots, public display modes, copy-to-dashboard UI/action

### PR 2 / Slice 2

- Work unit: Public-list editor rich snapshots
- Chain strategy: stacked-to-main
- Scope: replace the minimal list-only public editor form with the extracted rich composer/drawer, save rich snapshots through `updateManagedList`, and extend focused editor coverage
- Out of scope: public page display modes, copy-to-dashboard UI/action, broad privacy/docs hardening

### PR 3 / Slice 3

- Work unit: Public page display modes
- Chain strategy: stacked-to-main
- Scope: cards/list/covers public read-only renderers, public-list-specific display preference storage, and route/page behavior tests
- Out of scope: copy-to-dashboard action, broad PocketBase docs hardening, unrelated archive deletion behavior

### PR 4 / Slice 4

- Work unit: Copy to dashboard
- Chain strategy: stacked-to-main
- Scope: auth-gated per-item and full-list copy from public list snapshots into pending personal interests, duplicate prevention, best-effort public-list save records, and focused route/page tests
- Out of scope: unrelated archive deletion behavior and full release verification

## Mode

Standard mode. Strict TDD is disabled by `openspec/config.yaml` and `sdd-init/makimono.io`.

## Completed Tasks

- [x] 1.1 Extracted `RichInterestFormValues` and `RichInterestComposer` in `src/features/items/add-flow.tsx`; `AdaptiveAddFlow` remains the private-dashboard wrapper that writes through `InterestRepository.createItem`.
- [x] 1.2 Added `RichInterestFormValues -> PublicListItem`, `PublicListItem -> CreateInterestItemInput`, and duplicate-match helpers in `src/features/items/public-list-item-mapper.ts`.
- [x] 1.3 Added focused composer/mapper tests for trim behavior, tags, cover metadata preservation, pending dashboard create input, duplicate matching, and existing dashboard add behavior.
- [x] 2.1 Replaced the quick category/title public editor form with a button that opens `RichInterestComposer`; the old minimal form is no longer layered in the editor.
- [x] 2.2 Persisted new rich list-only snapshots by mapping composer values through `mapRichInterestFormValuesToPublicListItem` and calling `updateManagedList(items)` only; editor tests assert `InterestRepository.createItem` is not called.
- [x] 2.3 Updated `src/i18n/dictionaries.ts` public editor copy for the rich composer entry point, submit label, pending, success, and failure states in English and Spanish.
- [x] 2.4 Extended `src/features/items/public-list-editor-screen.test.tsx` for rich title/category/notes/tags/cover metadata snapshots, update failure rollback, and existing-interest add preservation.
- [x] 2.5 Added saved public-list item removal through `updateManagedList({ items: nextItems })`; success/failure paths preserve committed membership on failure and tests assert private dashboard `createItem`, `updateItem`, and `deleteItem` are not called for snapshot removal.
- [x] 3.1 Added public list `cards`, `list`, and `covers` display modes in `src/features/items/public-list-page.tsx` with public read-only renderers.
- [x] 3.2 Reused `DashboardDisplayPreference` through a public-list-specific storage key (`meinteresa.publicListDisplayPreference`) and restored the public default to `cards`.
- [x] 3.3 Extended route/page tests for display mode switching, default cards behavior, persistence, and no editor/social controls on the public page.
- [x] 4.1 Kept public reads unauthenticated while wiring optional auth/client access through `PublicListPage` via `useOptionalPocketBaseAuth`.
- [x] 4.2 Added auth-gated per-item copy actions with unauthenticated register guidance and no dashboard write.
- [x] 4.3 Mapped copied public items into pending personal interest create inputs.
- [x] 4.4 Added focused tests for authenticated copy, unauthenticated gating, copy failure behavior, duplicate prevention, all-saved disabled/no-op state, and partial full-list failure retry without duplicate creation.

## Verification

| Command | Result |
|---------|--------|
| `npx pnpm test src/features/items/add-flow.test.tsx src/features/items/public-list-item-mapper.test.ts` | Passed: 2 files, 25 tests |
| `npx pnpm typecheck` | Passed |
| `npx pnpm test src/features/items/public-list-editor-screen.test.tsx src/features/items/add-flow.test.tsx src/features/items/public-list-item-mapper.test.ts` | Passed: 3 files, 31 tests |
| `npx pnpm test public-list` | Passed: 8 files, 55 tests |
| `npx pnpm build` | Passed |
| `npx pnpm test src/features/items/public-list-editor-screen.test.tsx` | Passed: 1 file, 8 tests |
| `npx pnpm typecheck` | Passed |
| `npx pnpm test public-list` | Passed: 8 files, 57 tests |
| `npx pnpm test` | Passed: 36 files, 305 tests |
| `npx pnpm test public-list` | Passed: 11 files, 80 tests (audit run after current public-list/page changes) |
| `npx pnpm typecheck` | Passed (audit run after current public-list/page changes) |
| `npx pnpm test src/test/routes/public-list-route.test.tsx` | Passed: 10 tests after display-preference and duplicate-prevention fix |
| `npx pnpm typecheck` | Passed after display-preference and duplicate-prevention fix |
| `npm exec -- vitest run src/test/routes/public-list-route.test.tsx -t "does not duplicate"` | Passed after partial-failure retry fix (`pnpm` unavailable in that subagent environment) |
| `npm exec -- vitest run src/test/routes/public-list-route.test.tsx` | Passed: 11 tests after partial-failure retry fix |
| `npm run typecheck` | Passed after partial-failure retry fix |
| `npx pnpm test src/test/routes/dashboard-nested-routes.test.tsx src/features/items/pocketbase-public-list-repository.test.ts -- --runInBand` | Passed: 46 tests after route/repository owner fix |
| `npx pnpm test` | Passed: 41 files, 341 tests after route/repository owner fix |
| `npx pnpm typecheck` | Passed in final verification (`tsc --noEmit`) |
| `npx pnpm test` | Passed in final verification: 41 files, 341 tests |
| `npx pnpm build` | Passed in final verification |
| `./node_modules/.bin/tsc --noEmit` | Passed after readability helper fix |
| `git diff --check` | Passed after readability helper fix |
| `npx pnpm typecheck` | Passed after final readability helper verification |
| `npx pnpm test` | Passed after final readability helper verification: 40 files, 335 tests |
| `npx pnpm build` | Passed after final readability helper verification |
| `npx pnpm test src/features/items/pocketbase-public-list-repository.test.ts` | Passed after PocketBase create payload null-description fix: 20 tests |
| `npx pnpm typecheck` | Passed after PocketBase create payload null-description fix |

## Changed Files

- `src/features/items/add-flow.tsx` — extracted reusable rich composer contract, kept `AdaptiveAddFlow` as the dashboard repository wrapper, and added optional composer title, submit label, and in-drawer status/alert props for public editor reuse.
- `src/features/items/add-flow.test.tsx` — added composer value-submit coverage while existing dashboard add tests continue to pass.
- `src/features/items/public-list-item-mapper.ts` — added rich snapshot, dashboard create-input, and duplicate-match helpers.
- `src/features/items/public-list-item-mapper.test.ts` — added focused mapper coverage for PR 1.
- `src/features/items/public-list-editor-screen.tsx` — replaced the minimal list-only form with the rich composer/drawer, list-only snapshot persistence through `updateManagedList`, and saved snapshot removal through `updateManagedList({ items: nextItems })` without private interest mutation.
- `src/features/items/public-list-editor-screen.test.tsx` — extended editor coverage for rich snapshots, no private creates, failure rollback, existing-interest add behavior, removal success, removal rollback, and no private repository delete/update during removal.
- `src/i18n/dictionaries.ts` — updated public editor copy for the rich list-only composer entry point, add/remove states, and feedback.
- `src/features/items/dashboard-display-preference.ts` — generalized dashboard display preference storage helpers so public lists can use their own storage key without changing dashboard storage.
- `src/features/items/public-list-page.tsx` — added public display modes, auth-gated copy-to-dashboard actions, saved-item duplicate detection, best-effort public-list save records, and retry-safe full-list copy behavior.
- `src/test/routes/public-list-route.test.tsx` — extended route/page behavior coverage for public display preferences, copy gating, duplicate prevention, all-saved state, and partial-failure retry.
- `src/features/items/public-list-types.ts` — added shared owner username resolution helper to keep managed public-list repository setup consistent.
- `src/test/routes/dashboard-nested-routes.test.tsx` — updated managed public-list route coverage for owner namespace/auth behavior.
- `src/features/items/pocketbase-public-list-repository.ts` — tightened managed-list queries to include authenticated owner ownership while preserving public DTO projections; create payloads omit absent optional text fields instead of sending `null`.
- `src/features/items/pocketbase-public-list-repository.test.ts` — added/updated owner filtering coverage for managed public-list queries and create payload optional text regression coverage.
- `docs/pocketbase-public-lists-collection.json` — documents `items` as non-required and empty public lists as `items: []`.
- `openspec/changes/rich-public-list-composer/proposal.md` — documented public-list membership removal scope and dashboard mutation exclusion.
- `openspec/changes/rich-public-list-composer/specs/public-list-composition/spec.md` — added removal success/failure scenarios and clarified exclusions.
- `openspec/changes/rich-public-list-composer/design.md` — documented removal data flow, failure handling, and private-dashboard boundary.
- `openspec/changes/rich-public-list-composer/tasks.md` — marked Phase 1, Phase 2, and the PR 2 removal extension task complete.

## Remaining Tasks

- [x] Resolved task 5.3 by separating unrelated archive deletion and broad PocketBase docs/import/schema changes out of the working tree.

## Notes

- PR 1 review budget impact was approximately 300 changed lines.
- PR 2 review budget impact is approximately 200 changed lines (`99 insertions`, `100 deletions`) before OpenSpec artifact updates.
- New public-list editor rich items are snapshots only; this slice does not create dashboard/private `InterestItem` records from the public editor.
- Removing a saved public-list item updates only public-list membership snapshots; it does not call private dashboard interest create/update/delete APIs.
- Public display modes and copy-to-dashboard are implemented in the working tree and have focused route/page coverage.
- A fresh reliability re-review found no findings for the display preference, duplicate prevention, all-saved state, and partial full-list failure retry fixes.
- Fresh reliability and risk reviews found no findings for the managed public-list route/repository owner fix.
- Phase 5.1 privacy projection audit passed; public DTO/repository mappings allowlist public fields and tests assert private fields are omitted.
- Phase 5.2 documentation audit passed after documenting that `items` remains non-required and empty public lists use `items: []`.
- Final verification passed: `npx pnpm typecheck`, `npx pnpm test`, and `npx pnpm build`.
- Manual responsive inspection was not performed in this CLI-only session.
- Unrelated archive deletion and broad PocketBase docs/import/schema changes were separated out of the working tree and preserved at `/tmp/meinteresa-archive-pocketbase-split.patch`; `git apply --check /tmp/meinteresa-archive-pocketbase-split.patch` passed.
- A fresh resilience audit reported no findings after separation; the remaining `docs/pocketbase-public-lists-collection.json` diff is limited to the scoped `items: []` help text.
- A pre-commit readability review found duplicated owner username fallback logic and a missing create-screen hook dependency; the shared helper fix was re-reviewed with no findings.
- Live PocketBase create rejected a payload containing `description: null`; create payloads now omit absent optional text fields, matching PocketBase text field expectations.
