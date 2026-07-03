# Design: Manage My Public Lists

## Technical Approach

Add a dashboard-adjacent, authenticated `My public lists` route that lists the current user's published public-list records without reusing the dashboard item list. The route reads through the existing public-list repository boundary, extended with an owner-scoped management list method. PocketBase queries MUST filter by the stored `owner` relation and `published = true`; `ownerNamespace` remains only the public URL segment for `/u/{username}/lista/{slug}`.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|---|---|---|---|
| Route shape | Add `src/routes/dashboard.public-lists.tsx` for `/dashboard/public-lists`, guarded with `PocketBaseAuthGate`. Update `src/routes/dashboard.tsx` to treat it like archive/settings full-page replacements. | Overlay inside `DashboardRouteShell`; unauthenticated public route. | The spec requires a dedicated authenticated section separate from dashboard items. |
| Navigation | Add a `My public lists` item to `DashboardOverflowMenu`; hide it when `currentView` is the public-lists page. | Primary header button; settings-only link. | Overflow keeps the dashboard publish bridge de-emphasized and matches archive/settings navigation. |
| Repository contract | Extend `PublicListRepository` with `listMine(): Promise<PublicListManagementSummary[]>`. The summary includes `id`, `title`, `listDate`, optional `description`, `ownerNamespace`, `slug`, `publishedAt`, and optional `updatedAt`; it excludes owner auth IDs and item payloads. | Reuse `getByOwnerAndSlug`; expose full `PublicList[]`. | Owner management needs a list query, while summaries reduce private-data and payload surface. |
| PocketBase query | `createPocketBasePublicListRepository({ ownerId })` implements `listMine` with `filter: 'published = true && owner = "{ownerId}"'`, sorted by `-publishedAt`; adapter map strips fields outside the summary. | Filter by `ownerNamespace`; derive namespace from profile. | Stored relation is stable across username changes and prevents namespace collision access. |

## Data Flow

```text
/dashboard/public-lists
  └─ PocketBaseAuthGate
     └─ MyPublicListsScreen
        └─ createPocketBasePublicListRepository(ownerId=user.id)
           └─ public_lists.getFullList(owner relation + published=true)
              └─ PublicListManagementSummary[]
```

The screen renders loading while `listMine` is pending, empty when it returns no summaries, and a generic error state if retrieval fails. It must not print raw PocketBase diagnostics.

## File Changes

| File | Action | Description |
|---|---|---|
| `src/features/items/public-list-repository.ts` | Modify | Add `PublicListManagementSummary` and `listMine`; keep publish/get public route contracts. |
| `src/features/items/pocketbase-public-list-repository.ts` | Modify | Add owner-relation list query and summary mapper; extend collection options for list fields if needed. |
| `src/features/items/my-public-lists-screen.tsx` | Create | Authenticated management UI with cards/rows for title, date, description fallback, and public URL. |
| `src/routes/dashboard.public-lists.tsx` | Create | Guarded route rendering `MyPublicListsScreen`. |
| `src/routes/dashboard.tsx` | Modify | Let `/dashboard/public-lists` render as a full replacement through `Outlet`. |
| `src/components/app/dashboard-overflow-menu.tsx` | Modify | Add `publicLists` view/menu item and icon. |
| `src/i18n/dictionaries.ts` | Modify | Add EN/ES copy for section title, loading, empty, error, description fallback, public URL label/action, and menu label. |
| `src/features/items/dashboard-screen.tsx` | Modify | De-emphasize publish copy as a temporary bridge; do not add management actions there. |
| Tests under `src/features/items/` and `src/test/routes/` | Modify/Create | Cover repository and route/UI behavior. |

## Interfaces / Contracts

`PublicListManagementSummary` is a privacy-safe management projection, not a public page aggregate. The public URL is derived in UI as `/u/${ownerNamespace}/lista/${slug}`. Empty descriptions render a localized fallback such as `No description` without writing data back.

PocketBase adapter requirements:
- require non-empty authenticated `ownerId` before `listMine`; otherwise return `[]` or an auth-safe failure handled by the screen;
- filter by `owner` relation plus `published = true`, never by `ownerNamespace`;
- sort newest first;
- map only summary fields and never expose full email, auth IDs, provider metadata, sessions, tokens, private profile fields, or item data.

## Non-Goals

No composer, import/copy-from-list, item copying, editing, comments, likes, follows, collaboration, drafts, unpublish, delete, or PocketBase schema changes. Dashboard publish remains only a temporary bridge for publishing currently visible dashboard items.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | Repository contract keys, owner-scoped `listMine`, unpublished exclusion, namespace mismatch exclusion, privacy projection. | Extend `public-list-repository.test.ts` and `pocketbase-public-list-repository.test.ts`; assert PocketBase filter uses `owner`, not `ownerNamespace`. |
| Integration | Auth guard, dedicated route, overflow navigation, loading/empty/error/content states, absent out-of-scope actions. | Extend `dashboard-nested-routes.test.tsx`; add `my-public-lists-screen.test.tsx`. |
| Verification | Build safety. | Run `npx pnpm test`, `npx pnpm typecheck`, and `npx pnpm build`. |

## Review Budget / Slices

400-line budget risk: Medium. Recommended slices: (1) repository contract + PocketBase tests; (2) route, screen, i18n, navigation, and dashboard publish copy. Keep each slice independently testable.

## Migration / Rollout

No data migration required. Existing published URLs continue to use `/u/{username}/lista/{slug}`.

## Open Questions

None.
