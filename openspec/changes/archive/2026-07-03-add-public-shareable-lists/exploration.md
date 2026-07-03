## Exploration: Add public shareable lists

### Current State
The app is still item-centric. `src/features/items/types.ts` defines a single `InterestItem` model and `InterestRepository` for private, per-user lists; the PocketBase implementation in `src/features/items/pocketbase-repository.ts` always scopes writes to the authenticated user.

Public identity already exists, but only as a safe subset: `src/features/auth/public-profile.ts` exposes `username` and `avatarUrl`, and `src/features/settings/settings-screen.tsx` renders that inside authenticated settings. There is no public profile route, no shareable list route, and no list-level visibility model yet.

### Affected Areas
- `src/features/items/types.ts` — current domain is single-user interest items; likely needs a separate list aggregate and/or item snapshot type.
- `src/features/items/pocketbase-repository.ts` — today it hardcodes `user` ownership and private CRUD; shareable lists should not be forced through this repository.
- `src/features/items/app-interest-repository.ts` — selects the private PocketBase repository; a list repo would need a parallel selector.
- `src/routes/dashboard.tsx`, `src/routes/dashboard.add.tsx`, `src/routes/dashboard.archive.tsx`, `src/routes/dashboard.settings.tsx` — current route surface is private dashboard-only; public list routes do not exist.
- `src/features/settings/settings-screen.tsx` — likely place for future “publish/share list” entry points while the owner stays in authenticated context.
- `src/features/auth/public-profile.ts` and `src/features/auth/pocketbase-auth-provider.tsx` — public list pages will need the existing public username/avatar boundary, but must not expose email or private auth data.
- `src/i18n/dictionaries.ts` — new copy for publish/share/import actions, public list labels, empty states, and permission errors.
- `src/test/routes/*` and feature tests — current route/component tests will need new coverage for public access, privacy boundaries, and list ownership rules.

### Approaches
1. **Foundation slice: public list metadata + read-only public page** — add a new list aggregate (for example `public_lists` plus a list-item relation/snapshot table), a public route that renders a list by slug, and a simple owner action to publish/unpublish. Defer cloning/import and selected-item add flows.
   - Pros: smallest safe step; keeps private `interests` untouched; establishes the public URL and privacy boundary first.
   - Cons: users can view/share before they can import items from the list.
   - Effort: Medium

2. **Full share/import slice** — create the public list model, public page, and immediate import UX that can copy the whole list or selected items into the current user’s private interests.
   - Pros: delivers the end-user promise in one pass.
   - Cons: wider schema, routing, permissions, and UI surface; higher risk of crossing the 400-line review budget.
   - Effort: High

### Recommendation
Start with Approach 1. Add a dedicated list aggregate and a public read-only page first, with a publish toggle owned by the authenticated user. Keep import/cloning out of scope for the first slice; once the public URL and permission model are stable, add “copy entire list” and “copy selected items” as a second change.

Non-goals for the first slice: no public email exposure, no editable public list pages, no social graph/following, no comments/likes, no multi-owner collaboration, and no automatic import of public items into the dashboard.

### Risks
- Reusing the existing `interests` collection would blur privacy boundaries and make future public/private separation harder.
- If the first slice includes import UX too early, schema and routing work will likely exceed the review budget.
- Public page slugs/IDs need a stable uniqueness rule; otherwise shared links will be brittle.
- Copying items across users may require snapshot semantics so later edits to the source list do not silently mutate imports.

### Ready for Proposal
Yes. The next phase should propose the minimal public-list foundation: schema + repository shape + public read route + publish toggle, with import kept for a follow-up slice.
