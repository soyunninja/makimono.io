## Exploration: Manage my public lists

### Current State
The app already has a public-list foundation: `PublicListRepository.publishList()` creates `public_lists` records, `src/routes/u.$username.lista.$slug.tsx` renders the read-only public page, and `src/features/items/dashboard-screen.tsx` exposes a publish action from the private dashboard.

That existing publish flow still copies the currently visible dashboard items into a public projection. It is a valid technical bridge, but it does not match the clarified product model: a public list should be a separate user-managed list, not a mirror of the dashboard.

The PocketBase collection already supports the next management slice without schema changes if we keep it published-only: `listRule`/`viewRule` allow `published = true`, the `owner` relation is hidden from public responses, and the collection already has a unique `ownerNamespace + slug` index plus an authenticated owner rule for writes.

### Affected Areas
- `src/features/items/public-list-repository.ts` — needs a new owner-scoped read/list contract for the management view; current contract only supports publish + public lookup.
- `src/features/items/pocketbase-public-list-repository.ts` — needs the PocketBase query for the owner’s public lists; current adapter only supports publish and public lookup by namespace + slug.
- `src/features/items/dashboard-screen.tsx` — current publish button is the wrong primary mental model; it should stay as temporary infrastructure or be hidden from the main dashboard once the new section exists.
- `src/components/app/dashboard-overflow-menu.tsx` — likely place for a navigation entry into the new `My public lists` area.
- `src/routes/dashboard.*.tsx` / new `src/routes/dashboard.public-lists.tsx` — likely route surface for the dedicated section.
- `src/features/items/public-list-page.tsx` — unchanged for now; still the public read target.
- `src/i18n/dictionaries.ts` — needs copy for the new section, empty state, and management actions.
- `docs/pocketbase-collections.json` — likely no change for the first slice if the section only lists published records; would need updates only if drafts/unpublish semantics are added.

### Approaches
1. **Published lists index only** — add a dedicated `My public lists` route/section that lists the authenticated user’s published public lists and links to each public URL.
   - Pros: smallest safe slice; uses existing PocketBase rules; no schema migration; aligns with the new product direction.
   - Cons: does not yet let users build a public list item-by-item; management is read-only.
   - Effort: Low/Medium

2. **Full management slice** — add the index plus unpublish/delete/edit actions and a list-composer entry point.
   - Pros: closer to the eventual product shape.
   - Cons: wider repository/UI/rule surface; higher risk of exceeding the 400-line review budget.
   - Effort: High

### Recommendation
Start with Approach 1: create a dedicated authenticated `My public lists` section that shows the user’s published lists, their public URLs, and basic metadata only.

Keep the current dashboard publish entry point as a temporary technical bridge, but do not make it the primary UX for public lists. It should be de-emphasized or hidden from the main dashboard once the new section ships, then refactored later into the eventual item-picker flow.

Non-goals for this slice: no item-by-item composer, no copying from another user’s list, no importing selected items, no comments/likes/follows, and no public editing surface.

### Risks
- If we include drafts or unpublish controls now, the PocketBase rules and repository contract will grow quickly.
- The current publish button can keep reinforcing the wrong mental model if it remains prominent too long.
- Listing by owner must use the stored owner relation, not the current username-derived namespace, or profile changes could make management inconsistent.
- Copy/import work will likely need additional snapshot semantics later so source edits do not mutate imported content.

### Ready for Proposal
Yes. The next phase should propose the smallest `My public lists` index slice: owner-scoped list retrieval, dedicated route/section, and navigation copy, with compose/import kept out of scope.
