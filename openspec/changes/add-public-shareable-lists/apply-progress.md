# Apply Progress: Add Public Shareable Lists

## Slice

- Current slice: PR 1 / Phase 1 — Foundation and Persistence Boundary.
- Delivery strategy: chained PRs, stacked-to-main.
- Mode: Standard (`strict_tdd: false`).

## Completed Tasks

- [x] 1.1 Added public list aggregate types and slug/namespace helpers.
- [x] 1.2 Extended public profile helpers with privacy-safe owner projection, avatar URL, initial, and email-prefix fallback behavior.
- [x] 1.3 Added the public list repository contract and in-memory test helper with no import/copy/edit/social methods.
- [x] 1.4 Added PocketBase public list payload/projection mapping and owner-namespace plus slug lookup contract.
- [x] 1.5 Added `public_lists` PocketBase schema/rule evidence to `docs/pocketbase-collections.json`.
- [x] 4.1 Added route-part normalization and collision behavior coverage.
- [x] 4.2 Added privacy projection coverage for public list mapping.
- [x] 4.3 Added owner projection coverage for username, email-prefix fallback, avatar image, and gradient initial fallback.
- [x] 4.6 Verified schema/rule evidence includes public-read-only published records and owner-only writes.
- [x] 4.7 Ran the required automated verification commands for this slice.

## Verification

- `node -e "JSON.parse(require('fs').readFileSync('docs/pocketbase-collections.json','utf8')); console.log('pocketbase collections json ok')"` — passed.
- `npx pnpm test src/features/items/public-list-types.test.ts src/features/items/public-list-repository.test.ts src/features/items/pocketbase-public-list-repository.test.ts src/features/auth/public-profile.test.ts` — passed, 17 tests.
- `npx pnpm typecheck` — passed.
- `npx pnpm test` — passed, 31 files / 247 tests.
- `npx pnpm build` — passed.

## Deviations

- None. The public aggregate remains separate from the private `InterestRepository`, and no public route, publish UI, import/copy, editing, comments, likes, follows, social, or collaboration behavior was implemented.

## Notes and Risks

- The PocketBase lookup contract includes a `filter` option that the minimal app client does not currently forward. This is acceptable for the mapper/repository boundary slice, but the next route/persistence slice must extend the minimal PocketBase client or use an equivalent filtered lookup before wiring runtime reads.
- `docs/pocketbase-collections.json` stores schema/rule evidence only; applying those rules to a live PocketBase instance remains an operational step.

## Next Slice

- PR 2 / Phase 2: public read route and read-only presentation, using the repository boundary from this slice.
