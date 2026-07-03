# Apply Progress: Rich Public List Composer

## PR Boundary

- PR: 1 / Slice 1
- Work unit: Composer extraction + mapper foundation
- Chain strategy: stacked-to-main
- Scope: reusable rich composer values, public-list mapping helpers, and focused tests only
- Out of scope: public-list editor rich snapshots, public display modes, copy-to-dashboard UI/action

## Mode

Standard mode. Strict TDD is disabled by `openspec/config.yaml` and `sdd-init/makimono.io`.

## Completed Tasks

- [x] 1.1 Extracted `RichInterestFormValues` and `RichInterestComposer` in `src/features/items/add-flow.tsx`; `AdaptiveAddFlow` remains the private-dashboard wrapper that writes through `InterestRepository.createItem`.
- [x] 1.2 Added `RichInterestFormValues -> PublicListItem`, `PublicListItem -> CreateInterestItemInput`, and duplicate-match helpers in `src/features/items/public-list-item-mapper.ts`.
- [x] 1.3 Added focused composer/mapper tests for trim behavior, tags, cover metadata preservation, pending dashboard create input, duplicate matching, and existing dashboard add behavior.

## Verification

| Command | Result |
|---------|--------|
| `npx pnpm test src/features/items/add-flow.test.tsx src/features/items/public-list-item-mapper.test.ts` | Passed: 2 files, 25 tests |
| `npx pnpm typecheck` | Passed |

## Changed Files

- `src/features/items/add-flow.tsx` — extracted reusable rich composer contract and kept `AdaptiveAddFlow` as the dashboard repository wrapper.
- `src/features/items/add-flow.test.tsx` — added composer value-submit coverage while existing dashboard add tests continue to pass.
- `src/features/items/public-list-item-mapper.ts` — added rich snapshot, dashboard create-input, and duplicate-match helpers.
- `src/features/items/public-list-item-mapper.test.ts` — added focused mapper coverage for PR 1.
- `openspec/changes/rich-public-list-composer/tasks.md` — marked Phase 1 tasks complete.

## Remaining Tasks

- [ ] Phase 2: Public editor rich snapshots.
- [ ] Phase 3: Public page display modes.
- [ ] Phase 4: Copy to dashboard.
- [ ] Phase 5: Hardening and full verification.

## Notes

- Review budget impact is approximately 300 changed lines for this PR slice.
- No public-list editor, display-mode, or copy-to-dashboard behavior was implemented in this slice.
