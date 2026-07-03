# Tasks: Compose Public Lists

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 700-950 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 repository/persistence → PR 2 create route/screen → PR 3 editor/add-interest UI if PR 2 grows |
| Delivery strategy | auto-forecast |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Managed repository contract, PocketBase adapter, snapshot mapper, owner-scope tests | PR 1 | Independent foundation; keep `publishList` unchanged. |
| 2 | `My public lists` create entry, create route/screen, route generation, tests | PR 2 | Depends on PR 1; verifies create success/failure. |
| 3 | Owner editor route/screen, eligible-interest add flow, public read-only guard tests | PR 3 | Depends on PR 1/2; split only if PR 2 exceeds budget. |

## Phase 1: Repository Foundation

- [x] 1.1 Add managed create/load/update types and methods in `src/features/items/public-list-repository.ts`, preserving `publishList` behavior.
- [x] 1.2 Create `src/features/items/public-list-item-mapper.ts` for eligible `InterestItem` to public snapshot mapping with append/no-duplicate support.
- [x] 1.3 Extend `src/features/items/pocketbase-public-list-repository.ts` with owner/id filtered create, load, update, safe projections, and recoverable errors.
- [x] 1.4 Test owner-scoped create/load/update, owner mismatch denial, slug collision, safe projections, and failed update preserving committed items in repository tests.

## Phase 2: Create Flow

- [x] 2.1 Update `src/features/items/my-public-lists-screen.tsx` with create CTA and manage links to `/dashboard/public-lists/$listId`.
- [x] 2.2 Create `src/features/items/public-list-create-screen.tsx` with form validation, loading, success navigation, and recoverable failure state.
- [x] 2.3 Add guarded `src/routes/dashboard.public-lists.new.tsx`; regenerate router output with tooling, not by hand-editing `src/routeTree.gen.ts`.
- [x] 2.4 Add i18n keys in `src/i18n/dictionaries.ts` for create labels, pending, success, empty, and error copy.
- [x] 2.5 Test create CTA, successful owner-scoped creation, creation failure, and list visibility under current user only.

## Phase 3: Owner Editor

- [x] 3.1 Create guarded `src/routes/dashboard.public-lists.$listId.tsx` loading only the authenticated owner’s managed list.
- [x] 3.2 Create `src/features/items/public-list-editor-screen.tsx` for saved details, empty state, eligible current-user interests, add-interest, loading, and error states.
- [x] 3.3 Persist add-interest via `updateManagedList` after success only; keep prior committed membership on failure.
- [x] 3.4 Test non-owner denial, eligible current-user interests only, add success, add failure preserving state, and saved update visibility.

## Phase 4: Boundaries and Verification

- [x] 4.1 Add route/public page tests proving `/u/$username/lista/$slug` remains read-only with no edit, import/copy, social, delete, or collaboration controls.
- [x] 4.2 Verify no import/copy from other users, no comments/likes/follows, no delete/unpublish, and no advanced ordering beyond append/no-duplicate behavior.
- [x] 4.3 Run `npx pnpm test`, `npx pnpm typecheck`, and `npx pnpm build`; document any manual inspection limits in apply progress or handoff.
