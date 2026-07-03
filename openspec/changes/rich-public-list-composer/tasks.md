# Tasks: Rich Public List Composer

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 650-900 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 composer+mapper → PR 2 editor snapshots → PR 3 display modes → PR 4 copy action → PR 5 hardening if needed |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Extract reusable composer and mapper coverage | PR 1 | Base `main`; include mapper/duplicate tests. |
| 2 | Replace minimal editor form with rich list-only snapshots | PR 2 | Base PR 1; avoid unrelated AppShell/docs dirty changes. |
| 3 | Add public cards/list/covers display modes | PR 3 | Base PR 2; reuse dashboard display control/storage pattern. |
| 4 | Add auth-gated copy-to-dashboard action | PR 4 | Base PR 3; create `pending` dashboard interest only. |
| 5 | Harden failure/privacy/docs if PR 4 grows | PR 5 | Base PR 4; keep PocketBase docs and privacy checks focused. |

## Phase 1: Composer And Mapper Foundation

- [ ] 1.1 Extract `RichInterestFormValues` and reusable rich composer from `src/features/items/add-flow.tsx` or create `src/features/items/rich-interest-composer.tsx`; keep `AdaptiveAddFlow` dashboard behavior unchanged.
- [ ] 1.2 Update `src/features/items/public-list-item-mapper.ts` with `RichInterestFormValues -> PublicListItem`, `PublicListItem -> CreateInterestItemInput`, and duplicate-match helpers.
- [ ] 1.3 Add/extend mapper tests for trim behavior, tags, cover metadata preservation, pending copy input, and duplicate matching.

## Phase 2: Public Editor Rich Snapshots

- [ ] 2.1 Replace the existing quick minimal list-only form in `src/features/items/public-list-editor-screen.tsx` with the rich composer; do not layer both forms.
- [ ] 2.2 Persist new rich list-only items through `updateManagedList(items)` only; assert no private dashboard repository write occurs.
- [ ] 2.3 Add `src/i18n/dictionaries.ts` messages for rich public editor labels, saving, success, and failure states.
- [ ] 2.4 Extend `src/features/items/public-list-editor-screen.test.tsx` for rich fields, rollback on update failure, and existing-interest add preservation.

## Phase 3: Public Page Display Modes

- [ ] 3.1 Update `src/features/items/public-list-page.tsx` to support `cards`, `list`, and `covers` with public read-only item renderers.
- [ ] 3.2 Reuse `DashboardDisplayPreference` with a public-list storage key and default `cards` without changing server schema.
- [ ] 3.3 Extend public page/route tests for switching all display modes and absence of editor/social controls.

## Phase 4: Copy To Dashboard

- [ ] 4.1 Wire optional auth/client in `src/routes/u.$username.lista.$slug.tsx` without making public reads require login.
- [ ] 4.2 Add per-item copy action in `src/features/items/public-list-page.tsx`; unauthenticated users see login guidance and no dashboard write.
- [ ] 4.3 For authenticated users, map public item fields to `CreateInterestItemInput` and create a personal interest with status `pending`.
- [ ] 4.4 Add tests for authenticated copy, unauthenticated gate, copy failure preserving list membership, and duplicate prevention.

## Phase 5: Hardening And Verification

- [ ] 5.1 Verify public projections omit raw owner ids, full emails, auth tokens, sessions, provider metadata, and private auth fields.
- [ ] 5.2 Verify/update `docs/pocketbase-public-lists-collection.json` so `items` remains non-required and `items: []` is documented.
- [ ] 5.3 Keep existing dirty AppShell/global header and PocketBase docs changes out of this change unless explicitly accepted.
- [ ] 5.4 Run `npx pnpm typecheck`, `npx pnpm test`, and `npx pnpm build`; document manual responsive inspection limits.
