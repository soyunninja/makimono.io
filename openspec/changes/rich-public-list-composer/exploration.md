## Exploration: rich-public-list-composer

### Current State
- The dashboard already has a full item drawer flow in `src/features/items/add-flow.tsx` that handles title, category, notes, tags, and cover metadata, backed by `InterestRepository.createItem` / `updateItem`.
- Dashboard items already support three display modes: `cards`, `list`, and `covers` via `src/features/items/dashboard-display-preference.ts`, `src/features/items/dashboard-display-preference-control.tsx`, and the render branches in `src/features/items/dashboard-screen.tsx`.
- Public lists currently render read-only cards in `src/features/items/public-list-page.tsx`; they show title, cover, notes, tags, and category metadata, but no authenticated action.
- The current public-list editor in `src/features/items/public-list-editor-screen.tsx` is still a lightweight list manager: it can add existing dashboard interests to the public list and create list-only snapshots with just category + title + empty tags.
- Public list data already preserves rich item fields. `PublicListItem` includes category, title, notes, tags, and cover metadata; `InterestItem` additionally includes status, createdAt, and deletedAt.
- The PocketBase `public_lists.items` field is already schema-optional (`required: false`) in `docs/pocketbase-public-lists-collection.json`, so empty lists are allowed.
- Public route loading is already public by design: `src/routes/u.$username.lista.$slug.tsx` creates a runtime public-list repository with `ownerId: ''`, so unauthenticated users can read the page.

### Affected Areas
- `src/features/items/add-flow.tsx` — canonical drawer/form behavior to reuse for rich public-list composition.
- `src/features/items/public-list-editor-screen.tsx` — current public-list owner editor; likely needs replacement or deep reuse of the dashboard drawer form.
- `src/features/items/public-list-page.tsx` — public read-only page that needs three display modes and per-item copy actions.
- `src/features/items/dashboard-screen.tsx` — source of the three display modes and item rendering patterns.
- `src/features/items/dashboard-display-preference.ts` — shared preference model for cards/list/covers.
- `src/features/items/dashboard-list-item.tsx`, `src/features/items/interest-card.tsx`, `src/features/items/dashboard-cover-item.tsx` — item renderers to adapt for read-only public list display.
- `src/features/items/public-list-types.ts` — shared public item shape and mapping constraints.
- `src/features/items/public-list-repository.ts`, `src/features/items/pocketbase-public-list-repository.ts` — public list persistence and schema mapping; useful for copy/create flows and payload normalization.
- `src/routes/u.$username.lista.$slug.tsx` — public route loader stays public; auth should only gate the copy action.
- `docs/pocketbase-public-lists-collection.json` — confirms `items` is optional and public write rules still enforce owner-only mutations.

### Approaches
1. **Extract a shared rich item form and reuse it in both dashboard and public-list composition** — factor the drawer/form fields into a shared feature component, then plug dashboard create/edit and public-list-only composition into different submit handlers.
   - Pros: single source of truth for title/cover/notes/tags/category; matches user intent exactly; lowers long-term drift.
   - Cons: requires careful API design so the same form can target dashboard interests or public-list snapshots.
   - Effort: High

2. **Build a public-list-specific rich composer that mirrors the dashboard drawer without fully sharing the component** — keep the dashboard drawer intact and create a public-list variant that duplicates the field set and submits to public-list management.
   - Pros: lower risk to existing dashboard behavior; easier to isolate public-list-only rules.
   - Cons: duplicated UI/validation logic; likely to drift from the dashboard drawer over time.
   - Effort: Medium

3. **Adapt the public list page first, then incrementally align the composer** — start with three display modes and copy-to-dashboard actions on the public page, then later unify the composer UI.
   - Pros: delivers visible user value quickly.
   - Cons: does not satisfy the “same drawer/form” requirement by itself; could create temporary inconsistencies.
   - Effort: Medium

### Recommendation
Use a shared rich item-form abstraction for the drawer fields, then compose it into the dashboard add/edit flow and the public-list-only composer. Keep the public route public for reads, and gate only the copy-to-dashboard action with auth (prompt login if needed). Reuse the existing dashboard display-preference model and item renderers for the public list page so the three-mode experience stays consistent.

### Risks
- The current public-list editor is structurally different from the dashboard drawer, so the refactor may touch both the composer and the page-level editor flow.
- Public-list items do not have dashboard status fields; copying to the dashboard must map them to `pending` cleanly without leaking public-only IDs or assumptions.
- The public page currently has no action layer or auth awareness, so the copy action likely needs a new authenticated wrapper.
- Display-mode reuse may require a lighter-weight read-only item renderer to avoid bringing completion/edit interactions into public pages.

### Ready for Proposal
Yes — the exploration is clear enough to write a scoped proposal and slice the work into composer reuse, public-page display reuse, and authenticated copy action pieces.
