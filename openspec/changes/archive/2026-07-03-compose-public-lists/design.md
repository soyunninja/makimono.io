# Design: Compose Public Lists

## Technical Approach

Add owner-managed composition beside the existing public-list read model. `publishList` remains the dashboard bridge for the current filtered dashboard snapshot; new managed create/load/update methods own the `My public lists` composer. The editor route loads by authenticated owner relation plus list id (preferred) or slug, lets the owner add eligible current-user interests as display-only `PublicListItem` snapshots, and persists the updated `items` array without exposing mutation controls on `/u/{username}/lista/{slug}`.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|---|---|---|---|
| Managed repository API | Extend `PublicListRepository` with `createManagedList`, `getManagedList`, and `updateManagedList`; keep `publishList` unchanged. | Reuse `publishList` for create/update. | Composition is list management, not dashboard publishing, and needs owner-scoped detail updates. |
| Editor identity | Route editor by `/dashboard/public-lists/$listId`; repository filters `id = listId && owner = ownerId`. Slug lookup may exist only as a helper. | Use public `ownerNamespace + slug`. | Stored `owner` relation is stable and prevents namespace collision or username-change mistakes. |
| Interest membership | Add interests by copying eligible current-user `InterestItem` fields into `PublicListItem` snapshots and replacing the persisted list `items` array after success. | Store relations to private interests. | Public lists are display-only projections; private item changes/deletes must not leak or mutate public pages. |
| Route boundary | Create/editor routes live under authenticated `/dashboard/public-lists`; public route stays read-only. | Add edit controls to public pages. | Keeps privacy, auth, and public sharing concerns separate. |

## Data Flow

```text
/dashboard/public-lists ──create──> createManagedList(ownerId, owner projection, details, items=[])
        │                                │
        └──open /$listId ────────────────┘
                         getManagedList(ownerId + listId)
                         listItems() ──select──> snapshot PublicListItem
                         updateManagedList(ownerId + listId, items: nextSnapshots)

/u/$username/lista/$slug ──> getByOwnerAndSlug(published + namespace + slug) only
```

## File Changes

| File | Action | Description |
|---|---|---|
| `src/features/items/public-list-repository.ts` | Modify | Add managed input/result types and in-memory create/load/update methods. |
| `src/features/items/pocketbase-public-list-repository.ts` | Modify | Add `update` support, owner/id filters, managed payload builders, and safe mappers. |
| `src/features/items/public-list-item-mapper.ts` | Create | Share `InterestItem` → `PublicListItem` snapshot mapping between dashboard publish and editor add. |
| `src/features/items/my-public-lists-screen.tsx` | Modify | Add create CTA and manage links to `/dashboard/public-lists/$listId`. |
| `src/features/items/public-list-create-screen.tsx` | Create | Authenticated create form with loading/success/error states. |
| `src/features/items/public-list-editor-screen.tsx` | Create | Owner detail/editor for list fields, empty state, eligible interests, add failures, and saved state. |
| `src/routes/dashboard.public-lists.new.tsx` | Create | Guarded create route. |
| `src/routes/dashboard.public-lists.$listId.tsx` | Create | Guarded owner editor route. |
| `src/i18n/dictionaries.ts` | Modify | Add create/editor labels, empty, loading, success, and recoverable error copy. |
| Tests under `src/features/items/` and `src/test/routes/` | Modify/Create | Cover repository, screens, and route boundaries. |

## Interfaces / Contracts

```ts
type ManagedPublicListCreateInput = Pick<PublishPublicListInput, 'owner' | 'ownerNamespace' | 'slug' | 'title' | 'listDate' | 'description'> & { authenticatedOwnerId: string }
type ManagedPublicListUpdateInput = { id: string, authenticatedOwnerId: string, title?: string, slug?: string, listDate?: string, description?: string, items?: PublicListItem[] }
```

PocketBase create writes `owner`, public owner projection, normalized route parts, `published: true`, `items: []`, and `publishedAt`. Updates use `collection.update(id, payload)` only after owner-scoped load or filter validation. PocketBase rules should enforce create owner = `@request.auth.id`, list/update owner = `@request.auth.id`, and public read only when `published = true`; client filters are not security boundaries.

## Privacy / Non-Goals

Editor/public projections omit full email, auth ids, tokens, sessions, and private profile fields. Public routes never call managed mutations. “Eligible interests” means interests owned by the current authenticated user or otherwise explicitly allowed by this app’s private repository boundary; it does not include importing/copying interests from another user’s public lists. This change does not add import/copy from others, social/collab/comments/likes/follows, analytics, delete/unpublish, or advanced ordering beyond append/no-duplicate behavior required for add-interest.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | Managed create/load/update, owner mismatch denial, slug collision, failed update preserving committed items, snapshot mapper. | Extend `public-list-repository.test.ts` and `pocketbase-public-list-repository.test.ts`. |
| Integration | Create CTA, create success/failure, editor loading/empty/error, add interest success/failure, no public-route edit controls. | Add screen tests and route tests with mocked repositories/auth. |
| Verification | Project safety. | Run `npx pnpm test`, `npx pnpm typecheck`, and `npx pnpm build`. |

## Review Budget / Slices

400-line budget risk: High. Slice 1: repo-first managed contracts, PocketBase adapter, mapper, and unit tests. Slice 2: `My public lists` create entry, create/editor routes/screens, i18n, and integration tests. If Slice 2 exceeds budget, split create flow before editor add-interest UI.

## Migration / Rollout

No data migration required. Existing records already store `owner`, route fields, and snapshot `items`; new managed lists can start with an empty `items` array. Regenerate route files through router tooling only; do not hand-edit `src/routeTree.gen.ts`.

## Open Questions

None.
