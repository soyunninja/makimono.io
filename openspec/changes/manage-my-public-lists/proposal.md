# Proposal: Manage My Public Lists

## Intent

Give authenticated users a dedicated place to see and manage their published public lists. Public lists are separate managed lists, not a dashboard mirror; the existing dashboard publish button remains only a temporary bridge while the product model moves toward list-specific management.

## Scope

### In Scope
- Authenticated `My public lists` section/index for the current user's published lists.
- Owner-scoped retrieval by stored owner relation, not username-derived namespace.
- Public URL display/copy target for each list, using the existing username-plus-slug public route.
- Empty/loading/error states and navigation copy for the new section.
- Privacy boundary: management reads are owner-only; public display does not expose full email, auth IDs, provider metadata, sessions, tokens, or private profile data.

### Out of Scope
- Item-by-item public list composer.
- Import/copy from public lists or selected items.
- Public editing, comments, likes, follows, collaboration, drafts, unpublish, delete, or schema changes.
- Making dashboard publish the long-term composer UX.

## Capabilities

### New Capabilities
- `my-public-lists`: Authenticated owner-scoped public-list index, public URL visibility, section navigation, and management/privacy boundaries.

### Modified Capabilities
- None.

## Approach

Extend the public-list repository with a read-only `listMine`-style contract for the authenticated owner. Query PocketBase by owner relation and `published = true`, reusing existing schema/rules and public URL generation. Add a dedicated dashboard-adjacent route/section and de-emphasize the dashboard publish flow as temporary infrastructure, not the primary product model.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/features/items/` | Modified | Owner-scoped public-list listing contract, adapter, types, and index UI. |
| `src/routes/` | New | Authenticated `My public lists` route/section. |
| `src/components/app/dashboard-overflow-menu.tsx` | Modified | Navigation entry to the new section. |
| `src/i18n/dictionaries.ts` | Modified | Section labels, empty states, errors, and URL actions. |
| `src/features/items/dashboard-screen.tsx` | Modified | Publish flow remains a temporary bridge and should not be promoted as the primary model. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Listing by namespace breaks after profile changes | Medium | Query by owner relation only. |
| Dashboard publish reinforces the wrong model | Medium | De-emphasize it and document it as temporary. |
| Private data leaks into management/public UI | Medium | Use scoped projections and tests for no full email/private auth fields. |

## Rollback Plan

Remove the new route/navigation and owner-scoped list method. Keep existing public pages and dashboard publish bridge intact, so current published-list URLs continue to work.

## Dependencies

- Existing PocketBase `public_lists` collection, owner write rules, published list/view rules, and username-plus-slug public route.

## Success Criteria

- [ ] Authenticated users can open `My public lists` and see their published public lists.
- [ ] Each row exposes the public URL for the existing public route.
- [ ] Queries are scoped by owner relation and do not expose another user's lists.
- [ ] Public and management UI avoid full email/private auth data.
- [ ] Composer/import/social/editing features remain absent.
