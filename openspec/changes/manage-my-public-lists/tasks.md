# Tasks: Manage My Public Lists

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 350-500 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 repository contract/tests → PR 2 route, UI, i18n, navigation/tests |
| Delivery strategy | auto-forecast |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Owner-scoped management repository projection | PR 1 | Include repository privacy/owner tests. |
| 2 | Authenticated management route and screen | PR 2 | Depends on PR 1; include route/state tests. |

## Phase 1: Repository Contract

- [x] 1.1 Add `PublicListManagementSummary` and `listMine()` to `src/features/items/public-list-repository.ts`, keeping publish/public lookup behavior unchanged.
- [x] 1.2 Update `createInMemoryPublicListRepository` to return only current-owner published summaries for `listMine()` without exposing items or auth/private fields.
- [x] 1.3 Add `listMine()` to `src/features/items/pocketbase-public-list-repository.ts` using `published = true && owner = "{ownerId}"`, sorted by `-publishedAt`.

## Phase 2: Management Route and UI

- [ ] 2.1 Create `src/features/items/my-public-lists-screen.tsx` with loading, empty, error, and content states plus `/u/{ownerNamespace}/lista/{slug}` route target display.
- [ ] 2.2 Create guarded route `src/routes/dashboard.public-lists.tsx` using `PocketBaseAuthGate` and `MyPublicListsScreen`.
- [ ] 2.3 Update `src/routes/dashboard.tsx` so `/dashboard/public-lists` renders as a full-page dashboard-adjacent replacement.
- [ ] 2.4 Update `src/components/app/dashboard-overflow-menu.tsx` with a `My public lists` item hidden when active.
- [ ] 2.5 Update `src/i18n/dictionaries.ts` with EN/ES labels for menu, title, loading, empty, error, fallback description, and URL action.
- [ ] 2.6 Adjust `src/features/items/dashboard-screen.tsx` copy to keep dashboard publish de-emphasized as a temporary bridge.

## Phase 3: Tests

- [x] 3.1 Extend `src/features/items/public-list-repository.test.ts` for summary shape, unpublished exclusion, namespace mismatch exclusion, and privacy-safe data.
- [x] 3.2 Extend `src/features/items/pocketbase-public-list-repository.test.ts` to assert owner-relation filtering, no `ownerNamespace` management filter, sorting, and private-field stripping.
- [ ] 3.3 Add `src/features/items/my-public-lists-screen.test.tsx` for loading, empty, error, content URL, and absence of composer/import/edit/social/draft/unpublish/delete actions.
- [ ] 3.4 Extend `src/test/routes/dashboard-nested-routes.test.tsx` for auth blocking, dedicated `/dashboard/public-lists` rendering, overflow navigation, and active-view hiding.

## Phase 4: Verification

- [ ] 4.1 Run `npx pnpm test`, `npx pnpm typecheck`, and `npx pnpm build`.
- [ ] 4.2 Update this file during apply with completed tasks and any chain decision used.
