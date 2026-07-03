# Apply Progress: Add Public Shareable Lists

## Slice

- Current slice: PR 2 / Phase 2 — Public Read UI and Routing.
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
- [x] 4.1 Added route-part normalization and collision behavior coverage.
- [x] 4.2 Added privacy projection coverage for public list mapping.
- [x] 4.3 Added owner projection coverage for username, email-prefix fallback, avatar image, and gradient initial fallback.
- [x] 4.4 Added route/page behavior coverage for `/u/ana/lista/summer-books`, missing list not-found, read-only item rendering, absent out-of-scope actions, avatar image, and gradient initial fallback.
- [x] 4.6 Verified schema/rule evidence includes public-read-only published records and owner-only writes.
- [x] 4.7 Ran the required automated verification commands for slices 1 and 2.

## Verification

- `node -e "JSON.parse(require('fs').readFileSync('docs/pocketbase-collections.json','utf8')); console.log('pocketbase collections json ok')"` — passed.
- `npx pnpm test src/features/items/public-list-types.test.ts src/features/items/public-list-repository.test.ts src/features/items/pocketbase-public-list-repository.test.ts src/features/auth/public-profile.test.ts` — passed, 17 tests.
- `npx pnpm test src/test/routes/public-list-route.test.tsx src/lib/pocketbase.test.ts` — passed, 15 tests.
- `npx pnpm typecheck` — passed.
- `npx pnpm test` — passed, 32 files / 252 tests.
- `npx pnpm build` — passed.

## Deviations

- None. The public aggregate remains separate from the private `InterestRepository`; the public route is unauthenticated/read-only, and no publish UI, import/copy, editing, comments, likes, follows, social, or collaboration behavior was implemented.

## Notes and Risks

- The minimal PocketBase client now forwards `filter` options and can serve unauthenticated public list reads outside browser-only auth flows.
- `docs/pocketbase-collections.json` stores schema/rule evidence only; applying those rules to a live PocketBase instance remains an operational step.

## Next Slice

- PR 3 / Phase 3: authenticated publish entry point and localized publish copy.
