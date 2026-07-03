# Design: Rich Public List Composer

## Technical Approach

Extract the dashboard add drawer into a target-agnostic rich composer. Dashboard keeps using it to create private `InterestItem` records; the public-list editor uses the same fields to append `PublicListItem` snapshots through `updateManagedList`. Public pages reuse the dashboard display preference model for `cards`, `list`, and `covers`, but render read-only public item variants with only a copy-to-dashboard action.

## Architecture Decisions

| Area | Choice | Alternatives considered | Rationale |
|------|--------|-------------------------|-----------|
| Composer seam | Create a shared rich composer value/form layer in `add-flow.tsx` (or adjacent file) with `onSubmit(values)`; keep `AdaptiveAddFlow` as the private-interest wrapper. | Keep a separate public-list form; make public editor call private repository. | Reuses title/category/notes/tags/cover UX without coupling public-list snapshots to dashboard writes. |
| Snapshot mapping | Centralize mapping in `public-list-item-mapper.ts`: `InterestItem -> PublicListItem`, `RichInterestFormValues -> PublicListItem`, `PublicListItem -> CreateInterestItemInput`. | Inline mappings per screen. | Makes field preservation testable and prevents drift. |
| Cover behavior | Preserve `coverImageUrl`, `coverProvider`, and `coverMatchedTitle` as metadata only; do not upload, proxy, or copy image files. | Fetch and store cover files. | Current data model stores URL metadata; file copying would expand backend scope. |
| Public display preference | Reuse `DashboardDisplayPreference` and control with a public-list storage key, defaulting to `cards`. | Server persistence or one shared dashboard key. | Keeps unauthenticated reads stateless and avoids changing user/profile schema. |
| Duplicate copy prevention | Before `createItem`, compare existing dashboard items by category, normalized title, notes, tags, and cover metadata. | Add copied-source fields to interests. | Meets this slice without schema changes; exact historical provenance remains out of scope. |
| Privacy projection | Keep raw `owner` relation ids, full email values, auth tokens, sessions, provider metadata, and private auth fields out of `PublicList`, `PublicListItem`, public renderers, and copy payloads. | Expose PocketBase records directly to public components. | Public pages are read-only projections; authenticated copy should copy visible item fields only, never private ownership/auth data. |

## Data Flow

```text
Owner editor -> Rich composer values -> PublicListItem snapshot -> updateManagedList(items)
Visitor public page -> display mode -> public renderer -> copy action -> InterestRepository.createItem(pending)
```

Copy failures never mutate the public list. Editor save failures restore the prior committed list state and show an alert/status message.

## Privacy Boundaries

- Public route loaders and renderers continue mapping PocketBase records through `PublicList` projections instead of passing raw PocketBase records to UI components.
- `PublicList` exposes only safe owner display data (`displayName`, `initial`, optional public avatar URL, namespace/slug) and never exposes raw owner relation ids, full emails, auth tokens, sessions, provider metadata, or private auth fields.
- `PublicListItem` and copy-to-dashboard payloads include only visible item fields: category, title, optional notes, tags, and cover metadata. Copying a public item to a dashboard creates a new private interest for the authenticated user; it does not copy public-list owner identity or source-record authorization fields.
- The PocketBase `owner` relation may remain filterable in collection responses for client SDK needs, but app-level public models and UI must omit it.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/features/items/add-flow.tsx` or `rich-interest-composer.tsx` | Modify/Create | Extract reusable rich fields, cover lookup, tags, and submit contract. |
| `src/features/items/public-list-editor-screen.tsx` | Modify | Replace simple list-only form with drawer-based rich composer; append snapshots only. |
| `src/features/items/public-list-item-mapper.ts` | Modify | Add bidirectional mapping helpers and duplicate match helper. |
| `src/features/items/public-list-page.tsx` | Modify | Add display preference control, cards/list/covers renderers, copy action, and failure states. |
| `src/routes/u.$username.lista.$slug.tsx` | Modify | Keep public loader unauthenticated; allow page-level optional auth/client for copy. |
| `docs/pocketbase-public-lists-collection.json` | Verify/Modify | Ensure `items` JSON remains `required: false` and documents empty arrays. |
| `src/i18n/*` | Modify | Add public editor/copy/display messages. |

## Interfaces / Contracts

```ts
type RichInterestFormValues = {
  category: Category
  title: string
  notes?: string
  tags: string[]
  coverImageUrl?: string
  coverProvider?: CoverProvider
  coverMatchedTitle?: string
}
```

- `RichInterestFormValues -> PublicListItem`: generate list-only id, trim title/notes, preserve tags and cover metadata.
- `PublicListItem -> CreateInterestItemInput`: copy same visible fields; repository creates `status: 'pending'`.
- `InterestItem -> PublicListItem`: keep existing `mapInterestItemToPublicListItem` behavior.

## UX / Failure Handling

The public-list editor shows “add rich item” as the same drawer experience as dashboard add. During save, disable submit and keep the committed list visible. On failure, close nothing, show an alert, and leave membership unchanged. Public copy shows login guidance when unauthenticated, pending/success state when authenticated, and a non-destructive error if dashboard persistence fails or a duplicate exists.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|--------------|----------|
| Unit | Mapping, cover preservation, duplicate matching, PocketBase empty `items`. | Vitest mapper/repository tests. |
| Component | Rich public editor drawer, failure rollback, public display modes, copy auth gate. | Testing Library with injected repositories/auth context. |
| Route | Public route remains readable unauthenticated and supports copy UI when auth exists. | Existing route harness plus public page tests. |
| Verification | Full project health. | `npx pnpm typecheck`, `npx pnpm test`, `npx pnpm build`. |

## Migration / Rollout

No data migration required. PocketBase collection docs must continue marking `public_lists.items` JSON as non-required so `items: []` remains valid.

## Review Slices

Use stacked-to-main if the forecast exceeds 400 changed lines: (1) composer extraction + mapper tests, (2) public-list editor rich snapshots, (3) public page display modes, (4) copy-to-dashboard auth/action, (5) failure/privacy/docs hardening if slice 4 approaches the review budget.

## Non-Goals

No social features, collaboration, delete/unpublish, analytics, new collections, real-time sync, or automatic owner-dashboard creation from list-only items.

## Open Questions

- None blocking; display persistence and cover behavior use the assumptions above.
