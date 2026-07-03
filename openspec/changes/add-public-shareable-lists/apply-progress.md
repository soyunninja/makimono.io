# Apply Progress: Add Public Shareable Lists

## Slice

- Current slice: PR 3 / Phase 3 — Authenticated Publish Entry Point.
- Delivery strategy: chained PRs, stacked-to-main.
- Mode: Standard (`strict_tdd: false`).

## Completed Tasks

- [x] 1.1 Added public list aggregate types and slug/namespace helpers.
- [x] 1.2 Extended public profile helpers with privacy-safe owner projection, avatar URL, initial, and email-prefix fallback behavior.
- [x] 1.3 Added the public list repository contract and in-memory test helper with no import/copy/edit/social methods.
- [x] 1.4 Added PocketBase public list payload/projection mapping and owner-namespace plus slug lookup contract.
- [x] 1.5 Added `public_lists` PocketBase schema/rule evidence to `docs/pocketbase-collections.json`.
- [x] 2.1 Added a read-only public list page with title, date, description, items, owner name, avatar image, and gradient initial fallback.
- [x] 2.2 Added the unauthenticated `/u/$username/lista/$slug` route with public repository lookup and not-found rendering; it is not wrapped in `PocketBaseAuthGate`.
- [x] 2.3 Added EN/ES public list labels, empty/not-found copy, and privacy-safe owner/avatar copy.
- [x] 3.1 Added an authenticated-only dashboard publish entry point in the private dashboard context.
- [x] 3.2 Wired dashboard publishing to `PublicListRepository.publishList()` using the currently visible display-only item projection while leaving private source records untouched.
- [x] 3.3 Kept import, copy, public editing, comments, likes, follows, social graph, and collaboration controls absent from the public page and dashboard publish flow.
- [x] 4.1 Added route-part normalization and collision behavior coverage.
- [x] 4.2 Added privacy projection coverage for public list mapping.
- [x] 4.3 Added owner projection coverage for username, email-prefix fallback, avatar image, and gradient initial fallback.
- [x] 4.4 Added route/page behavior coverage for `/u/ana/lista/summer-books`, missing list not-found, read-only item rendering, absent out-of-scope actions, avatar image, and gradient initial fallback.
- [x] 4.5 Added publish coverage for PocketBase authenticated creation, unauthenticated rejection, deterministic collision handling, dashboard email-prefix namespace fallback, optional empty description submission, and private source preservation.
- [x] 4.6 Verified schema/rule evidence includes public-read-only published records and owner-only writes.
- [x] 4.7 Ran the required automated verification commands for slices 1 through 3.

## Verification

- `node -e "JSON.parse(require('fs').readFileSync('docs/pocketbase-collections.json','utf8')); console.log('pocketbase collections json ok')"` — passed.
- `npx pnpm test src/features/items/public-list-types.test.ts src/features/items/public-list-repository.test.ts src/features/items/pocketbase-public-list-repository.test.ts src/features/auth/public-profile.test.ts` — passed, 17 tests.
- `npx pnpm test src/test/routes/public-list-route.test.tsx src/lib/pocketbase.test.ts` — passed, 15 tests.
- `npx pnpm test src/features/items/public-list-repository.test.ts src/features/items/pocketbase-public-list-repository.test.ts src/features/items/dashboard-screen.test.tsx` — passed, 3 files / 45 tests.
- `npx pnpm test src/features/items/dashboard-screen.test.tsx` — passed after the optional-description gate-review fix, 1 file / 35 tests.
- `npx pnpm test src/features/items/public-list-repository.test.ts src/features/items/pocketbase-public-list-repository.test.ts src/features/items/dashboard-screen.test.tsx` — passed after the optional-description gate-review fix, 3 files / 45 tests.
- `npx pnpm typecheck` — passed.
- `npx pnpm typecheck` — passed after the optional-description gate-review fix.
- `npx pnpm test` — passed after the optional-description gate-review fix, 32 files / 257 tests.
- `npx pnpm build` — passed after the optional-description gate-review fix.
- Manual mobile/desktop inspection was not performed for the new responsive public list page in this slice; responsive behavior is limited to source-level Tailwind review plus route/page behavior tests in jsdom.

## Deviations

- None. The public aggregate remains separate from the private `InterestRepository`; the public route is unauthenticated/read-only, and the dashboard publish flow only creates a read-only projection without import/copy, editing, comments, likes, follows, social, or collaboration behavior.

## Notes and Risks

- The minimal PocketBase client now forwards `filter` options and can serve unauthenticated public list reads outside browser-only auth flows.
- `docs/pocketbase-collections.json` stores schema/rule evidence only; applying those rules to a live PocketBase instance remains an operational step.
- The dashboard publish entry point publishes the currently visible filtered dashboard items; it does not add per-item selection, import, copy, or public editing behavior.

## Next Slice

- Run verification for the full `add-public-shareable-lists` change and archive after approval.
