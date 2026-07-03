# Proposal: Compose Public Lists

## Intent

Make `My public lists` the authenticated place where users create public lists, enter a managed list, and add selected interests through a dedicated editor. This replaces the dashboard publish bridge as the primary composition model while keeping public read-only routes separate.

## Proposal Question Round

Assumptions for user review: first slice prioritizes managed-list create/update persistence; editor UX follows as a separate reviewable slice; public list ordering stays basic unless needed for adding interests.

## Scope

### In Scope
- Managed public-list repository contract for create, load, and update operations.
- PocketBase persistence path for owner-scoped list creation and interest membership updates.
- `My public lists` create entry point and managed detail/editor route.
- Editor flow to enter a list and add interests owned/available to the current user.
- Public read-only route remains distinct from owner management.

### Out of Scope
- Importing or copying interests/lists from other users' public lists.
- Social features: comments, likes, follows, reactions, sharing feeds, or discovery mechanics.
- Collaborative editing, permissions beyond current owner management, drafts, delete/unpublish, or analytics.
- Advanced manual ordering unless required for the first add-interests slice.

## Capabilities

### New Capabilities
- `public-list-composition`: Owner-managed public-list creation, editing entry points, interest membership updates, and privacy boundaries.

### Modified Capabilities
- None.

## Approach

Split delivery into reviewable slices. First, add a repo-first managed-list contract and PocketBase create/update adapter so composition is modeled as list management, not dashboard publishing. Then add UI/editor routes from `My public lists` to create, enter, and add interests. Keep `/u/{username}/lista/{slug}` read-only.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/features/items/public-list-repository.ts` | Modified | Add managed create/load/update contracts. |
| `src/features/items/pocketbase-public-list-repository.ts` | Modified | Persist managed public lists and interest membership. |
| `src/features/items/my-public-lists-screen.tsx` | Modified | Add create CTA and managed-list entry points. |
| `src/routes/dashboard.public-lists.tsx` | Modified | Add create/detail/editor child flow. |
| `src/features/items/public-list-page.tsx` | Unchanged | Preserve read-only public display. |
| `src/i18n/dictionaries.ts` | Modified | Add create/editor copy and states. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Scope exceeds 400-line budget | High | Split repository/persistence and UI/editor slices. |
| Dashboard publish model leaks into composer | Medium | Keep separate managed-list APIs and route names. |
| Owner/privacy mistakes in editor loading | Medium | Require owner-scoped queries and behavior tests. |

## Rollback Plan

Remove managed create/update repository methods and the new create/editor routes. Leave existing `My public lists` listing, dashboard publish bridge, and public read-only URLs intact.

## Dependencies

- Existing authenticated dashboard, PocketBase `public_lists` persistence, item domain data, and public username/slug route.

## Success Criteria

- [ ] Users can create a public list from `My public lists`.
- [ ] Users can enter their own list editor and add interests.
- [ ] Repository/persistence and UI/editor work are separable for review.
- [ ] Public read-only pages do not become editing surfaces.
