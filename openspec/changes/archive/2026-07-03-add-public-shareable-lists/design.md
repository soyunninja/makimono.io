# Design: Add Public Shareable Lists

## Technical Approach

Add a read-only public-list aggregate beside the existing private `InterestRepository`. Publishing copies selected authenticated item display data into a PocketBase-backed public projection, then public reads load only that projection by owner namespace and slug. The public route is unauthenticated and cannot mutate, import, copy, comment, like, follow, or collaborate. Public reads must use a projection that excludes raw auth/user relation fields.

## Architecture Decisions

| Area | Choice | Tradeoff / Rationale |
|------|--------|----------------------|
| Aggregate boundary | Create `PublicListRepository` and `PublicList` types separate from `InterestRepository`. | Prevents public UI from accidentally receiving private editable item records or repository methods. |
| Persistence | Add a `public_lists` PocketBase collection with public read rules and authenticated owner-only create/update rules. | Keeps the MVP on approved PocketBase persistence without adding another backend. |
| Route | Use `/u/$username/lista/$slug` via a TanStack route file such as `src/routes/u.$username.lista.$slug.tsx`. | Matches the requested username+slug share URL and existing file-route style. |
| Owner identity | Store/render a `PublicOwnerProjection` with `displayName`, `avatarUrl`, and `initial`; derive email prefix when username is absent. | Allows any authenticated user to publish while avoiding full email, provider metadata, sessions, or raw auth IDs in public output. |
| Avatar fallback | Reuse the profile-avatar pattern but make the public page fallback larger with a gradient background. | Consistent semantics, stronger public-page visual treatment. |
| Scope | Publish entry point only from authenticated dashboard context; public page remains read-only. | Protects review size and keeps import/copy work explicitly deferred. |

## Data Flow

```text
Dashboard publish action ──→ PublicListRepository.publishList()
  private InterestItem[]     └─→ PocketBase public_lists projection

/u/$username/lista/$slug ──→ PublicListRepository.getByOwnerAndSlug()
                         └─→ PublicListPage (read-only fields only)
```

Lookup uses normalized `ownerNamespace` and `slug`. `ownerNamespace` is the normalized username when present, otherwise the normalized email prefix before `@`. Both values are lowercased, trimmed, dash-separated, limited to `[a-z0-9-]`, and rejected when empty after normalization. PocketBase should enforce unique `ownerNamespace + slug`; collision attempts for the same owner namespace return a deterministic validation error instead of overwriting an existing public list. Slug collisions are allowed across different owner namespaces.

## PocketBase Collection / Rules

High-level `public_lists` schema:

| Field | Purpose |
|-------|---------|
| `owner` relation to `users` | Owner authorization for private/authenticated repository operations only; excluded from public read projections. |
| `ownerNamespace` text | Route namespace: normalized username, or normalized email prefix when no username exists. |
| `ownerDisplayName` text | Username/name/email-prefix fallback only. |
| `ownerAvatar` file or URL text | Public avatar representation. |
| `slug` text | Normalized list slug. |
| `title`, `listDate`, `description` | Public page header fields. |
| `items` JSON | Read-only item display data: title, category, optional notes/tags/cover. |
| `publishedAt`, `updatedAt` | Public metadata. |

Rules: public read only for published records; create/update only when `@request.auth.id = owner`; delete/unpublish owner-only. The public repository MUST map PocketBase records into a `PublicList` projection that omits `owner`, email, sessions, tokens, provider metadata, raw auth IDs, and private profile fields before data reaches public UI. If PocketBase rules cannot hide the owner relation from unauthenticated reads, public reads must use a projection endpoint/collection that does not include that relation.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/features/items/public-list-types.ts` | Create | Public aggregate, owner projection, slug helpers. |
| `src/features/items/public-list-repository.ts` | Create | Repository contract and mock/test helpers. |
| `src/features/items/pocketbase-public-list-repository.ts` | Create | PocketBase mapper, publish payload, owner+slug lookup. |
| `src/features/items/public-list-page.tsx` | Create | Read-only public page with owner avatar/name, title, date, description, items. |
| `src/routes/u.$username.lista.$slug.tsx` | Create | Public route; no `PocketBaseAuthGate`. |
| `src/features/items/dashboard-screen.tsx` / shell | Modify | Add authenticated publish entry point without exposing public actions. |
| `src/features/auth/public-profile.ts` | Modify | Add safe public owner projection and email-prefix fallback helper. |
| `src/lib/pocketbase.ts` | Modify | Extend minimal collection reads for filtered public lookup if needed. |
| `src/i18n/dictionaries.ts` | Modify | Public list labels, not-found, publish copy. |
| `src/**/*.test.*` | Modify/Create | Repository, route, page, privacy, and fallback coverage. |

## Interfaces / Contracts

```ts
type PublicList = {
  id: string
  owner: PublicOwnerProjection
  ownerNamespace: string
  slug: string
  title: string
  listDate: string
  description?: string
  items: PublicListItem[]
  publishedAt: string
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | slug/namespace normalization, collision validation handling, owner projection, email-prefix-only fallback, PocketBase mapping | Vitest mapper/helper tests. |
| Integration | public page fields, avatar image/fallback, absent edit/import/copy controls | Testing Library component tests. |
| Route | `/u/ana/lista/summer-books` resolves, missing list shows not found | TanStack memory-router route tests. |
| Privacy | public API/projection shape excludes owner relation, raw IDs, email, auth metadata, and private fields | Repository mapper tests inspect returned public data, not only rendered UI. |
| Verification | full project confidence | Run `npx pnpm test`, `npx pnpm typecheck`, `npx pnpm build`. |

## Migration / Rollout

PocketBase schema/rules must be applied before enabling publish. No private-interest data migration is required because publishing creates a new projection. Review-budget risk is medium/high; likely slices: (1) public aggregate/repository/schema notes, (2) public route/page, (3) authenticated publish entry point and localized copy.

## Open Questions

None. The first slice allows any authenticated user to publish; users without a username publish under the derived email-prefix namespace, while the full email remains private.
