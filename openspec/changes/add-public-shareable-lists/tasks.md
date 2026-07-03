# Tasks: Add Public Shareable Lists

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 650-900 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 foundation/schema evidence → PR 2 public route/page → PR 3 publish entry point |
| Delivery strategy | auto-forecast |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Public aggregate, repository contracts, PocketBase schema/rule evidence | PR 1 | Includes mapper/privacy tests; no public UI yet. |
| 2 | Public read route and read-only presentation | PR 2 | Depends on PR 1; includes route/page tests. |
| 3 | Authenticated publish entry point and localized copy | PR 3 | Depends on PR 1/2; includes publish and i18n tests. |

## Phase 1: Foundation and Persistence Boundary

- [x] 1.1 Create `src/features/items/public-list-types.ts` with `PublicList`, `PublicListItem`, `PublicOwnerProjection`, and slug/namespace helpers.
- [x] 1.2 Create `src/features/auth/public-profile.ts` helpers for safe owner display name, avatar URL, initial, and email-prefix fallback.
- [x] 1.3 Create `src/features/items/public-list-repository.ts` with publish/read contracts and test helpers; exclude import/copy/edit/social methods.
- [x] 1.4 Create `src/features/items/pocketbase-public-list-repository.ts` mapper for publish payloads and owner+slug public lookup projections.
- [x] 1.5 Add PocketBase `public_lists` schema/rule evidence under the project schema/docs location used for PocketBase changes.

## Phase 2: Public Read UI and Routing

- [x] 2.1 Create `src/features/items/public-list-page.tsx` for read-only title, date, description, items, owner name, avatar, and gradient initial fallback.
- [x] 2.2 Create `src/routes/u.$username.lista.$slug.tsx` with unauthenticated lookup and not-found state; do not wrap with `PocketBaseAuthGate`.
- [x] 2.3 Update `src/i18n/dictionaries.ts` with public list labels, empty/not-found text, and privacy-safe owner copy.

## Phase 3: Authenticated Publish Entry Point

- [ ] 3.1 Modify `src/features/items/dashboard-screen.tsx` or its shell to expose authenticated publish only from private dashboard context.
- [ ] 3.2 Wire publish action to `PublicListRepository.publishList()` using selected display-only item data; preserve private editable source records.
- [ ] 3.3 Ensure public UI and dashboard publish flow expose no import, copy, public editing, comments, likes, follows, social graph, or collaboration controls.

## Phase 4: Tests and Verification

- [x] 4.1 Add unit tests for slug/namespace normalization, same-owner collision errors, cross-owner slug allowance, and empty normalization rejection.
- [x] 4.2 Add privacy/projection tests proving no full email, owner relation, raw auth IDs, sessions, tokens, provider metadata, or private fields reach `PublicList`.
- [x] 4.3 Add owner projection tests for username preference, email-prefix-only fallback, avatar image, and gradient initial fallback.
- [x] 4.4 Add page/route tests for `/u/ana/lista/summer-books`, missing list not-found, read-only item rendering, and absent out-of-scope actions.
- [ ] 4.5 Add publish tests for authenticated creation, unauthenticated rejection, deterministic collision handling, and private source remaining private.
- [x] 4.6 Verify PocketBase schema/rules evidence covers public-read-only published records plus owner-only create/update/delete/unpublish.
- [x] 4.7 Run `npx pnpm test`, `npx pnpm typecheck`, and `npx pnpm build`; document any manual inspection limitations.
