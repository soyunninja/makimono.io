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

## Changed Files

- `src/features/items/add-flow.tsx` — extracted reusable rich composer contract, kept `AdaptiveAddFlow` as the dashboard repository wrapper, and added optional composer title, submit label, and in-drawer status/alert props for public editor reuse.
- `src/features/items/add-flow.test.tsx` — added composer value-submit coverage while existing dashboard add tests continue to pass.
- `src/features/items/public-list-item-mapper.ts` — added rich snapshot, dashboard create-input, and duplicate-match helpers.
- `src/features/items/public-list-item-mapper.test.ts` — added focused mapper coverage for PR 1.
- `src/features/items/public-list-editor-screen.tsx` — replaced the minimal list-only form with the rich composer/drawer, list-only snapshot persistence through `updateManagedList`, and saved snapshot removal through `updateManagedList({ items: nextItems })` without private interest mutation.
- `src/features/items/public-list-editor-screen.test.tsx` — extended editor coverage for rich snapshots, no private creates, failure rollback, existing-interest add behavior, removal success, removal rollback, and no private repository delete/update during removal.
- `src/i18n/dictionaries.ts` — updated public editor copy for the rich list-only composer entry point, add/remove states, and feedback.
- `openspec/changes/rich-public-list-composer/proposal.md` — documented public-list membership removal scope and dashboard mutation exclusion.
- `openspec/changes/rich-public-list-composer/specs/public-list-composition/spec.md` — added removal success/failure scenarios and clarified exclusions.
- `openspec/changes/rich-public-list-composer/design.md` — documented removal data flow, failure handling, and private-dashboard boundary.
- `openspec/changes/rich-public-list-composer/tasks.md` — marked Phase 1, Phase 2, and the PR 2 removal extension task complete.

## Remaining Tasks

- [ ] Phase 3: Public page display modes.
- [ ] Phase 4: Copy to dashboard.
- [ ] Phase 5: Hardening and full verification.

## Notes

- PR 1 review budget impact was approximately 300 changed lines.
- PR 2 review budget impact is approximately 200 changed lines (`99 insertions`, `100 deletions`) before OpenSpec artifact updates.
- New public-list editor rich items are snapshots only; this slice does not create dashboard/private `InterestItem` records from the public editor.
- Removing a saved public-list item updates only public-list membership snapshots; it does not call private dashboard interest create/update/delete APIs.
- Public display modes and copy-to-dashboard remain unimplemented for later slices.
