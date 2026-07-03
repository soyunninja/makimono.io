# Exploration: compose-public-lists

### Current State
`My public lists` already exists as a dedicated authenticated section at `/dashboard/public-lists`, rendered through `AppShell` and backed by `listMine()`. It currently only lists published public lists and links out to the public read-only route `/u/{username}/lista/{slug}`.

The public-list model is still a read/publish shape:
- `PublicListRepository` only exposes `publishList`, `getByOwnerAndSlug`, and `listMine`.
- PocketBase persistence only supports creating published records and reading them back.
- There is no managed list create/update/editor flow for adding interests after creation.

### Affected Areas
- `src/features/items/my-public-lists-screen.tsx` — add the create CTA and entry point into the managed list flow.
- `src/features/items/public-list-repository.ts` — extend the contract for managed create/edit operations.
- `src/features/items/pocketbase-public-list-repository.ts` — implement the PocketBase write path for managed list creation/update.
- `src/routes/dashboard.public-lists.tsx` — likely needs a child route structure for create/detail/editor.
- `src/routes/u.$username.lista.$slug.tsx` — keep the public read-only route separate from the editor.
- `src/features/items/public-list-page.tsx` — likely remains read-only; do not overload it with editing.
- `src/features/items/dashboard-screen.tsx` — keep the dashboard publish bridge temporary, not the primary composer.
- `src/i18n/dictionaries.ts` — add copy for create/detail/editor states and actions.
- `src/test/routes/*` and `src/features/items/*.test.tsx` — cover new create/edit flows and privacy boundaries.

### Approaches
1. **Repo-first managed list slice** — add a managed-list create/update contract and PocketBase write support first, then wire the UI/editor.
   - Pros: smallest safe boundary for the data model shift; isolates PocketBase persistence risk; keeps public route unchanged.
   - Cons: users still cannot create from the page until the follow-up UI slice lands.
   - Effort: Medium

2. **Single end-to-end composer/editor slice** — add the My public lists CTA, create route, detail/editor route, and item-add UI together.
   - Pros: delivers the requested user flow in one pass.
   - Cons: likely exceeds the 400-line review budget; mixes persistence, routing, and UI changes; harder rollback.
   - Effort: High

### Recommendation
Do **repo-first**, then UI/editor. The safest next slice is to introduce a dedicated managed public-list write path (create + update) and a loadable editor shell, while keeping the public `/u/{username}/lista/{slug}` page read-only. Do **not** treat header/shell changes as a prerequisite; `My public lists` already renders inside `AppShell`, so only adjust chrome if later UX review proves the current header is not sufficient.

### Risks
- The current `publishList` API is tied to the dashboard publish bridge; reusing it for composition would keep the wrong mental model alive.
- Adding item editing probably needs new PocketBase write semantics for the public-lists collection, not just UI changes.
- A combined create+editor change will likely exceed the 400-line review budget unless split into chained slices.

### Ready for Proposal
Yes — but the proposal should explicitly split managed-list persistence from the editor UI so the first implementation slice stays reviewable.
