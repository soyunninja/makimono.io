# Apply Progress: Compose Public Lists

## Mode

- Phase: apply
- Implementation mode: Standard (strict TDD disabled by `openspec/config.yaml`)
- PR boundary: PR 3 / Slice 3 — owner editor route/screen and add-interest flow, stacked on the PR 1 repository/persistence foundation and PR 2 create flow
- Chain strategy: stacked-to-main

## Completed Tasks

- [x] 1.1 Added managed create/load/update types and in-memory repository methods while preserving `publishList` behavior.
- [x] 1.2 Added `public-list-item-mapper.ts` for `InterestItem` to `PublicListItem` snapshots with append/no-duplicate behavior.
- [x] 1.3 Extended the PocketBase public-list repository with owner/id managed create/load/update, safe payload/projection mapping, and recoverable mutation errors.
- [x] 1.4 Added repository tests for owner-scoped create/load/update, owner mismatch denial, slug collision, safe projections, and failed update preservation.
- [x] 2.1 Added a `My public lists` create CTA and per-list manage links to `/dashboard/public-lists/$listId`, while preserving public read-only URL links.
- [x] 2.2 Added `PublicListCreateScreen` with required-field validation, pending/success states, owner-scoped create calls, success navigation callback, and recoverable mutation errors.
- [x] 2.3 Added guarded `/dashboard/public-lists/new` route and regenerated `src/routeTree.gen.ts` through the TanStack Start build tooling.
- [x] 2.4 Added localized create/list-management copy for create labels, pending, success, empty, and error states in English and Spanish.
- [x] 2.5 Added behavior tests for the create CTA, owner-scoped creation, creation failure recovery, guarded create route, and current-user visibility boundaries.
- [x] 3.1 Added guarded `/dashboard/public-lists/$listId` route that renders through `PocketBaseAuthGate` and loads the managed list via the authenticated owner/id repository path.
- [x] 3.2 Added `PublicListEditorScreen` with saved list details, loading/error/denied states, empty saved-list state, eligible current-user interests, and add-interest controls.
- [x] 3.3 Wired add-interest persistence through `updateManagedList` using snapshot append/no-duplicate mapping, updating UI only from a successful repository result and preserving prior committed membership on failure.
- [x] 3.4 Added screen and route behavior tests for non-owner denial, owner-scoped route loading, eligible current-user interests, add success, add failure preservation, saved update visibility, and read-only public route boundaries.

## Verification

- `npx pnpm test src/features/items/public-list-repository.test.ts src/features/items/pocketbase-public-list-repository.test.ts` — passed before compatibility test updates.
- `npx pnpm typecheck` — failed once due existing test mocks missing the expanded repository contract; fixed mocks.
- `npx pnpm typecheck` — passed.
- `npx pnpm test src/features/items/public-list-repository.test.ts src/features/items/pocketbase-public-list-repository.test.ts src/features/items/dashboard-screen.test.tsx src/features/items/my-public-lists-screen.test.tsx src/test/routes/public-list-route.test.tsx` — passed.
- `npx pnpm build` — passed; also regenerated TanStack Router output for `/dashboard/public-lists/new`.
- `npx pnpm test src/features/items/public-list-create-screen.test.tsx src/features/items/my-public-lists-screen.test.tsx src/test/routes/dashboard-nested-routes.test.tsx` — passed.
- `npx pnpm typecheck` — passed.
- `npx pnpm test src/features/items/public-list-editor-screen.test.tsx src/test/routes/dashboard-nested-routes.test.tsx src/test/routes/public-list-route.test.tsx` — passed.
- `npx pnpm build` — passed; regenerated TanStack Router output for `/dashboard/public-lists/$listId`.
- `npx pnpm typecheck` — passed.
- `npx pnpm test` — passed.

## Deviations

None — implementation matches the Slice 1 foundation, Slice 2 create-flow scope, and Slice 3 owner editor/add-interest scope. The public read-only route remains mutation-free and does not expose edit/import/copy/social/delete/collaboration controls.

## Remaining Tasks

- [x] Phase 4 boundaries and full verification.

## Notes

- Slice 1 may exceed the nominal 400-line review budget because it includes repository contracts, PocketBase adapter behavior, mapper support, and required owner-scope tests.
- Slice 2 is limited to create navigation, create form, route generation, i18n, and focused tests. It intentionally does not implement the Phase 3 owner editor/add-interest UI.
- Slice 3 is limited to the owner editor route/screen and add-interest flow. It intentionally does not add import/copy from other users, social/collaboration features, delete/unpublish, or advanced ordering.
- Final verification passed with `npx pnpm typecheck`, `npx pnpm test`, and `npx pnpm build`; Phase 4 boundaries are complete.
